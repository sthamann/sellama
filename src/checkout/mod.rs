//! Expose the commerce host contract through the existing native checkout transaction.
use crate::{App, RequestContext, Result, Value, accounts};
use axum::{Router, routing::post};

pub(crate) mod buyer_identity;
mod commit;
mod lock;
mod prepare;
mod price;
mod session_order;
mod session_quote;
mod state;

pub(crate) fn router() -> Router<App> {
    use crate::auth::SecureRoutes;
    Router::new()
        .secure_route(
            "/api/identity/checkout/introspect",
            &[("POST", "public")],
            post(buyer_identity::inspect),
        )
        .route(
            "/store-api/checkout/session-access",
            post(buyer_identity::issue),
        )
        .route(
            "/store-api/checkout/session-order",
            post(session_order::confirm_session),
        )
        .route(
            "/store-api/checkout/session-receipt",
            post(session_order::recover_session),
        )
        .route(
            "/store-api/checkout/session-quote",
            post(session_quote::quote_session),
        )
}

enum Admission<Locked> {
    Active(Locked),
    Replay(Value),
}

pub(crate) async fn execute(
    a: &App,
    h: &RequestContext,
    key: &str,
    review: Option<&session_order::Review>,
) -> Result<Value> {
    let prepared = prepare::run(a, h, key).await?;
    let mut locked = match lock::run(a, h, key, prepared, review).await? {
        Admission::Replay(order) => return Ok(order),
        Admission::Active(locked) => locked,
    };
    let priced = price::run(h, &mut locked).await?;
    let committed = commit::run(a, h, key, locked, priced, review).await?;
    accounts::remember_payment(a, &committed.cart, &committed.method).await;
    Ok(committed.order)
}
