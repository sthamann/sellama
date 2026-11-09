//! Optimistic cart mutations and quantity normalization.
use crate::*;

pub(crate) async fn set_items(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: Option<i64>,
) -> Result<StoredCart> {
    set_cart(a, h, items, expected, None).await
}
pub(crate) async fn set_cart(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: Option<i64>,
    buyer: Option<Option<Value>>,
) -> Result<StoredCart> {
    set_configured_cart(a, h, items, expected, buyer, None).await
}
pub(crate) async fn set_configured_cart(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: Option<i64>,
    buyer: Option<Option<Value>>,
    selections: Option<&[apps::ConfigurationSelection]>,
) -> Result<StoredCart> {
    set_cart_transaction(a, h, items, expected, buyer, selections, None, None, None).await
}

pub(crate) async fn reviewed_cart(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    revision: i64,
    review: &str,
) -> Result<StoredCart> {
    set_cart_transaction(
        a,
        h,
        items,
        Some(revision),
        None,
        None,
        None,
        None,
        Some(review),
    )
    .await
}

pub(crate) async fn preview_items(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    revision: i64,
) -> Result<Value> {
    let c = cart_candidate(a, h, items, Some(revision)).await?;
    let q = cart_json(a, &c).await?;
    Ok(json!({"revision":c.revision,"review":review_digest(&c,&q),
        "lineItems":q["lineItems"],"price":q["price"],"country":q["checkout"]["country"],
        "shippingCosts":q["shippingCosts"],
        "delivery":q["deliveries"][0]["deliveryDate"],
        "shippingMethod":q["deliveries"][0]["shippingMethod"]["name"]}))
}

fn review_digest(c: &StoredCart, quote: &Value) -> String {
    use sha2::{Digest, Sha256};
    // The browser may opt into conditional edits. This fingerprint is a
    // precondition, never a credential or a source of prices.
    format!(
        "{:x}",
        Sha256::digest(
            json!([
                c.id,
                c.revision,
                quote["lineItems"],
                quote["price"],
                quote["checkout"],
                quote["shippingCosts"],
                quote["deliveries"]
            ])
            .to_string()
        )
    )
}
/// Protocol consent and cart contents commit together through the native owners.
pub(crate) async fn set_consented_cart(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: i64,
    buyer: Option<Value>,
    consent: Option<(String, HashMap<String, bool>)>,
    currency: Option<&str>,
) -> Result<StoredCart> {
    set_cart_transaction(
        a,
        h,
        items,
        Some(expected),
        Some(buyer),
        None,
        consent,
        currency,
        None,
    )
    .await
}
async fn cart_candidate(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: Option<i64>,
) -> Result<StoredCart> {
    validate_items(&items)?;
    for i in &items {
        marketing::admit_product(a, h, &i.id).await?;
    }
    // Validate the candidate before taking a cart lock. These helpers use the
    // pool: holding one connection per edit while requesting another can exhaust
    // the pool and deadlock concurrent edits. The revision is checked again below.
    let mut c = load_cart(a, h).await?;
    if c.status != "open" {
        return Err(conflict("Cart is terminal"));
    }
    if expected.is_some_and(|v| v != c.revision) {
        return Err(conflict("Cart revision changed; reload before editing"));
    }
    let (_, chain) = language_context(a, h).await?;
    let ps = commerce::cart_products(a, &c.tenant, &chain, &items).await?;
    c.data.items = items
        .into_iter()
        .map(|mut item| {
            let p = ps
                .iter()
                .find(|p| p.id == item.id)
                .ok_or(bad("Unknown product"))?;
            item.quantity = normalized_quantity(p, item.quantity)?;
            Ok(item)
        })
        .collect::<Result<Vec<_>>>()?;
    c.data.locale = language_context(a, h).await?.0;
    Ok(c)
}

#[allow(clippy::too_many_arguments)]
async fn set_cart_transaction(
    a: &App,
    h: &RequestContext,
    items: Vec<Item>,
    expected: Option<i64>,
    buyer: Option<Option<Value>>,
    selections: Option<&[apps::ConfigurationSelection]>,
    consent: Option<(String, HashMap<String, bool>)>,
    currency: Option<&str>,
    review: Option<&str>,
) -> Result<StoredCart> {
    let mut c = cart_candidate(a, h, items, expected).await?;
    if let Some(currency) = currency {
        let (settings, _) = commerce::scoped_config(a, &c.tenant, &c.data.sales_channel).await?;
        c.data.currency = settings.currencies.selected(currency)?.code.clone();
    }
    let before = selections.map(|_| c.data.app_configurations.clone());
    if let Some(b) = buyer {
        c.data.buyer = b;
    }
    if let Some(selections) = selections {
        c.data.app_configurations = apps::resolve_selections(a, &c, selections).await?;
        apps::configuration_budget(&c.data.app_configurations)?;
    }
    let modules = if selections.is_some() {
        Some(apps::prepare_configurations(a, &c).await?)
    } else {
        None
    };
    let quote = cart_json(a, &c).await?;
    if review.is_some_and(|value| value != review_digest(&c, &quote)) {
        return Err(conflict(
            "Cart quote changed; review price and delivery again",
        ));
    }
    let mut tx = a.db.begin().await?;
    let locked =
        sqlx::query("SELECT revision,status FROM carts WHERE tenant=$1 AND token=$2 FOR UPDATE")
            .bind(&c.tenant)
            .bind(&c.token)
            .fetch_one(&mut *tx)
            .await?;
    if locked.get::<String, _>("status") != "open" {
        return Err(conflict("Cart is terminal"));
    }
    if locked.get::<i64, _>("revision") != c.revision {
        return Err(conflict("Cart revision changed; reload before editing"));
    }
    b2b::guard_conn(&mut tx, h, &c).await?;
    if let Some(modules) = &modules {
        apps::validate_configurations(&mut tx, &c, modules).await?;
    }
    c.revision += 1;
    sqlx::query("UPDATE carts SET data=$1,revision=$2 WHERE id=$3")
        .bind(json!(c.data))
        .bind(c.revision)
        .bind(&c.id)
        .execute(&mut *tx)
        .await?;
    if let Some(before) = &before {
        apps::configuration_events(&mut tx, &c, before).await?;
    }
    if let Some((policy, choices)) = consent {
        legal::consent_locked(&mut tx, &c, &policy, choices, true).await?;
    }
    agent_runs::checkpoint::fence_commit(a, &mut tx).await?;
    tx.commit().await?;
    Ok(c)
}
