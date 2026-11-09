//! Project the current native cart quote for the independent checkout session service.
use crate::*;
use axum::http::header::CACHE_CONTROL;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct QuoteInput {
    cart_id: String,
    cart_revision: i64,
    customer_id: String,
}

async fn owned_cart(
    a: &App,
    h: &RequestContext,
    cart_id: &str,
    customer_id: &str,
) -> Result<StoredCart> {
    let c = load_cart(a, h).await?;
    if c.id != cart_id || c.data.customer_id.as_deref() != Some(customer_id) {
        return Err(Error(StatusCode::NOT_FOUND, "Cart unavailable".into()));
    }
    b2b::surface_context(a, h, "customerId", customer_id).await?;
    if c.data.admin_actor.is_some()
        || c.data.pos_actor.is_some()
        || staging::parent(a, &c.tenant).await?.is_some()
    {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "A live customer cart is required".into(),
        ));
    }
    Ok(c)
}

pub(crate) async fn quote_session(
    State(a): State<App>,
    h: RequestContext,
    Json(input): Json<QuoteInput>,
) -> Result<impl IntoResponse> {
    let c = owned_cart(&a, &h, &input.cart_id, &input.customer_id).await?;
    if c.status != "open" || c.revision != input.cart_revision || c.data.items.is_empty() {
        return Err(conflict("Open and review the current nonempty cart"));
    }
    let ids = c
        .data
        .items
        .iter()
        .map(|item| item.id.clone())
        .collect::<Vec<_>>();
    for batch in ids.chunks(24) {
        marketing::admit_products(&a, &h, batch).await?;
    }
    let q = cart_price::project_cart(&a, &c, true).await?;
    Ok((
        [(CACHE_CONTROL, "no-store")],
        Json(json!({
            "tenant": c.tenant,
            "customerId": input.customer_id,
            "cartId": c.id,
            "cartRevision": c.revision,
            "salesChannel": c.data.sales_channel,
            "environment": "live",
            "locale": q["locale"],
            "currency": q["price"]["currency"],
            "country": q["checkout"]["country"],
            "totalMinor": q["price"]["totalMinor"],
            "currencyScale": q["price"]["currencyScale"],
            "selectionNeedsConfirmation": q["selectionNeedsConfirmation"],
            "legal": {
                "strictCheckout":q["legal"]["strictCheckout"],
                "requiresDigital":q["legal"]["requiresDigital"],
            },
            "legalPolicyVersion": q["legal"]["policyVersion"],
            "paymentMethod": q["paymentMethod"]["id"],
            "paymentMode": q["paymentMethod"]["mode"],
        })),
    ))
}
