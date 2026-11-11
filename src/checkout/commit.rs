//! Native final admission and one atomic order, stock, cart, payment-attempt and outbox commit; no external provider call.
use super::state::{Committed, Locked, Prepared, Priced};
use crate::marketing;
use crate::{
    App, RequestContext, Result, accounts, agent_runs, apps, assets, b2b, bad, checkout_review,
    commerce, conflict, header, json, operations, payments, pos, staging, uid, verified_kernel,
};
use sqlx::Row;
use veyndo_commerce::inventory::InventoryLines;
pub(super) async fn run(
    a: &App,
    h: &RequestContext,
    key: &str,
    locked: Locked,
    priced: Priced,
    review: Option<&super::session_order::Review>,
) -> Result<Committed> {
    let Locked {
        mut tx,
        cart: mut c,
        prepared,
        fingerprint,
    } = locked;
    let Prepared {
        prepared_policy,
        locale_chain,
        ..
    } = prepared;
    let Priced {
        mut q,
        config,
        money,
        minor,
        selected,
        legal_snapshot,
    } = priced;
    checkout_review::validate(h, &c, &q, minor)?;
    if let Some(review) = review {
        review.admit_channel(&mut tx, &c).await?;
        review.check_quote(&q, &legal_snapshot["policyVersion"], minor)?;
    }
    if config.is_business(&c.data.group) {
        let digest: String =
            sqlx::query_scalar("SELECT digest FROM extensions WHERE tenant=$1 FOR SHARE")
                .bind(&c.tenant)
                .fetch_one(&mut *tx)
                .await?;
        let sandbox = prepared_policy
            .as_ref()
            .filter(|s| s.digest() == digest)
            .ok_or(conflict(
                "Business policy changed during checkout; retry your reviewed purchase",
            ))?;
        if !sandbox.approve(minor, 100_000).map_err(bad)? {
            return Err(conflict("Company purchase rejected by tenant extension"));
        }
    }
    q["price"]["totalMinor"] = json!(minor.to_string());
    let procurement = b2b::check_locked(
        &mut tx,
        h,
        &c,
        &q,
        u64::try_from(minor).map_err(|_| bad("Invalid company total"))?,
    )
    .await?;
    operations::admit_admin_payment(&c, &q)?;
    let external = q["paymentMethod"]["mode"] == "app";
    if external && staging::parent_conn(&mut tx, &c.tenant).await?.is_some() {
        return Err(bad("External payments are disabled in private sandboxes"));
    }
    if external && q["paymentMethod"]["provider"].is_null() {
        payments::account(&c.tenant)?;
        payments::base()?;
        if (selected.payment_method_id == "paypal-live") != (payments::environment() == "live") {
            return Err(bad("Payment method environment mismatch"));
        }
    }
    // Financial providers/manual invoices require usable contact and billing data.
    // The explicit simulated demo method keeps legacy headless fixture carts compatible.
    pos::validate_settlement(h, &c, &q, &config, minor)?;
    if !verified_kernel::checkout_contact_admissible(
        q["paymentMethod"]["mode"] == "simulated"
            || (q["paymentMethod"]["mode"] == "cash" && h.pos.is_some()),
        c.data.email.is_some(),
        selected.billing_address.is_some(),
    ) {
        return Err(bad("Customer email and billing address required"));
    }
    let customer_snapshot = accounts::order_snapshot(&mut tx, &c, &selected).await?;
    let id = uid();
    // Explicit simulated authorization: no external money is charged.
    let mut order = json!({"id":id,"orderNumber":format!("RAC-{}",&id[..8]),"cart":q,"state":"placed","channel":c.data.channel,"revision":1,"deliveries":q["deliveries"],"payment":{"method":q["paymentMethod"],"provider":if q["paymentMethod"]["mode"]=="simulated"{"simulated"}else{"manual"},"state":if q["paymentMethod"]["mode"]=="simulated"{"authorized"}else{"pending"},"realMoneyCharged":false},"customerGroup":c.data.group});
    if let Some(review) = review {
        order["checkoutSessionId"] = json!(review.session());
    }
    order["cart"]["locale"] = json!(locale_chain.first());
    apps::native_lifecycle::bind_order(&mut tx, &c.tenant, &mut order).await?;
    operations::admin_order(&c, &mut order);
    order["money"] = json!(money);
    order["currencyContext"] = q["currencyContext"].clone();
    order["legal"] = legal_snapshot;
    if let Some(p) = &procurement {
        order["b2b"] = json!({"companyId":p.company_id,"unitId":p.context.unit_id,"purchaseOrder":p.context.purchase_order,"approvalId":p.approval,"quoteId":p.context.quote_id});
    }
    order
        .as_object_mut()
        .unwrap()
        .extend(customer_snapshot.as_object().unwrap().clone());
    pos::settle(&mut tx, h, &c, &mut order).await?;
    commerce::order_fields(&mut order);
    sqlx::query("INSERT INTO orders(id,tenant,cart_id,idempotency_key,fingerprint,data) VALUES($1,$2,$3,$4,$5,$6)").bind(&id).bind(&c.tenant).bind(&c.id).bind(key).bind(&fingerprint).bind(&order).execute(&mut *tx).await?;
    b2b::record(&mut tx, &c, &id, procurement.as_ref()).await?;
    b2b::consume_quote(&mut tx, &c, &id).await?;
    let inventory = InventoryLines::new(c.data.items.iter().map(|i| (i.id.as_str(), i.quantity)))?;
    commerce::inventory::allocate(&mut tx, &c.tenant, &inventory, &id).await?;
    marketing::record_uses(&mut tx, &c.tenant, &id, &q).await?;
    assets::snapshot(&mut tx, &c, &id).await?;
    if external {
        let return_origin = if q["paymentMethod"]["provider"].is_string() {
            match header(h, "origin") {
                Some(origin) => Some(
                    payments::sessions::origin_conn(
                        &mut tx,
                        &c.tenant,
                        &c.data.sales_channel,
                        Some(origin),
                    )
                    .await?,
                ),
                None => None,
            }
        } else {
            None
        };
        payments::prepare(&mut tx, &c, &mut order, minor, return_origin.as_deref()).await?;
        if let Some(review) = review {
            review.check_prepared_payment(&order["payment"])?;
        }
        payments::prepare_funding(&mut tx, h, &c, &order).await?;
        commerce::order_fields(&mut order);
        sqlx::query("UPDATE orders SET data=$1 WHERE id=$2")
            .bind(&order)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    }
    commerce::inventory::consume(&mut tx, &c.tenant, &inventory).await?;
    c.data.order = Some(order.clone());
    sqlx::query("UPDATE carts SET status='completed',data=$1,revision=revision+1 WHERE id=$2")
        .bind(json!(c.data))
        .bind(&c.id)
        .execute(&mut *tx)
        .await?;
    if !external && let Some(e)=sqlx::query("UPDATE exposures SET rewarded=true WHERE tenant=$1 AND session=$2 AND rewarded=false RETURNING variant").bind(&c.tenant).bind(&c.data.session).fetch_optional(&mut *tx).await? {
        sqlx::query("UPDATE policy SET purchases=purchases+1 WHERE tenant=$1 AND variant=$2").bind(&c.tenant).bind(e.get::<String,_>("variant")).execute(&mut *tx).await?;
    }
    sqlx::query("INSERT INTO outbox(tenant,kind,data) VALUES($1,'order.placed',$2)")
        .bind(&c.tenant)
        .bind(json!({"orderId":id,"totalMinor":minor}))
        .execute(&mut *tx)
        .await?;
    agent_runs::checkpoint::fence_commit(a, &mut tx).await?;
    tx.commit().await?;
    Ok(Committed {
        order,
        cart: c,
        method: selected.payment_method_id,
    })
}
