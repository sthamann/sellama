//! Serialized native capture budgets; uncertain capture jobs reserve the remaining authorization.
use super::{Attempt, settlements};
use crate::{Result, Value, bad, conflict, verified_kernel};

pub(super) async fn validate(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    v: &Value,
) -> Result<()> {
    if ![
        "ready",
        "approved",
        "authorized",
        "partially_captured",
        "partially_refunded",
    ]
    .contains(&p.state.as_str())
    {
        return Err(conflict("Payment cannot be captured in this state"));
    }
    let captured = settlements::captured(p);
    if captured > 0 && v.get("amountMinor").is_none() {
        return Err(bad("Choose an explicit amount for an additional capture"));
    }
    if settlements::closed(p) {
        return Err(conflict("Payment capture is already closed"));
    }
    let amount = v
        .get("amountMinor")
        .map(|n| {
            n.as_i64()
                .filter(|n| *n > 0)
                .ok_or(bad("Positive capture amountMinor required"))
        })
        .transpose()?
        .unwrap_or(p.amount);
    if let Some(final_capture) = v.get("finalCapture")
        && !final_capture.is_boolean()
    {
        return Err(bad("finalCapture must be boolean"));
    }
    if (amount != p.amount || captured > 0 || v.get("finalCapture").is_some())
        && !settlements::multi(p)
    {
        return Err(bad(
            "Partial capture requires a multi-capture authorization",
        ));
    }
    if p.context["intent"] == "authorize" && p.context["authorizationId"].as_str().is_none() {
        return Err(conflict("Wait for confirmed authorization before capture"));
    }
    let reserved: i64 = sqlx::query_scalar("SELECT coalesce(sum(coalesce((request->>'amountMinor')::bigint,$3)),0)::bigint FROM payment_jobs WHERE tenant=$1 AND attempt_id=$2 AND operation='capture' AND state IN ('queued','running','uncertain')")
        .bind(&p.tenant).bind(&p.id).bind(p.amount).fetch_one(&mut **tx).await?;
    let valid = u64::try_from(p.amount)
        .ok()
        .zip(u64::try_from(captured).ok())
        .zip(u64::try_from(reserved).ok())
        .zip(u64::try_from(amount).ok())
        .is_some_and(|(((authorized, captured), reserved), amount)| {
            verified_kernel::capture_admissible(authorized, captured, reserved, amount)
        });
    if !valid {
        return Err(conflict("Capture exceeds the remaining authorization"));
    }
    if reserved > 0 {
        return Err(conflict(
            "Resolve the outstanding capture before another capture",
        ));
    }
    Ok(())
}
