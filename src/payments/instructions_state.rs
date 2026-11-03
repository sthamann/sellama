//! Immutable recipient evidence in the existing payment context, native invoice snapshots and one scoped outbox event.
use super::{Attempt, attempt, instructions};
use crate::{App, RequestContext, Result, Value, auth, bad, conflict, json, merchant};
pub(super) fn admit(p: &Attempt, context: &mut Value, receipt: &Value) -> Result<bool> {
    let Some(value) = receipt.get("instructions") else {
        return Ok(false);
    };
    if !p.context["capabilities"]
        .as_array()
        .is_some_and(|caps| caps.iter().any(|cap| cap == "instructions"))
    {
        return Err(bad(
            "Payment method has no recipient-instructions capability",
        ));
    }
    let value = instructions::validated(value)?;
    if let Some(saved) = context.get("recipientInstructions") {
        if *saved != value {
            return Err(conflict("Accepted payment instructions are immutable"));
        }
        return Ok(false);
    }
    context["recipientInstructions"] = value;
    Ok(true)
}
fn snapshot(p: &Attempt, value: &Value) -> Result<Value> {
    Ok(
        json!({"instructions":instructions::validated(value)?,"amountMinor":p.amount,"currency":p.currency,"currencyScale":p.currency_scale,"simulated":p.environment!="live"}),
    )
}
pub(super) async fn publish(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &Attempt,
    context: &Value,
) -> Result<()> {
    let mut order: Value = sqlx::query_scalar("SELECT data FROM orders WHERE tenant=$1 AND id=$2")
        .bind(&p.tenant)
        .bind(&p.order)
        .fetch_one(&mut **tx)
        .await?;
    if let Some(cart) = order["cart"].as_object_mut() {
        cart.remove("token");
    }
    let data = json!({"orderId":p.order,"attemptId":p.id,"order":order,"paymentInstructions":snapshot(p,&context["recipientInstructions"])?});
    sqlx::query(
        "INSERT INTO outbox(tenant,kind,data) VALUES($1,'payment.instructions.available',$2)",
    )
    .bind(&p.tenant)
    .bind(data)
    .execute(&mut **tx)
    .await?;
    Ok(())
}
/// The issuer already holds the order lock and document/PII authority. This immutable read takes no reverse payment lock and performs no provider I/O.
pub(crate) async fn for_document(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    order: &Value,
) -> Result<Option<Value>> {
    let Some(id) = order["payment"]["attemptId"].as_str() else {
        return Ok(None);
    };
    let row =
        sqlx::query("SELECT * FROM payment_attempts WHERE tenant=$1 AND id=$2 AND order_id=$3")
            .bind(t)
            .bind(id)
            .bind(order["id"].as_str().unwrap_or(""))
            .fetch_optional(&mut **tx)
            .await?
            .ok_or(bad("Document payment is not bound to this order"))?;
    let p = attempt(&row);
    if !p.context["capabilities"]
        .as_array()
        .is_some_and(|caps| caps.iter().any(|cap| cap == "instructions"))
    {
        return Ok(None);
    }
    let value=p.context.get("recipientInstructions").ok_or(conflict("Invoice payment instructions are still pending; check the payment before issuing the invoice"))?;
    snapshot(&p, value).map(Some)
}
/// Flow actions recheck current compound rights and fetch the original order's cached evidence at execution time.
pub(crate) async fn for_flow(a: &App, h: &RequestContext, order: &str) -> Result<Value> {
    let t = merchant(a, h)?;
    for scope in ["payments.read", "orders.read", "customers.pii"] {
        auth::permit(h, scope)?;
    }
    let row=sqlx::query("SELECT p.* FROM payment_attempts p JOIN orders o ON o.tenant=p.tenant AND o.id=p.order_id AND o.data#>>'{payment,attemptId}'=p.id WHERE p.tenant=$1 AND o.id=$2").bind(t).bind(order).fetch_one(&a.db).await?;
    let p = attempt(&row);
    snapshot(
        &p,
        p.context
            .get("recipientInstructions")
            .ok_or(bad("Payment instructions unavailable"))?,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn recipient_is_validated_frozen_once_and_never_inferred_from_missing_evidence() {
        let mut p = Attempt {
            id: "a".into(),
            provider: "example".into(),
            context: json!({"capabilities":["instructions"]}),
            tenant: "shop".into(),
            order: "o".into(),
            amount: 123,
            currency: "EUR".into(),
            currency_scale: 2,
            state: "ready".into(),
            provider_order: Some("remote".into()),
            capture: None,
            refunded: 0,
            adapter_version: "1.0.0".into(),
            environment: "sandbox".into(),
            bn_code: String::new(),
        };
        let receipt = json!({"instructions":{"kind":"bank_transfer","paymentReference":"RF-1","iban":"DE89370400440532013000","bic":"DEUTDEFFXXX","bankName":"Example","accountHolderName":"Recipient"}});
        let mut context = p.context.clone();
        assert!(!admit(&p, &mut context, &json!({})).unwrap());
        assert!(admit(&p, &mut context, &receipt).unwrap());
        assert!(!admit(&p, &mut context, &receipt).unwrap());
        let frozen = context.clone();
        let mut changed = receipt.clone();
        changed["instructions"]["paymentReference"] = json!("RF-2");
        assert!(admit(&p, &mut context, &changed).is_err());
        assert_eq!(context, frozen);
        let mut invalid = receipt.clone();
        invalid["instructions"]["iban"] = json!("DE00370400440532013000");
        assert!(admit(&p, &mut json!({}), &invalid).is_err());
        p.context = json!({});
        assert!(admit(&p, &mut json!({}), &receipt).is_err());
    }
}
