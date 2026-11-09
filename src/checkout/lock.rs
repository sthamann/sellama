//! Native lock and replay admission use the original ordered transaction, cart capability and current B2B/POS checks.
use super::Admission;
use super::state::{Locked, Prepared};
use crate::json;
use crate::{
    App, RequestContext, Result, b2b, bad, conflict, hash, history, operations, pos, stored,
    tenant, token, verified_kernel,
};
use sqlx::Row;
pub(super) async fn run(
    a: &App,
    h: &RequestContext,
    key: &str,
    prepared: Prepared,
    review: Option<&super::session_order::Review>,
) -> Result<Admission<Locked>> {
    let Prepared { admitted, .. } = &prepared;
    let mut tx = a.db.begin().await?;
    history::context(&mut tx, h, "checkout").await?;
    let lock_key = format!("{}:{key}", tenant(h)?);
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))")
        .bind(lock_key)
        .execute(&mut *tx)
        .await?;
    operations::lock_admin_checkout(&mut tx, admitted).await?;
    let r = sqlx::query("SELECT * FROM carts WHERE tenant=$1 AND token=$2 FOR UPDATE")
        .bind(tenant(h)?)
        .bind(token(h)?)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(bad("Cart not found"))?;
    let c = stored(&r)?;
    pos::guard_cart(h, &c)?;
    b2b::lock_unit(&mut tx, &c).await?;
    b2b::guard_conn(&mut tx, h, &c).await?;
    if let Some(review) = review {
        review.admit_locked(&mut tx, h, &c).await?;
    }
    if c.data.locale != admitted.data.locale {
        return Err(conflict("Checkout language changed; review again"));
    }
    if c.data.customer_id.is_some()
        && let Some(email) = &c.data.email
    {
        history::customer_context(&mut tx, email).await?;
    }
    let mut purchase = json!({"items":c.data.items,"checkout":c.data.checkout,"group":c.data.group,"buyer":c.data.buyer,"coupons":c.data.coupons,"salesChannel":c.data.sales_channel,"currency":c.data.currency,"b2b":c.data.b2b});
    if !c.data.app_configurations.is_empty() {
        purchase["appConfigurations"] = json!(c.data.app_configurations);
    }
    if h.pos.is_some() {
        if let Some(discount) = &c.data.pos_discount {
            purchase["posDiscount"] = json!(discount);
        }
        if let Some(customer) = &c.data.customer_id {
            purchase["posCustomer"] = json!(customer);
        }
        purchase["posTender"] = json!(h.pos.as_ref().and_then(|p| p.tender_minor));
    }
    operations::admin_purchase(&c, &mut purchase);
    let fingerprint = hash(&format!("{}:{}", c.id, purchase));
    if let Some(r) = sqlx::query(
        "SELECT data,fingerprint,cart_id FROM orders WHERE tenant=$1 AND idempotency_key=$2",
    )
    .bind(&c.tenant)
    .bind(key)
    .fetch_optional(&mut *tx)
    .await?
    {
        if !verified_kernel::replay_admissible(
            r.get::<String, _>("cart_id") == c.id,
            c.status == "open",
            r.get::<String, _>("fingerprint") == fingerprint,
        ) {
            return Err(conflict("Idempotency key was used for another purchase"));
        }
        let order = r.get("data");
        if let Some(review) = review {
            review.admit_channel(&mut tx, &c).await?;
            review.check_replay(&order)?;
        }
        return Ok(Admission::Replay(order));
    }
    if c.status != "open" {
        return Err(conflict("Cart already completed or cancelled"));
    }
    if c.data.items.is_empty() {
        return Err(bad("Cart is empty"));
    }

    Ok(Admission::Active(Locked {
        tx,
        cart: c,
        prepared,
        fingerprint,
    }))
}
