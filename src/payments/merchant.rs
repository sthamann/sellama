//! Shared merchant payment operation bridge; HTTP, MCP and Flows retain native rights and durable jobs.
use crate::{App, RequestContext, Result, State, Value, bad};
pub(crate) async fn invoke(a: &App, h: &RequestContext, name: &str, v: &Value) -> Result<Value> {
    let id = || v["id"].as_str().ok_or(bad("id required"));
    match name {
        "merchant.payment.details" => super::transaction_details(a, h, id()?).await,
        "merchant.payment.providers" => {
            Ok(super::providers_route(State(a.clone()), h.clone()).await?.0)
        }
        "merchant.payment.onboarding" => super::onboarding(a, h, id()?, v).await,
        "merchant.payment" => {
            let op = v["operation"].as_str().ok_or(bad("operation required"))?;
            if ![
                "capture",
                "authorize",
                "void",
                "refund",
                "reconcile",
                "cancel",
            ]
            .contains(&op)
                || v["approve"] != true
            {
                return Err(bad("Payment operation and approval required"));
            }
            super::enqueue(
                a,
                h,
                id()?,
                op,
                v["requestKey"].as_str().ok_or(bad("requestKey required"))?,
                v,
            )
            .await
        }
        _ => Err(bad("Unknown merchant payment operation")),
    }
}
