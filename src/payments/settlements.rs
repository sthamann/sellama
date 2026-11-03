//! Immutable capture receipts and exact cumulative settlement for native partial/multiple captures.
use super::{
    Attempt,
    generic_receipts::{claim, reference},
};
use crate::{Result, Row, Value, bad, conflict, json};

pub(super) fn captured(p: &Attempt) -> i64 {
    p.context["capturedAmountMinor"]
        .as_i64()
        .unwrap_or_else(|| if p.capture.is_some() { p.amount } else { 0 })
}
pub(super) fn closed(p: &Attempt) -> bool {
    p.context["captureClosed"]
        .as_bool()
        .unwrap_or_else(|| captured(p) == p.amount)
}
pub(super) fn multi(p: &Attempt) -> bool {
    p.provider != "paypal"
        && p.context["intent"] == "authorize"
        && p.context["capabilities"]
            .as_array()
            .is_some_and(|cs| cs.iter().any(|c| c == "multi_capture"))
}
pub(super) fn summary(p: &Attempt) -> Value {
    let captured = captured(p);
    let closed = closed(p);
    let mut receipts = p.context["captureReceipts"]
        .as_object()
        .cloned()
        .unwrap_or_default();
    if receipts.is_empty()
        && let Some(id) = &p.capture
    {
        receipts.insert(
            id.clone(),
            json!({"amountMinor":captured,"currency":p.currency}),
        );
    }
    let captures: Vec<Value> = receipts.iter().map(|(id, value)| json!({"id":id,"amountMinor":value["amountMinor"],"currency":p.currency,"refundedMinor":super::refund_allocation::used(p,&p.context,id)})).collect();
    json!({"capturedMinor":captured,"refundedMinor":p.refunded,"captureClosed":closed,
        "remainingAuthorizationMinor":if closed {0}else{p.amount.saturating_sub(captured)},
        "multipleCapture":multi(p),"canCaptureMore":!closed && ["authorized","partially_captured","partially_refunded"].contains(&p.state.as_str()) && (p.context["authorizationId"].is_string() || p.state == "authorized")
            && (captured==0 || multi(p)),"captures":captures})
}
pub(super) fn state(p: &Attempt, settled: i64, refunded: i64, closed: bool) -> &'static str {
    if refunded > 0 {
        if refunded == settled && closed {
            "refunded"
        } else {
            "partially_refunded"
        }
    } else if ["cancelled", "expired", "captured_late"].contains(&p.state.as_str()) {
        "captured_late"
    } else if settled == p.amount {
        "captured"
    } else {
        "partially_captured"
    }
}

