//! Bind an explicitly reviewed session purchase to the native transaction and its original order.
use super::execute;
use crate::*;
use axum::http::header::CACHE_CONTROL;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Review {
    session_id: String,
    cart_id: String,
    customer_id: String,
    cart_revision: i64,
    locale: String,
    currency: String,
    country: String,
    payment_method: String,
    legal_policy_version: String,
    total_minor: String,
    confirmed: bool,
    #[serde(default)]
    paypal_sandbox: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Recovery {
    session_id: String,
    cart_id: String,
    customer_id: String,
}

fn key(session: &str) -> Result<String> {
    let id = uuid::Uuid::parse_str(session).map_err(|_| bad("Invalid checkout session ID"))?;
    if session != id.to_string() {
        return Err(bad("Invalid checkout session ID"));
    }
    Ok(format!("checkout-session-v1:{id}"))
}

fn receipt(order: &Value, session: &str, cart: &str, customer: &str) -> Result<Value> {
    if order["checkoutSessionId"] != session
        || order["cart"]["id"] != cart
        || order["orderCustomer"]["customerId"] != customer
        || order["payment"]["provider"] != "simulated"
        || order["payment"]["realMoneyCharged"] != false
    {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "Checkout receipt unavailable".into(),
        ));
    }
    Ok(json!({
        "sessionId": session,
        "cartId": cart,
        "customerId": customer,
        "orderId": order["id"],
        "orderNumber": order["orderNumber"],
        "orderState": order["state"],
        "paymentState": order["payment"]["state"],
        "currency": order["cart"]["price"]["currency"],
        "totalMinor": order["cart"]["price"]["totalMinor"],
    }))
}

impl Review {
    pub(super) fn session(&self) -> &str {
        &self.session_id
    }

    pub(super) async fn admit_locked(
        &self,
        tx: &mut sqlx::PgConnection,
        h: &RequestContext,
        c: &StoredCart,
    ) -> Result<()> {
        if c.id != self.cart_id
            || c.data.customer_id.as_deref() != Some(&self.customer_id)
            || !c.data.locale.eq_ignore_ascii_case(&self.locale)
            || c.data.sales_channel != marketing::channel_id(h)
            || c.data.admin_actor.is_some()
            || c.data.pos_actor.is_some()
        {
            return Err(conflict("Checkout cart context changed; review again"));
        }
        if b2b::identity(tx, h).await? != self.customer_id {
            return Err(Error(
                StatusCode::FORBIDDEN,
                "Current buyer is required".into(),
            ));
        }
        Ok(())
    }

    pub(super) async fn admit_channel(
        &self,
        tx: &mut sqlx::PgConnection,
        c: &StoredCart,
    ) -> Result<()> {
        let open: Option<bool> = sqlx::query_scalar(
            "SELECT (data->>'active')::boolean AND coalesce(data->>'visibility','public')='public' FROM sales_channels WHERE tenant=$1 AND id=$2 FOR SHARE",
        )
        .bind(&c.tenant).bind(&c.data.sales_channel).fetch_optional(&mut *tx).await?;
        if open != Some(true) || staging::parent_conn(tx, &c.tenant).await?.is_some() {
            return Err(Error(
                StatusCode::FORBIDDEN,
                "A live public channel is required".into(),
            ));
        }
        Ok(())
    }

    pub(super) fn check_quote(&self, q: &Value, policy: &Value, minor: i64) -> Result<()> {
        let method = &q["paymentMethod"];
        if method["mode"] != "simulated" {
            return Err(conflict(
                "The reviewed payment method is unavailable for this checkout profile",
            ));
        }
        if q["revision"] != self.cart_revision
            || q["price"]["currency"] != self.currency
            || q["checkout"]["country"] != self.country
            || q["paymentMethod"]["id"] != self.payment_method
            || policy != &self.legal_policy_version
            || minor.to_string() != self.total_minor
            || q["selectionNeedsConfirmation"] == true
        {
            return Err(conflict("Checkout changed; review your order again"));
        }
        Ok(())
    }

    pub(super) fn check_replay(&self, order: &Value) -> Result<()> {
        receipt(order, &self.session_id, &self.cart_id, &self.customer_id)?;
        let total = order["cart"]["price"]["totalMinor"]
            .as_str()
            .and_then(|value| value.parse().ok())
            .ok_or(conflict("Checkout receipt amount unavailable"))?;
        self.check_quote(&order["cart"], &order["legal"]["policyVersion"], total)
    }
}

pub(crate) async fn confirm_session(
    State(a): State<App>,
    h: RequestContext,
    Json(review): Json<Review>,
) -> Result<impl IntoResponse> {
    if !review.confirmed {
        return Err(bad("Explicit buyer confirmation is required"));
    }
    if review.paypal_sandbox {
        return Err(conflict(
            "Use the simulated payment method for this checkout profile",
        ));
    }
    let key = key(&review.session_id)?;
    let order = execute(&a, &h, &key, Some(&review)).await?;
    Ok((
        [(CACHE_CONTROL, "no-store")],
        Json(receipt(
            &order,
            &review.session_id,
            &review.cart_id,
            &review.customer_id,
        )?),
    ))
}

pub(crate) async fn recover_session(
    State(a): State<App>,
    h: RequestContext,
    Json(input): Json<Recovery>,
) -> Result<impl IntoResponse> {
    let key = key(&input.session_id)?;
    let tenant = tenant(&h)?;
    let mut tx = a.db.begin().await?;
    if b2b::identity(&mut tx, &h).await? != input.customer_id
        || staging::parent_conn(&mut tx, &tenant).await?.is_some()
    {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "Checkout receipt unavailable".into(),
        ));
    }
    let order: Value = sqlx::query_scalar(
        "SELECT data FROM orders WHERE tenant=$1 AND idempotency_key=$2 AND cart_id=$3 AND data->>'salesChannelId'=$4",
    )
    .bind(&tenant).bind(key).bind(&input.cart_id).bind(marketing::channel_id(&h))
    .fetch_optional(&mut *tx).await?
    .ok_or(Error(StatusCode::NOT_FOUND, "Checkout receipt unavailable".into()))?;
    Ok((
        [(CACHE_CONTROL, "no-store")],
        Json(receipt(
            &order,
            &input.session_id,
            &input.cart_id,
            &input.customer_id,
        )?),
    ))
}
