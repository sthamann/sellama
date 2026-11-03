//! Refunds select an owned capture and reserve its remaining amount before a provider call.
use super::{Attempt, settlements};
use crate::{Result, Value, bad, conflict};

pub(super) fn capture(p: &Attempt, context: &Value, refund: &Value) -> Result<(String, i64)> {
    let captures = context["captureReceipts"].as_object();
    let id = refund["captureId"]
        .as_str()
        .or_else(|| match captures {
            Some(cs) if cs.len() == 1 => cs.keys().next().map(String::as_str),
            None => p.capture.as_deref(),
            _ => None,
        })
        .ok_or(bad("Select the capture to refund"))?;
    super::generic_receipts::reference(&Value::String(id.into()))?;
    let amount = captures
        .and_then(|cs| cs.get(id))
        .and_then(|c| c["amountMinor"].as_i64())
        .or_else(|| (p.capture.as_deref() == Some(id)).then(|| settlements::captured(p)))
        .filter(|n| *n > 0)
        .ok_or(bad("Refund capture does not belong to this payment"))?;
    Ok((id.into(), amount))
}
pub(super) fn used(p: &Attempt, context: &Value, capture: &str) -> i64 {
    let Some(rows) = context["providerRefunds"].as_object() else {
        return p.refunded;
    };
    let known: i64 = rows
        .values()
        .filter(|r| r["captureId"].as_str().or(p.capture.as_deref()) == Some(capture))
        .filter_map(|r| r["amountMinor"].as_i64())
        .fold(0_i64, i64::saturating_add);
    let total: i64 = rows
        .values()
        .filter_map(|r| r["amountMinor"].as_i64())
        .fold(0_i64, i64::saturating_add);
    known
        + if p.capture.as_deref() == Some(capture) {
            p.refunded.saturating_sub(total).max(0)
        } else {
            0
        }
}
pub(super) async fn validate(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    v: &Value,
) -> Result<()> {
    let (id, total) = capture(p, &p.context, v)?;
    let pending: i64 = sqlx::query_scalar("SELECT coalesce(sum((request->>'amountMinor')::bigint),0)::bigint FROM payment_jobs WHERE tenant=$1 AND attempt_id=$2 AND operation='refund' AND state IN ('queued','running','uncertain') AND coalesce(request->>'captureId',$3)=$3")
        .bind(&p.tenant).bind(&p.id).bind(&id).fetch_one(&mut **tx).await?;
    let requested = v["amountMinor"]
        .as_i64()
        .ok_or(bad("Refund amount required"))?;
    super::refund_receipts::checked_total(
        total,
        used(p, &p.context, &id)
            .checked_add(pending)
            .ok_or(conflict("Refund reservation overflow"))?,
        requested,
    )?;
    Ok(())
}