pub(super) async fn admit(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    context: &mut Value,
    v: &Value,
) -> Result<(i64, String, bool)> {
    if v["confirmed"] != true {
        return Err(bad("Settlement must be provider confirmed"));
    }
    let legacy;
    let records = if let Some(records) = v.get("captures") {
        records
            .as_array()
            .filter(|rs| !rs.is_empty() && rs.len() <= 1000)
            .ok_or(bad("Invalid provider capture collection"))?
    } else {
        if v["settledAmountMinor"].as_i64() != Some(p.amount) {
            return Err(bad("Legacy settlement must match the full invoice"));
        }
        legacy = vec![json!({"id":v["captureId"],"amountMinor":p.amount,"currency":p.currency})];
        &legacy
    };
    let mut receipts = context["captureReceipts"]
        .as_object()
        .cloned()
        .unwrap_or_default();
    if receipts.is_empty()
        && let Some(id) = &p.capture
    {
        receipts.insert(
            id.clone(),
            json!({"amountMinor":captured(p),"currency":p.currency}),
        );
    }
    let mut seen = std::collections::HashSet::new();
    let mut snapshot = 0_i64;
    for record in records {
        let id = reference(&record["id"])?;
        let amount = record["amountMinor"]
            .as_i64()
            .filter(|n| *n > 0)
            .ok_or(bad("Positive capture receipt amount required"))?;
        if !seen.insert(id) || record["currency"] != p.currency {
            return Err(bad("Duplicate capture receipt or currency mismatch"));
        }
        snapshot = snapshot
            .checked_add(amount)
            .filter(|n| *n <= p.amount)
            .ok_or(bad("Provider captures exceed invoice"))?;
        if let Some(old) = receipts.get(id)
            && (old["amountMinor"] != amount || old["currency"] != p.currency)
        {
            return Err(conflict("Capture receipt amount changed"));
        }
        claim(tx, p, "capture", id, "").await?;
        if let Some(key) = record.get("requestKey") {
            let key = reference(key)?;
            let row = sqlx::query("SELECT operation,request,state FROM payment_jobs WHERE tenant=$1 AND attempt_id=$2 AND id=$3 FOR UPDATE")
                .bind(&p.tenant).bind(&p.id).bind(key).fetch_optional(&mut **tx).await?
                .ok_or(bad("Capture has no matching native request"))?;
            let request: Value = row.get("request");
            if row.get::<String, _>("operation") != "capture"
                || request
                    .get("amountMinor")
                    .map(|n| n.as_i64())
                    .unwrap_or(Some(p.amount))
                    != Some(amount)
            {
                return Err(conflict("Capture changed its native requested amount"));
            }
            claim(tx, p, "capture-job", key, id).await?;
            sqlx::query("UPDATE payment_jobs SET state='succeeded',response=$1,error=NULL,lease_until=NULL WHERE tenant=$2 AND attempt_id=$3 AND id=$4 AND state IN ('queued','running','uncertain')")
                .bind(v).bind(&p.tenant).bind(&p.id).bind(key).execute(&mut **tx).await?;
        }
        receipts.insert(
            id.into(),
            json!({"amountMinor":amount,"currency":p.currency}),
        );
    }
    if receipts.len() > 1000 {
        return Err(bad("Too many capture receipts for one payment"));
    }
    if v["settledAmountMinor"].as_i64() != Some(snapshot) {
        return Err(bad("Capture collection does not match settlement total"));
    }
    let mut total = 0_i64;
    for record in receipts.values() {
        total = total
            .checked_add(record["amountMinor"].as_i64().unwrap_or(-1))
            .filter(|n| *n > 0 && *n <= p.amount)
            .ok_or(bad("Captures exceed original invoice"))?;
    }
    if (snapshot < p.amount || receipts.len() > 1) && !multi(p) {
        return Err(bad(
            "Partial or multiple capture is not enabled for this attempt",
        ));
    }
    if snapshot < p.amount || receipts.len() > 1 {
        let authorization = context["authorizationId"]
            .as_str()
            .or(v["authorizationId"].as_str())
            .ok_or(bad(
                "Partial capture requires confirmed authorization evidence",
            ))?
            .to_owned();
        reference(&json!(authorization))?;
        if v["authorizationId"]
            .as_str()
            .is_some_and(|id| id != authorization)
            || (context["authorizationId"].is_null() || v.get("authorizedAmountMinor").is_some())
                && v["authorizedAmountMinor"].as_i64() != Some(p.amount)
        {
            return Err(bad("Partial capture authorization changed"));
        }
        claim(tx, p, "authorization", &authorization, "").await?;
        context["authorizationId"] = json!(authorization);
    }
    if snapshot < p.amount && v["status"] != "partially_captured" {
        return Err(bad("Partial settlement cannot report a full capture"));
    }
    let closed = closed(p) || total == p.amount || v["captureClosed"] == true;
    let first = p
        .capture
        .clone()
        .unwrap_or_else(|| records[0]["id"].as_str().unwrap().to_owned());
    context["captureReceipts"] = json!(receipts);
    context["capturedAmountMinor"] = json!(total);
    context["captureClosed"] = json!(closed);
    Ok((total, first, closed))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn partial_funds_are_not_full_payment_or_a_released_reservation() {
        let p = Attempt {
            id: "a".into(),
            provider: "example".into(),
            context: json!({}),
            tenant: "t".into(),
            order: "o".into(),
            amount: 1000,
            currency: "EUR".into(),
            currency_scale: 2,
            state: "authorized".into(),
            provider_order: None,
            capture: None,
            refunded: 0,
            adapter_version: "1.3.0".into(),
            environment: "simulation".into(),
            bn_code: "".into(),
        };
        assert_eq!(state(&p, 200, 0, false), "partially_captured");
        assert_eq!(state(&p, 200, 200, false), "partially_refunded");
        assert_eq!(state(&p, 200, 200, true), "refunded");
        assert_eq!(state(&p, 1000, 0, true), "captured");
    }
}
