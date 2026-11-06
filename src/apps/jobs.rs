//! Durable long actions piggyback on the existing outbox. Apps claim a fenced lease; unknown side effects are never retried automatically.
use super::*;
pub(super) async fn enqueue(
    a: &App,
    h: &RequestContext,
    m: &Manifest,
    action: &Action,
    v: &Value,
) -> Result<Value> {
    let t = merchant(a, h)?;
    if staging::parent(a, &t).await?.is_some() {
        return Err(bad("Long external jobs require a live workspace"));
    }
    let actor = h
        .principal
        .user
        .as_deref()
        .filter(|u| *u != "bootstrap")
        .ok_or(bad("Personal account required for long jobs"))?;
    let key = header(h, "idempotency-key")
        .filter(|s| !s.is_empty() && s.len() <= 100)
        .ok_or(bad("Idempotency-Key is required for a long app job"))?;
    if v.to_string().len() > 16384 {
        return Err(bad("App job input exceeds 16 KiB"));
    }
    let package_digest = approval::canonical_digest(m);
    let id = uid();
    let event = event_kind(m, &action.name);
    let mut tx = a.db.begin().await?;
    let result = veyndo_app_storage::jobs::enqueue(
        &mut tx,
        &veyndo_app_storage::jobs::NewJob {
            scope: veyndo_app_storage::Scope {
                tenant: &t,
                app: &m.id,
            },
            id: &id,
            action: &action.name,
            actor,
            permission: action.permission.as_deref().unwrap_or("apps.manage"),
            package_digest: &package_digest,
            request_key: key,
            input: v,
            event_kind: &event,
        },
    )
    .await
    .map_err(persistence::error)?;
    tx.commit().await?;
    Ok(result)
}
pub(super) fn event_kind(m: &Manifest, action: &str) -> String {
    veyndo_app_storage::job_projection::event_kind(m, action)
}

pub(super) fn router() -> Router<App> {
    Router::new()
        .secure_route("/api/apps/{id}/jobs", &[("GET", "apps.manage")], get(list))
        .secure_route(
            "/api/apps/{id}/jobs/{job}",
            &[("GET", "read"), ("POST", "apps.manage")],
            get(detail).post(control),
        )
}
#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct JobPage {
    limit: Option<i64>,
    after: Option<String>,
    group: Option<String>,
}
async fn list(
    State(a): State<App>,
    h: RequestContext,
    Path(id): Path<String>,
    axum::extract::Query(q): axum::extract::Query<JobPage>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &id, false).await?;
    let limit = q.limit.unwrap_or(100);
    let mut tx = a.db.begin().await?;
    let page = veyndo_app_storage::job_history::list(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: &t,
            app: &id,
        },
        &veyndo_app_storage::job_history::Query {
            limit,
            after: q.after.as_deref(),
            group: q.group.as_deref(),
        },
    )
    .await
    .map_err(persistence::error)?;
    tx.commit().await?;
    let mut rows = page.rows;
    veyndo_app_storage::job_projection::history(&action_admission::Current(&h), &m, &mut rows);
    Ok(Json(
        json!({"jobs":rows,"hasMore":page.has_more,"nextCursor":page.next_cursor,"limit":limit}),
    ))
}
async fn detail(
    State(a): State<App>,
    h: RequestContext,
    Path((app, id)): Path<(String, String)>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &app, true).await?;
    let mut tx = a.db.begin().await?;
    let row = veyndo_app_storage::job_history::detail(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: &t,
            app: &app,
        },
        &id,
    )
    .await?
    .ok_or(Error(StatusCode::NOT_FOUND, "App job not found".into()))?;
    if h.principal.user.as_deref() != Some(row.get::<String, _>("actor").as_str())
        && auth::permit(&h, "apps.manage").is_err()
    {
        return Err(Error(StatusCode::NOT_FOUND, "App job not found".into()));
    }
    if row.get::<String, _>("package_digest") != approval::canonical_digest(&m) {
        return Err(conflict("Job package changed; review its archived result"));
    }
    let name: String = row.get("action");
    let action = m
        .actions
        .iter()
        .find(|a| a.name == name && a.handler == "job")
        .ok_or(conflict("Job action removed"))?;
    auth::permit(&h, action.permission.as_deref().unwrap_or("apps.manage"))?;
    gateway::additional_permissions(&h, action)?;
    tx.commit().await?;
    Ok(Json(row.get("data")))
}
async fn control(
    State(a): State<App>,
    h: RequestContext,
    Path((app, id)): Path<(String, String)>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &app, true).await?;
    let mut tx = a.db.begin().await?;
    let digest = approval::canonical_digest(&m);
    let result = veyndo_app_storage::job_control::control(
        &mut tx,
        &veyndo_app_storage::job_control::Context {
            scope: veyndo_app_storage::Scope {
                tenant: &t,
                app: &app,
            },
            actor: h.principal.user.as_deref(),
            package_digest: &digest,
        },
        &id,
        &v,
        &job_control::Admission {
            context: &h,
            manifest: &m,
        },
    )
    .await
    .map_err(job_control::error)?;
    tx.commit().await?;
    Ok(Json(result))
}
