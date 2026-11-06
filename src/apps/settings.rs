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
    let mut tx = a.db.begin().await?;
    let mut value = veyndo_app_storage::settings::read(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: &t,
            app: &id,
        },
        &m,
        &secret_storage::Crypto,
    )
    .await
    .map_err(settings_error)?;
    tx.commit().await?;
    value["canManage"] = json!(staging::parent(&a, &t).await?.is_none());
    value["encryptionReady"] = json!(veyndo::inference::settings::encryption_ready());
    Ok(Json(value))
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
    let mut tx = a.db.begin().await?;
    let revision = veyndo_app_storage::settings::save(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: &t,
            app: &id,
        },
        &m,
        &veyndo_app_storage::settings::Update {
            digest: &digest,
            revision,
            actor: h
                .principal
                .user
                .as_deref()
                .ok_or(bad("Personal account required"))?,
        },
        &v["values"],
        &secret_storage::Crypto,
    )
    .await
    .map_err(settings_error)?;
    tx.commit().await?;
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

fn settings_error(value: veyndo_app_storage::settings::Error<Error>) -> Error {
    match value {
        veyndo_app_storage::settings::Error::Storage(e) => secret_storage::error(e),
        veyndo_app_storage::settings::Error::Model(e) => model_contract::error(e),
    }
}
