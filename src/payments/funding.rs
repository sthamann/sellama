//! Account-authorized funding choice, immutable consent and saved-instrument admission; cart possession is insufficient.
use crate::*;
#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Choice {
    #[serde(default)]
    pub save: bool,
    #[serde(default)]
    pub id: Option<String>,
}
pub(crate) async fn prepare(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    h: &RequestContext,
    c: &StoredCart,
    o: &Value,
) -> Result<()> {
    let Some(choice) = c
        .data
        .checkout
        .as_ref()
        .and_then(|s| s.payment_funding.as_ref())
    else {
        return Ok(());
    };
    if !choice.save && choice.id.is_none() {
        return Ok(());
    }
    if choice.save && choice.id.is_some() {
        return Err(bad(
            "Choose an existing payment method or consent to saving a new one",
        ));
    }
    let token = header(h, "x-customer-token").ok_or(Error(
        StatusCode::UNAUTHORIZED,
        "Customer login required to save or use a payment method".into(),
    ))?;
    let customer:Option<String>=sqlx::query_scalar("SELECT c.id FROM customer_sessions s JOIN customers c ON c.tenant=s.tenant AND c.email=s.email WHERE s.tenant=$1 AND s.digest=$2 AND s.expires_at>now() AND c.active").bind(&c.tenant).bind(hash(token)).fetch_optional(&mut **tx).await?;
    let customer = customer
        .filter(|id| Some(id) == c.data.customer_id.as_ref())
        .ok_or(Error(
            StatusCode::UNAUTHORIZED,
            "Payment method needs the current owning customer session".into(),
        ))?;
    let id = o["payment"]["attemptId"]
        .as_str()
        .ok_or(bad("Saved payment requires a provider payment"))?;
    let row = sqlx::query("SELECT * FROM payment_attempts WHERE tenant=$1 AND id=$2")
        .bind(&c.tenant)
        .bind(id)
        .fetch_one(&mut **tx)
        .await?;
    let p = super::attempt(&row);
    if !p.context["capabilities"]
        .as_array()
        .is_some_and(|v| v.iter().any(|s| s == "vault"))
    {
        return Err(bad(
            "This payment method does not support saved instruments",
        ));
    }
    let mut funding = json!({"customerId":customer,"save":choice.save,"consentId":uid(),"consentVersion":"save-payment@1"});
    if let Some(saved) = &choice.id {
        let r=sqlx::query("SELECT reference,method,provider,account_ref,environment FROM payment_instruments WHERE tenant=$1 AND customer_id=$2 AND id=$3 AND state='active' FOR SHARE").bind(&c.tenant).bind(&customer).bind(saved).fetch_optional(&mut **tx).await?.ok_or(Error(StatusCode::NOT_FOUND,"Saved payment method unavailable".into()))?;
        if r.get::<String, _>("provider") != p.provider
            || r.get::<String, _>("method") != p.context["method"]
            || r.get::<String, _>("account_ref") != p.context["accountRef"]
            || r.get::<String, _>("environment") != p.environment
        {
            return Err(bad(
                "Saved payment method belongs to another payment account or method",
            ));
        }
        funding["reference"] = json!(r.get::<String, _>("reference"));
        funding["instrumentId"] = json!(saved);
    }
    sqlx::query("UPDATE payment_attempts SET provider_context=jsonb_set(jsonb_set(provider_context,'{funding}',$3),'{vaultStatus}',to_jsonb(CASE WHEN $3::jsonb->>'save'='true' THEN 'pending'::text ELSE 'reused'::text END)) WHERE tenant=$1 AND id=$2").bind(&c.tenant).bind(id).bind(funding).execute(&mut **tx).await?;
    Ok(())
}
/// A revoked instrument cannot start another queued provider operation. Already submitted financial effects still reconcile.
pub(crate) async fn dispatch_check(a: &App, p: &super::Attempt, op: &str) -> Result<()> {
    if op != "create" {
        return Ok(());
    }
    if let Some(id) = p.context["funding"]["instrumentId"].as_str() {
        let active:bool=sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM payment_instruments WHERE tenant=$1 AND id=$2 AND customer_id=$3 AND state='active')").bind(&p.tenant).bind(id).bind(p.context["funding"]["customerId"].as_str().unwrap_or("")).fetch_one(&a.db).await?;
        if !active {
            return Err(conflict("Saved payment method has been revoked"));
        }
    }
    Ok(())
}
