//! Authoritative native quote uses locked products/settings, original taxes, promotions, App hooks, POS and stock checks.
use super::state::{Locked, Priced};
use crate::{
    Error, RequestContext, Result, StatusCode, apps, b2b, bad, checkout_products, commerce,
    conflict, currencies, header, legal, marketing, operations, payments, pos, quote,
    verified_kernel,
};
use sqlx::Row;
pub(super) async fn run(h: &RequestContext, locked: &mut Locked) -> Result<Priced> {
    let c = &locked.cart;
    let tx = &mut locked.tx;
    let ids: Vec<String> = c.data.items.iter().map(|i| i.id.clone()).collect();
    let parents:Vec<String>=sqlx::query_scalar("SELECT DISTINCT parent_id FROM products WHERE tenant=$1 AND id=ANY($2) AND parent_id IS NOT NULL").bind(&c.tenant).bind(&ids).fetch_all(&mut **tx).await?;
    let mut locks = ids.clone();
    locks.extend(parents);
    locks.sort();
    locks.dedup();
    let rows =
        sqlx::query("SELECT * FROM products WHERE tenant=$1 AND id=ANY($2) ORDER BY id FOR UPDATE")
            .bind(&c.tenant)
            .bind(locks)
            .fetch_all(&mut **tx)
            .await?;
    // Recheck the new catalog admission under product locks: edits cannot deactivate/hide a SKU
    // between the initial request check and the authoritative inventory/price snapshot.
    if rows.iter().any(|r| !r.get::<bool, _>("active")) {
        return Err(Error(StatusCode::NOT_FOUND, "Product unavailable".into()));
    }
    let hidden: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM product_channel_visibility WHERE tenant=$1 AND product_id=ANY($2) AND channel_id=$3 AND NOT visible)")
        .bind(&c.tenant).bind(rows.iter().map(|r|r.get::<String,_>("id")).collect::<Vec<_>>())
        .bind(marketing::channel_id(h)).fetch_one(&mut **tx).await?;
    if hidden {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "Product hidden in this sales channel".into(),
        ));
    }
    let mut ps = checkout_products::snapshot(
        tx,
        c,
        rows,
        &locked.prepared.language_chain,
        &locked.prepared.locale_chain,
    )
    .await?;
    operations::admit_admin_products(tx, c).await?;
    b2b::contract_prices(tx, c, &mut ps).await?;
    // Configuration cannot change between this price calculation and order commit.
    let (config, settings_revision) =
        commerce::scoped_locked(tx, &c.tenant, &c.data.sales_channel).await?;
    if c.data.admin_actor.is_some() {
        operations::check_admin_customer(tx, c).await?;
    }
    let code = config.currencies.selected(&c.data.currency)?.code.clone();
    if let Some(requested) = header(h, "x-commerce-currency")
        && requested != code
    {
        return Err(conflict("Checkout currency changed; review again"));
    }
    let config =
        payments::currency_methods_conn(tx, &c.tenant, &c.data.sales_channel, &code, config)
            .await?;
    if h.pos.is_some() {
        pos::check_locked(tx, h, c).await?;
    }
    let legal_snapshot = legal::snapshot(tx, c, &config, &ps).await?;
    let selected = commerce::selection(&c.data);
    for address in [&selected.address, &selected.billing_address]
        .into_iter()
        .flatten()
    {
        commerce::validate_address_geography(address, &config)?;
    }
    apps::validate_configurations(tx, c, &locked.prepared.prepared_apps).await?;
    if selected.shipping_method_id != "pickup"
        && selected.address.is_none()
        && !ps.iter().all(|p| p.extra["digital"] == true)
    {
        return Err(bad("Delivery address required"));
    }
    let taxes = commerce::tax_settings_for_cart(tx, c, &ps, &config).await?;
    let priced = commerce::tax_products(&ps, &selected, &taxes)?;
    let mut q = commerce::enrich(
        marketing::promote(
            tx,
            c,
            commerce::enrich(
                quote(c, &priced, &config)?,
                c,
                &priced,
                &config,
                settings_revision,
            )?,
        )
        .await?,
        c,
        &priced,
        &config,
        settings_revision,
    )?;
    q = apps::apply_hooks(
        tx,
        c,
        &priced,
        q,
        &config,
        settings_revision,
        &locked.prepared.prepared_hooks,
    )
    .await?;
    q = pos::adjust_quote(c, q, &priced, &config, settings_revision)?;
    commerce::dates_conn(tx, &mut q).await?;
    for i in &c.data.items {
        let p = ps.iter().find(|p| p.id == i.id).unwrap();
        if !u64::try_from(p.stock)
            .is_ok_and(|stock| verified_kernel::stock_admissible(stock, u64::from(i.quantity)))
        {
            return Err(conflict("Insufficient stock"));
        }
    }
    let currency = config.currencies.selected(&c.data.currency)?;
    let money = currencies::amount(
        q["price"]["totalPrice"]
            .as_f64()
            .ok_or(bad("Invalid total"))?,
        &currency.code,
        currency.scale,
    )?;
    let minor = money.minor();

    Ok(Priced {
        q,
        config,
        money,
        minor,
        selected,
        legal_snapshot,
    })
}
