//! Declared app settings reuse the digest-bound encrypted secret owner; secret values never have a browser read path.
use super::*;
pub(super) fn router() -> Router<App> {
    Router::new().secure_route(
        "/api/apps/{id}/settings",
        &[("GET", "apps.manage"), ("PUT", "apps.manage")],
        get(read).put(save),
    )
}
async fn read(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    auth::permit(&h, "team.manage")?;
    if !verified_kernel::persistent_key_admissible(
        h.principal.personal_session,
        auth::permit(&h, "team.manage").is_ok(),
    ) {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Personal administrator session required".into(),
        ));
    }
    let m = package(&a, &t, &id, false).await?;
    let digest = approval::canonical_digest(&m);
    let row = secret_storage::metadata(&a, &t, &id, "settings").await?;
    let revision = row.as_ref().map(|r| r.revision).unwrap_or(0);
    let current = row.as_ref().is_none_or(|r| r.digest == digest);
    let values = if current {
        resolve(&a, &t, &m).await?
    } else {
        json!({})
    };
    let visible = veyndo_app_model::settings::visible(&m.settings, &values);
    let configured = veyndo_app_model::settings::configured(&m.settings, &values);
    Ok(Json(
        json!({"fields":m.settings,"values":visible,"configured":configured,"revision":revision,"digest":digest,"current":current,"canManage":staging::parent(&a,&t).await?.is_none(),"encryptionReady":veyndo::inference::settings::encryption_ready()}),
    ))
}
async fn save(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    auth::permit(&h, "team.manage")?;
    if !verified_kernel::persistent_key_admissible(
        h.principal.personal_session,
        auth::permit(&h, "team.manage").is_ok(),
    ) || staging::parent(&a, &t).await?.is_some()
    {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Settings require a personal live-shop administrator session".into(),
        ));
    }
    let m = package(&a, &t, &id, true).await?;
    let digest = approval::canonical_digest(&m);
    if v["approve"] != true || v["digest"] != digest {
        return Err(conflict(
            "Approve the current package before saving settings",
        ));
    }
    let revision = v["revision"]
        .as_i64()
        .filter(|n| *n >= 0)
        .ok_or(bad("Settings revision required"))?;
    let values = if secret_storage::metadata(&a, &t, &id, "settings")
        .await?
        .is_some_and(|row| row.digest == digest)
    {
        resolve(&a, &t, &m).await?
    } else {
        json!({})
    };
    let encoded = veyndo_app_model::settings::prepare(&m.settings, &values, &v["values"])
        .map_err(model_contract::error)?;
    let revision = secrets::store(
        &a,
        &t,
        &id,
        secrets::SecretWrite {
            kind: "settings",
            digest: &digest,
            revision,
            actor: h
                .principal
                .user
                .as_deref()
                .ok_or(bad("Personal account required"))?,
            secret: &encoded,
        },
    )
    .await?;
    Ok(Json(json!({"saved":true,"revision":revision})))
}
pub(super) async fn resolve(a: &App, t: &str, m: &Manifest) -> Result<Value> {
    let Some(encoded) = secrets::resolve(a, t, m, "settings").await? else {
        return Ok(json!({}));
    };
    let values: Value =
        serde_json::from_str(&encoded).map_err(|_| bad("Invalid encrypted app settings"))?;
    // A removed declaration never becomes available to a new package or remote service.
    Ok(veyndo_app_model::settings::declared(&m.settings, &values))
}
