//! Actor-private, optimistic mutable autosaves; these never install or alter a published package.
use super::*;
use veyndo_app_storage::drafts as shared;
fn actor(h: &RequestContext) -> String {
    h.principal
        .user
        .clone()
        .unwrap_or_else(|| hash(header(h, "authorization").unwrap_or("")))
}
pub(super) fn router() -> Router<App> {
    Router::new()
        .secure_route(
            "/api/developer/drafts",
            &[("GET", "developer.manage")],
            get(list),
        )
        .secure_route(
            "/api/developer/drafts/{id}",
            &[("PUT", "developer.manage"), ("DELETE", "developer.manage")],
            axum::routing::put(save).delete(remove),
        )
}
async fn list(State(a): State<App>, h: RequestContext) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let owner = actor(&h);
    let mut tx = a.db.begin().await?;
    let rows = shared::list(
        &mut tx,
        shared::Owner {
            tenant: &t,
            actor: &owner,
        },
    )
    .await?;
    tx.commit().await?;
    Ok(Json(json!({"drafts":rows})))
}
async fn save(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let owner = actor(&h);
    let mut tx = a.db.begin().await?;
    let revision = shared::save(
        &mut tx,
        shared::Owner {
            tenant: &t,
            actor: &owner,
        },
        &shared::Draft {
            id: &id,
            manifest: &v["manifest"],
            environment: v["environment"].as_str(),
            revision: v["revision"].as_i64(),
        },
        &OwnedEnvironment,
    )
    .await
    .map_err(version_storage::error)?;
    tx.commit().await?;
    Ok(Json(json!({"id":id,"revision":revision})))
}
async fn remove(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let owner = actor(&h);
    let mut tx = a.db.begin().await?;
    shared::remove(
        &mut tx,
        shared::Owner {
            tenant: &t,
            actor: &owner,
        },
        &id,
    )
    .await?;
    tx.commit().await?;
    Ok(Json(json!({"deleted":true})))
}
/// Native current shop/private-environment relation, on the original scoped connection.
struct OwnedEnvironment;
impl shared::EnvironmentAdmission for OwnedEnvironment {
    fn owned<'a>(
        &'a self,
        tx: &'a mut sqlx::PgConnection,
        tenant: &'a str,
        environment: &'a str,
    ) -> shared::AdmissionFuture<'a> {
        Box::pin(async move {
            sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM shop_environments WHERE live_tenant=$1 AND tenant=$2)",
            )
            .bind(tenant)
            .bind(environment)
            .fetch_one(tx)
            .await
        })
    }
}
