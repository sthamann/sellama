//! Exactly-once provider refund admission, including refunds initiated outside Studio.
use super::{Attempt, generic_receipts::claim};
use crate::{Result, Row, Value, bad, conflict, json, verified_kernel};

pub(super) fn checked_total(captured: i64, refunded: i64, delta: i64) -> Result<i64> {
    let valid = u64::try_from(captured)
        .ok()
        .zip(u64::try_from(refunded).ok())
        .zip(u64::try_from(delta).ok())
        .is_some_and(|((captured, refunded), delta)| {
            (delta == 0 && refunded <= captured)
                || verified_kernel::refund_admissible(captured, refunded, delta)
        });
    if !valid {
        return Err(conflict("Provider refunds exceed payment"));
    }
    refunded
        .checked_add(delta)
        .ok_or(conflict("Provider refund overflow"))
}

pub(super) async fn apply(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    context: &mut Value,
    refund: &Value,
    native_key: Option<&str>,
) -> Result<i64> {
    let id = super::generic_receipts::reference(&refund["id"])?;
    let amount = refund["amountMinor"]
        .as_i64()
        .filter(|n| *n > 0 && *n <= p.amount)
        .ok_or(bad("Invalid provider refund amount"))?;
    if refund["currency"] != p.currency {
        return Err(bad("Provider refund currency mismatch"));
    }
    let key = native_key.or(refund["requestKey"].as_str());
    if let Some(key) = key {
        let expected: Option<i64> = sqlx::query_scalar("SELECT (request->>'amountMinor')::bigint FROM payment_jobs WHERE tenant=$1 AND attempt_id=$2 AND id=$3 AND operation='refund'")
            .bind(&p.tenant).bind(&p.id).bind(key).fetch_optional(&mut **tx).await?;
        if expected != Some(amount) {
            return Err(bad("Provider refund does not match its native job"));
        }
    }
    let old = sqlx::query("SELECT tenant,attempt_id,job_key FROM payment_receipt_claims WHERE provider=$1 AND environment=$2 AND account_ref=$3 AND kind='refund' AND receipt_ref=$4 FOR UPDATE")
        .bind(&p.provider).bind(&p.environment).bind(p.context["accountRef"].as_str().unwrap_or(""))
        .bind(id).fetch_optional(&mut **tx).await?;
    if let Some(old) = old {
        let saved_key: String = old.get("job_key");
        if old.get::<String, _>("tenant") != p.tenant
            || old.get::<String, _>("attempt_id") != p.id
            || key.is_some_and(|key| key != saved_key)
        {
            return Err(conflict("Provider refund receipt already allocated"));
        }
        let saved = context["providerRefunds"][id]["amountMinor"].as_i64();
        let historical: Option<i64> = if saved.is_none() {
            sqlx::query_scalar("SELECT (request->>'amountMinor')::bigint FROM payment_jobs WHERE tenant=$1 AND attempt_id=$2 AND id=$3 AND operation='refund'")
                .bind(&p.tenant).bind(&p.id).bind(&saved_key).fetch_optional(&mut **tx).await?
        } else {
            None
        };
        if saved.or(historical) != Some(amount) {
            return Err(conflict("Provider refund receipt amount changed"));
        }
        return Ok(0);
    }
    let external_key = format!("provider-refund:{id}");
    let key = key.unwrap_or(&external_key);
    claim(tx, p, "refund", id, key).await?;
    if !context["providerRefunds"].is_object() {
        context["providerRefunds"] = json!({});
    }
    context["providerRefunds"][id] = json!({"amountMinor":amount,"jobKey":key});
    Ok(amount)
}

pub(super) async fn reconcile(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    context: &mut Value,
    response: &Value,
) -> Result<i64> {
    let Some(refunds) = response.get("refunds") else {
        return Ok(p.refunded);
    };
    let refunds = refunds
        .as_array()
        .filter(|rs| rs.len() <= 1000)
        .ok_or(bad("Invalid provider refund collection"))?;
    let mut seen = std::collections::HashSet::new();
    let mut total = p.refunded;
    for refund in refunds {
        let id = super::generic_receipts::reference(&refund["id"])?;
        if !seen.insert(id) {
            return Err(bad("Duplicate provider refund receipt"));
        }
        total = checked_total(p.amount, total, apply(tx, p, context, refund, None).await?)?;
    }
    Ok(total)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn confirmed_delta_reuses_exact_refund_policy_and_allows_zero_for_replay() {
        assert_eq!(checked_total(1250, 1249, 1).unwrap(), 1250);
        assert_eq!(checked_total(1250, 1250, 0).unwrap(), 1250);
        for (captured, refunded, delta) in [
            (1250, 1249, 2),
            (1250, 1251, 0),
            (-1, 0, 1),
            (1250, 0, -1),
            (i64::MAX, i64::MAX, 1),
        ] {
            assert!(checked_total(captured, refunded, delta).is_err());
        }
    }
}
