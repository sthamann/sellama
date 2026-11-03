//! Customer-capability and compound merchant access to typed recipient instructions; reads never settle an invoice.
use super::{attempt, customer, generic_receipts, remote};
use crate::{
    App, Json, Path, RequestContext, Result, State, Value, auth, bad, json, merchant, tenant, uid,
};
#[derive(serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Instructions {
    kind: String,
    payment_reference: String,
    iban: String,
    bic: String,
    bank_name: String,
    account_holder_name: String,
}
impl Instructions {
    fn validate(&self) -> Result<()> {
        let plain = |s: &str, max: usize| {
            !s.trim().is_empty() && s.len() <= max && !s.chars().any(char::is_control)
        };
        if self.kind != "bank_transfer"
            || !plain(&self.payment_reference, 140)
            || !self
                .payment_reference
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b" _./-".contains(&b))
            || !plain(&self.bank_name, 200)
            || !plain(&self.account_holder_name, 200)
            || ![8, 11].contains(&self.bic.len())
            || !self
                .bic
                .bytes()
                .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
        {
            return Err(bad("Invalid recipient payment instructions"));
        }
        let s = &self.iban;
        if s.len() < 15
            || s.len() > 34
            || !s
                .bytes()
                .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
            || !s.as_bytes()[..2].iter().all(u8::is_ascii_uppercase)
            || !s.as_bytes()[2..4].iter().all(u8::is_ascii_digit)
        {
            return Err(bad("Invalid recipient bank account"));
        }
        let mut remainder = 0u32;
        for b in s.bytes().skip(4).chain(s.bytes().take(4)) {
            remainder = if b.is_ascii_digit() {
                (remainder * 10 + u32::from(b - b'0')) % 97
            } else {
                (remainder * 100 + u32::from(b - b'A' + 10)) % 97
            };
        }
        if remainder != 1 {
            return Err(bad("Invalid recipient bank account checksum"));
        }
        Ok(())
    }
}
pub(crate) async fn customer_read(a: &App, h: &RequestContext, id: &str) -> Result<Value> {
    customer(a, h, id).await?;
    read(a, &tenant(h)?, id).await
}
pub(crate) async fn merchant_read(a: &App, h: &RequestContext, id: &str) -> Result<Value> {
    let t = merchant(a, h)?;
    for scope in ["payments.read", "orders.read", "customers.pii"] {
        auth::permit(h, scope)?;
    }
    read(a, &t, id).await
}
pub(crate) async fn customer_route(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    Ok(Json(customer_read(&a, &h, &id).await?))
}
pub(crate) async fn merchant_route(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    Ok(Json(merchant_read(&a, &h, &id).await?))
}
async fn read(a: &App, t: &str, id: &str) -> Result<Value> {
    let row = sqlx::query("SELECT * FROM payment_attempts WHERE tenant=$1 AND id=$2")
        .bind(t)
        .bind(id)
        .fetch_optional(&a.db)
        .await?
        .ok_or(crate::Error(
            crate::StatusCode::NOT_FOUND,
            "Payment not found".into(),
        ))?;
    let p = attempt(&row);
    if !p.context["capabilities"]
        .as_array()
        .is_some_and(|cs| cs.iter().any(|c| c == "instructions"))
    {
        return Ok(json!({"status":"unsupported","instructions":null}));
    }
    let v = remote::execute(a, &p, "instructions", &uid(), &json!({})).await?;
    generic_receipts::identity(&p, &v)?;
    let instructions = match v["status"].as_str() {
        Some("pending") if v["instructions"].is_null() => None,
        Some("available") => {
            let i: Instructions = serde_json::from_value(v["instructions"].clone())
                .map_err(|_| bad("Invalid recipient instructions response"))?;
            i.validate()?;
            Some(i)
        }
        _ => return Err(bad("Invalid recipient instructions state")),
    };
    Ok(
        json!({"status":v["status"],"instructions":instructions,"amountMinor":p.amount,"currency":p.currency,"currencyScale":p.currency_scale,"simulated":p.environment!="live"}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn instructions_validate_bank_checksum_and_exclude_extra_fields() {
        let v = json!({"kind":"bank_transfer","paymentReference":"RF-123","iban":"DE89370400440532013000","bic":"DEUTDEFFXXX","bankName":"Fixture bank","accountHolderName":"Fixture recipient"});
        assert!(
            serde_json::from_value::<Instructions>(v.clone())
                .unwrap()
                .validate()
                .is_ok()
        );
        for (key, value) in [
            ("iban", json!("DE000000000000000")),
            ("paymentReference", json!("private@example.test")),
            ("kind", json!("payer_account")),
            ("bic", json!("bad")),
        ] {
            let mut next = v.clone();
            next[key] = value;
            assert!(
                serde_json::from_value::<Instructions>(next)
                    .unwrap()
                    .validate()
                    .is_err()
            );
        }
        let mut next = v;
        next["payer"] = json!("private");
        assert!(serde_json::from_value::<Instructions>(next).is_err());
    }
}
