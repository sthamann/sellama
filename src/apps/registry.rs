//! Atomic installation and additive schema upgrades; immutable version digests preserve history.
use super::*;
pub(super) async fn active_manifests(a: &App, h: &RequestContext) -> Result<Vec<Manifest>> {
    let rows =
        sqlx::query("SELECT manifest FROM app_packages WHERE tenant=$1 AND active ORDER BY id")
            .bind(tenant(h)?)
            .fetch_all(&a.db)
            .await?;
    rows.into_iter()
        .map(|r| serde_json::from_value(r.get("manifest")).map_err(|_| bad("Invalid app package")))
        .collect()
}

pub(crate) async fn package(a: &App, t: &str, id: &str, active: bool) -> Result<Manifest> {
    package_on(&a.db, t, id, active).await
}
/// Lifecycle transactions use their current backend without recursively taking a pooled connection.
pub(crate) async fn package_on<'e>(
    db: impl sqlx::Executor<'e, Database = sqlx::Postgres>,
    t: &str,
    id: &str,
    active: bool,
) -> Result<Manifest> {
    let row = sqlx::query("SELECT manifest,active FROM app_packages WHERE tenant=$1 AND id=$2")
        .bind(t)
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(Error(StatusCode::NOT_FOUND, "App not installed".into()))?;
    if active && !row.get::<bool, _>("active") {
        return Err(conflict("App is inactive"));
    }
    serde_json::from_value(row.get("manifest")).map_err(|_| bad("Invalid installed manifest"))
}
pub(crate) async fn install(a: &App, t: &str, m: Manifest) -> Result<Value> {
    let mut tx = a.db.begin_privileged().await?;
    let result = install_tx(&mut tx, t, m).await?;
    tx.commit().await?;
    Ok(result)
}
pub(crate) async fn install_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: Manifest,
) -> Result<Value> {
    install_inner(tx, t, m, true).await
}
pub(crate) async fn install_preview(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: Manifest,
) -> Result<Value> {
    let private: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM shop_environments WHERE tenant=$1 AND preview_owner IS NOT NULL)").bind(t).fetch_one(&mut **tx).await?;
    if !private {
        return Err(bad(
            "Mutable app preview requires a personal preview environment",
        ));
    }
    install_inner(tx, t, m, false).await
}
async fn install_inner(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: Manifest,
    versions: bool,
) -> Result<Value> {
    let value = json!(m);
    veyndo_app_storage::installation::install(
        tx,
        &veyndo_app_storage::installation::Package {
            scope: veyndo_app_storage::Scope {
                tenant: t,
                app: &m.id,
            },
            version: &m.version,
            manifest: &value,
            versions,
        },
        &package_install::Host {
            tenant: t,
            manifest: &m,
        },
    )
    .await
    .map_err(package_install::error)
}
