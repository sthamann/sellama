//! Digest-bound per-shop app secret rotation reuses platform authenticated encryption; no plaintext read endpoint.
use super::*;
const KINDS: [&str; 3] = ["service", "webhook", "outbound"];
fn applicable(m: &Manifest, kind: &str) -> bool {
    match kind {
        "service" => m.permissions.contains(&"service.call".into()),
        "webhook" => !m.webhooks.is_empty(),
        "outbound" => m.event_delivery.as_ref().is_some_and(|d| d.url.is_some()),
        _ => false,
    }
}
pub(super) fn router() -> Router<App> {
    Router::new()
        .secure_route(
            "/api/apps/{id}/secrets",
            &[("GET", "apps.manage")],
            get(list),
        )
        .secure_route(
            "/api/apps/{id}/secrets/{kind}",
            &[("PUT", "apps.manage")],
            axum::routing::put(rotate),
        )
}
async fn list(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &id, false).await?;
    let mut tx = a.db.begin().await?;
    let secrets = veyndo_app_storage::secrets::list(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: &t,
            app: &id,
        },
    )
    .await?;
    tx.commit().await?;
    Ok(Json(
        json!({"digest":approval::canonical_digest(&m),"kinds":KINDS.iter().filter(|k|applicable(&m,k)).collect::<Vec<_>>(),"canManage":auth::permit(&h,"team.manage").is_ok() && h.principal.user.as_deref().is_some_and(|u|u!="bootstrap") && staging::parent(&a,&t).await?.is_none(),"secrets":secrets,"encryptionReady":veyndo::inference::settings::encryption_ready()}),
    ))
}
async fn rotate(
    State(a): State<App>,
    h: RequestContext,
    Path((id, kind)): Path<(String, String)>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    auth::permit(&h, "team.manage")?;
    let actor = h
        .principal
        .user
        .as_deref()
        .filter(|u| *u != "bootstrap")
        .ok_or(bad("Personal account required"))?;
    if !KINDS.contains(&kind.as_str()) || staging::parent(&a, &t).await?.is_some() {
        return Err(bad("Secret kind or live workspace is invalid"));
    }
    let m = package(&a, &t, &id, true).await?;
    if !applicable(&m, &kind) {
        return Err(bad("Secret kind is not declared by this app"));
    }
    let digest = approval::canonical_digest(&m);
    let revision = v["revision"]
        .as_i64()
        .filter(|v| *v >= 0)
        .ok_or(bad("Secret revision required"))?;
    if v["approve"] != true || v["digest"] != digest {
        return Err(conflict(
            "Approve the current package digest before rotating its secret",
        ));
    }
    let secret = v["secret"]
        .as_str()
        .filter(|s| (32..=4096).contains(&s.len()) && !s.chars().any(char::is_control))
        .ok_or(bad(
            "Secret must be 32..4096 characters without control characters",
        ))?;
    let revision = store(
        &a,
        &t,
        &id,
        SecretWrite {
            kind: &kind,
            digest: &digest,
            revision,
            actor,
            secret,
        },
    )
    .await?;
    Ok(Json(json!({"rotated":true,"revision":revision})))
}
/// Shared encrypted persistence for transport credentials and declared app settings.
pub(super) use veyndo_app_storage::secrets::Write as SecretWrite;
pub(super) async fn store(a: &App, t: &str, id: &str, write: SecretWrite<'_>) -> Result<i64> {
    let mut tx = a.db.begin().await?;
    let revision = veyndo_app_storage::secrets::rotate(
        &mut tx,
        veyndo_app_storage::Scope { tenant: t, app: id },
        &write,
        &secret_storage::Crypto,
    )
    .await
    .map_err(secret_storage::error)?;
    tx.commit().await?;
    Ok(revision)
}
/// Existing operator fallbacks apply only when the scoped store has no configured value.
pub(super) async fn resolve(a: &App, t: &str, m: &Manifest, kind: &str) -> Result<Option<String>> {
    let mut tx = a.db.begin().await?;
    let secret = veyndo_app_storage::secrets::resolve(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: t,
            app: &m.id,
        },
        kind,
        &approval::canonical_digest(m),
        &secret_storage::Crypto,
    )
    .await
    .map_err(secret_storage::error)?;
    tx.commit().await?;
    Ok(secret)
}
/// The original intake/receipt transaction retains the shared secret lock through verification.
pub(super) async fn resolve_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
    kind: &str,
) -> Result<Option<String>> {
    veyndo_app_storage::secrets::resolve_locked(
        tx,
        veyndo_app_storage::Scope {
            tenant: t,
            app: &m.id,
        },
        kind,
        &approval::canonical_digest(m),
        &secret_storage::Crypto,
    )
    .await
    .map_err(secret_storage::error)
}
