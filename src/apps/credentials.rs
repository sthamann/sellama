//! App keys reuse the core integration-key store, current creator rights, expiry and immutable package digest.
use super::*;
pub(super) fn router() -> Router<App> {
    Router::new()
        .secure_route(
            "/api/apps/{id}/credentials",
            &[("GET", "apps.manage"), ("POST", "apps.manage")],
            get(list).post(create),
        )
        .secure_route(
            "/api/apps/{id}/credentials/{key}",
            &[("DELETE", "apps.manage")],
            axum::routing::delete(revoke),
        )
}
pub(super) use veyndo_app_model::admission::callback_scope as scope;

async fn list(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &id, false).await?;
    let rows:Vec<Value>=sqlx::query_scalar("SELECT jsonb_build_object('id',id,'permissions',app_permissions,'createdAt',created_at,'expiresAt',expires_at,'creator',user_id,'packageDigest',package_digest) FROM integration_keys WHERE tenant=$1 AND app_id=$2 ORDER BY created_at DESC LIMIT 100").bind(&t).bind(id).fetch_all(&a.db).await?;
    Ok(Json(
        json!({"canManage":auth::permit(&h,"team.manage").is_ok() && h.principal.user.as_deref().is_some_and(|u|u!="bootstrap") && staging::parent(&a,&t).await?.is_none(),"keys":rows,"digest":approval::canonical_digest(&m),"permissions":m.permissions.iter().filter(|p|scope(p).is_some()).collect::<Vec<_>>()}),
    ))
}
async fn create(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    auth::permit(&h, "team.manage")?;
    let user = h
        .principal
        .user
        .as_deref()
        .filter(|u| *u != "bootstrap")
        .ok_or(bad("Personal account required"))?;
    if staging::parent(&a, &t).await?.is_some() {
        return Err(bad("App callback keys require a live workspace"));
    }
    let m = package(&a, &t, &id, true).await?;
    let digest = approval::canonical_digest(&m);
    if v["approve"] != true || v["digest"] != digest {
        return Err(conflict(
            "Approve the current app package digest and its requested callback permissions",
        ));
    }
    let scopes = veyndo_app_model::admission::requested_scopes(
        &action_admission::Authority {
            app: &a,
            context: &h,
        },
        &m.permissions,
        &v["permissions"],
    )
    .map_err(action_admission::error)?;
    let requested = &v["permissions"];
    let days = v["expiresInDays"]
        .as_i64()
        .filter(|n| (1..=90).contains(n))
        .ok_or(bad("Expiry must be 1..90 days"))?;
    let mut tx = a.db.begin().await?;
    sqlx::query("SELECT id FROM tenants WHERE id=$1 FOR UPDATE")
        .bind(&t)
        .fetch_one(&mut *tx)
        .await?;
    let count: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM integration_keys WHERE tenant=$1 AND expires_at>now()",
    )
    .bind(&t)
    .fetch_one(&mut *tx)
    .await?;
    if count >= 32 {
        return Err(bad("Maximum 32 active integration keys"));
    }
    let key = format!("rac_{}{}", uid(), uid());
    let key_id = uid();
    sqlx::query("INSERT INTO integration_keys(id,tenant,user_id,digest,name,permissions,app_id,package_digest,app_permissions,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$10,now()+$9*interval '1 day')").bind(&key_id).bind(&t).bind(user).bind(hash(&key)).bind(format!("App {id}" )).bind(json!(scopes)).bind(&id).bind(&digest).bind(days as i32).bind(json!(requested)).execute(&mut *tx).await?;
    sqlx::query("INSERT INTO outbox(tenant,kind,data) VALUES($1,'app.callback_approved',$2)")
        .bind(&t)
        .bind(json!({"app":id,"digest":digest,"permissions":requested,"actor":user,"keyId":key_id}))
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(
        json!({"id":key_id,"key":key,"permissions":requested,"coreScopes":scopes,"digest":digest,"expiresInDays":days}),
    ))
}
async fn revoke(
    State(a): State<App>,
    h: RequestContext,
    Path((id, key)): Path<(String, String)>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    auth::permit(&h, "team.manage")?;
    sqlx::query("DELETE FROM integration_keys WHERE tenant=$1 AND app_id=$2 AND id=$3")
        .bind(t)
        .bind(id)
        .bind(key)
        .execute(&a.db)
        .await?;
    Ok(Json(json!({"revoked":true})))
}

/// Callback consent is an app capability, not merely its mapped native role scope.
pub(super) fn permit(h: &RequestContext, capability: &str) -> Result<()> {
    let grants = h
        .principal
        .app
        .as_ref()
        .and(h.principal.app_permissions.as_deref())
        .and_then(|s| serde_json::from_str::<Vec<String>>(s).ok());
    let (capability_approved, role_approved) = veyndo_app_model::admission::callback_facts(
        h.principal.app.is_some(),
        grants.as_deref(),
        capability,
        |scope| auth::permit(h, scope).is_ok(),
    );
    if !crate::verified_kernel::app_callback_admissible(capability_approved, role_approved) {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "App callback capability was not approved for this key".into(),
        ));
    }
    Ok(())
}
