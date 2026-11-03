//! Customer-owned saved instruments expose only redacted metadata; immediate revocation and provider cleanup share payment jobs.
use crate::*;
pub(crate) async fn identity(a: &App, h: &RequestContext) -> Result<(String, String)> {
    let (t, email) = accounts::identity(a, h).await?;
    let id: String =
        sqlx::query_scalar("SELECT id FROM customers WHERE tenant=$1 AND email=$2 AND active")
            .bind(&t)
            .bind(email)
            .fetch_one(&a.db)
            .await?;
    Ok((t, id))
}
pub(crate) async fn invoke(a: &App, h: &RequestContext, name: &str, v: &Value) -> Result<Value> {
    if name == "checkout.payment.methods" {
        list(a, h).await
    } else {
        if v["approve"] != true {
            return Err(bad("Approve saved payment revocation"));
        }
        revoke(
            a,
            h,
            v["id"].as_str().ok_or(bad("id required"))?,
            v["requestKey"].as_str().ok_or(bad("requestKey required"))?,
        )
        .await
    }
}
pub(crate) async fn list(a: &App, h: &RequestContext) -> Result<Value> {
    let (t, customer) = identity(a, h).await?;
    let rows=sqlx::query("SELECT id,provider,method,environment,metadata,created_at::text FROM payment_instruments WHERE tenant=$1 AND customer_id=$2 AND state='active' ORDER BY created_at DESC LIMIT 32").bind(&t).bind(customer).fetch_all(&a.db).await?;
    let manifests:Vec<Value>=sqlx::query_scalar("SELECT manifest FROM app_packages WHERE tenant=$1 AND active AND manifest->'paymentProvider' IS NOT NULL").bind(&t).fetch_all(&a.db).await?;
    let methods: Vec<String> = manifests
        .iter()
        .flat_map(|m| {
            m["paymentProvider"]["methods"]
                .as_array()
                .into_iter()
                .flatten()
                .filter(|method| {
                    method["capabilities"]
                        .as_array()
                        .is_some_and(|v| v.iter().any(|c| c == "vault"))
                })
                .filter_map(|method| {
                    Some(format!(
                        "{}-{}",
                        m["id"].as_str()?.replace('_', "-"),
                        method["id"].as_str()?.replace('_', "-")
                    ))
                })
        })
        .collect();
    Ok(
        json!({"supportedMethods":methods,"elements":rows.iter().map(|r|json!({"id":r.get::<String,_>("id"),"provider":r.get::<String,_>("provider"),"method":r.get::<String,_>("method"),"environment":r.get::<String,_>("environment"),"metadata":r.get::<Value,_>("metadata"),"createdAt":r.get::<String,_>("created_at")})).collect::<Vec<_>>() }),
    )
}
pub(crate) async fn revoke(a: &App, h: &RequestContext, id: &str, key: &str) -> Result<Value> {
    let (t, customer) = identity(a, h).await?;
    let mut tx = a.db.begin().await?;
    let attempt: Option<String> = sqlx::query_scalar(
        "SELECT attempt_id FROM payment_instruments WHERE tenant=$1 AND customer_id=$2 AND id=$3",
    )
    .bind(&t)
    .bind(&customer)
    .bind(id)
    .fetch_optional(&mut *tx)
    .await?;
    let attempt = attempt.ok_or(Error(
        StatusCode::NOT_FOUND,
        "Saved payment method unavailable".into(),
    ))?;
    sqlx::query("SELECT id FROM payment_attempts WHERE tenant=$1 AND id=$2 FOR UPDATE")
        .bind(&t)
        .bind(attempt)
        .fetch_one(&mut *tx)
        .await?;

    let row=sqlx::query("SELECT attempt_id,reference,state FROM payment_instruments WHERE tenant=$1 AND customer_id=$2 AND id=$3 FOR UPDATE").bind(&t).bind(&customer).bind(id).fetch_optional(&mut *tx).await?.ok_or(Error(StatusCode::NOT_FOUND,"Saved payment method unavailable".into()))?;
    sqlx::query("UPDATE payment_instruments SET state='revoked',revoked_at=coalesce(revoked_at,now()) WHERE tenant=$1 AND id=$2").bind(&t).bind(id).execute(&mut *tx).await?;
    let job = super::enqueue_tx(
        &mut tx,
        &t,
        &row.get::<String, _>("attempt_id"),
        "vault_revoke",
        key,
        &json!({"instrumentId":id,"reference":row.get::<String,_>("reference")}),
    )
    .await?;
    if row.get::<String, _>("state") == "active" {
        sqlx::query(
            "INSERT INTO outbox(tenant,kind,data) VALUES($1,'payment.instrument.revoked',$2)",
        )
        .bind(&t)
        .bind(json!({"instrumentId":id}))
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;
    Ok(json!({"id":id,"state":"revoked","jobId":job}))
}
pub(crate) async fn route_list(State(a): State<App>, h: RequestContext) -> Result<Json<Value>> {
    Ok(Json(list(&a, &h).await?))
}
pub(crate) async fn route_revoke(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(
        revoke(
            &a,
            &h,
            &id,
            v["requestKey"]
                .as_str()
                .or_else(|| header(&h, "idempotency-key"))
                .ok_or(bad("requestKey required"))?,
        )
        .await?,
    ))
}
/// Optional instrument storage can never roll back an already verified financial receipt.
pub(super) async fn observe(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &super::Attempt,
    v: &Value,
) -> Result<()> {
    if v.get("vault").is_none() {
        return Ok(());
    }
    sqlx::query("SAVEPOINT vault_metadata")
        .execute(&mut **tx)
        .await?;
    let status = if accept(tx, p, v).await.is_err() {
        sqlx::query("ROLLBACK TO SAVEPOINT vault_metadata")
            .execute(&mut **tx)
            .await?;
        "failed"
    } else {
        "saved"
    };
    sqlx::query("RELEASE SAVEPOINT vault_metadata")
        .execute(&mut **tx)
        .await?;
    sqlx::query("UPDATE payment_attempts SET provider_context=jsonb_set(provider_context,'{vaultStatus}',$3) WHERE tenant=$1 AND id=$2").bind(&p.tenant).bind(&p.id).bind(json!(status)).execute(&mut **tx).await?;
    Ok(())
}
/// A financial provider receipt may add a handle only for the original account's explicit save consent.
pub(super) async fn accept(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    p: &super::Attempt,
    v: &Value,
) -> Result<()> {
    let Some(vault) = v.get("vault") else {
        return Ok(());
    };
    let f = &p.context["funding"];
    if f["save"] != true
        || f["customerId"] != vault["customerId"]
        || f["consentId"] != vault["consentId"]
        || !["captured", "authorized", "partially_captured"]
            .contains(&v["status"].as_str().unwrap_or(""))
    {
        return Err(bad(
            "Saved instrument lacks original customer consent and successful payment",
        ));
    }
    let reference = super::generic_receipts::reference(&vault["reference"])?;
    let metadata = projection(vault)?;
    let id = f["consentId"]
        .as_str()
        .ok_or(bad("Consent identity required"))?;
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1,515))")
        .bind(format!("{}:{}", p.tenant, f["customerId"]))
        .execute(&mut **tx)
        .await?;
    let count:i64=sqlx::query_scalar("SELECT count(*) FROM payment_instruments WHERE tenant=$1 AND customer_id=$2 AND state='active' AND id<>$3").bind(&p.tenant).bind(f["customerId"].as_str().unwrap_or("")).bind(id).fetch_one(&mut **tx).await?;
    if count >= 32 {
        return Err(bad("Maximum 32 saved payment methods per customer"));
    }
    sqlx::query("INSERT INTO payment_instruments(tenant,id,customer_id,provider,adapter_version,account_ref,environment,method,reference,attempt_id,metadata,consent_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(tenant,id) DO NOTHING").bind(&p.tenant).bind(id).bind(f["customerId"].as_str().unwrap_or("")).bind(&p.provider).bind(&p.adapter_version).bind(p.context["accountRef"].as_str().unwrap_or("")).bind(&p.environment).bind(p.context["method"].as_str().unwrap_or("")).bind(reference).bind(&p.id).bind(metadata).bind(f["consentVersion"].as_str().unwrap_or("")).execute(&mut **tx).await?;
    let original: String =
        sqlx::query_scalar("SELECT reference FROM payment_instruments WHERE tenant=$1 AND id=$2")
            .bind(&p.tenant)
            .bind(id)
            .fetch_one(&mut **tx)
            .await?;
    if original != reference {
        return Err(conflict("Saved payment handle changed"));
    }
    Ok(())
}
fn projection(v: &Value) -> Result<Value> {
    let mut result = json!({});
    for key in ["brand", "last4"] {
        if let Some(s) = v[key].as_str() {
            if s.is_empty()
                || s.len() > 32
                || !s.bytes().all(|c| c.is_ascii_alphanumeric() || c == b' ')
                || (key == "last4" && (s.len() != 4 || !s.bytes().all(|c| c.is_ascii_digit())))
            {
                return Err(bad("Invalid redacted instrument metadata"));
            }
            result[key] = json!(s);
        }
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn public_instrument_metadata_never_contains_provider_tokens_or_customer_data() {
        assert_eq!(projection(&json!({"brand":"Visa","last4":"4242","token":"secret","email":"private@example.test","customerId":"private"})).unwrap(),json!({"brand":"Visa","last4":"4242"}));
        assert!(projection(&json!({"brand":"line\nbreak"})).is_err());
    }
}
