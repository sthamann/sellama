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
fn event_kind(m: &Manifest, action: &str) -> String {
    let grouped = format!("app.{}.job_queued", m.id);
    if m.events.contains(&grouped) {
        grouped
    } else {
        format!("app.{}.job_{action}", m.id)
    }
}

async fn signal(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
    id: &str,
    action: &str,
) -> Result<()> {
    Ok(veyndo_app_storage::jobs::signal(
        tx,
        veyndo_app_storage::Scope {
            tenant: t,
            app: &m.id,
        },
        id,
        &event_kind(m, action),
    )
    .await?)
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
    if !(1..=100).contains(&limit)
        || q.after
            .as_ref()
            .is_some_and(|s| s.is_empty() || s.len() > 100)
        || q.group
            .as_ref()
            .is_some_and(|s| s.is_empty() || s.len() > 100)
    {
        return Err(bad(
            "Invalid app job page: limit 1..100; cursor/group 1..100 bytes",
        ));
    }
    // Resolve the scoped anchor once: subsequent archival cannot turn its tuple into SQL NULL.
    let before: Option<String> = if let Some(after) = &q.after {
        Some(
            sqlx::query_scalar(
                "SELECT created_at::text FROM app_jobs WHERE tenant=$1 AND app=$2 AND id=$3",
            )
            .bind(&t)
            .bind(&id)
            .bind(after)
            .fetch_optional(&a.db)
            .await?
            .ok_or(conflict(
                "App job cursor no longer exists; reload the job history",
            ))?,
        )
    } else {
        None
    };
    // Correlation is an untrusted label, never a permission or a completion receipt.
    // Retention is separately capped at 1000/shop; no unbounded input/index scan.
    let mut rows: Vec<Value> = sqlx::query_scalar("SELECT jsonb_build_object('id',j.id,'action',j.action,'packageDigest',j.package_digest,'status',CASE WHEN j.status IN ('running','cancel_requested') AND j.lease_until<now() THEN 'uncertain' ELSE j.status END,'progress',j.progress,'message',j.message,'result',CASE WHEN j.status='succeeded' THEN j.result ELSE NULL END,'actor',j.actor,'revision',j.revision,'createdAt',j.created_at,'updatedAt',j.updated_at) FROM app_jobs j WHERE j.tenant=$1 AND j.app=$2 AND ($3::text IS NULL OR j.input->>'jobGroup'=$3) AND ($4::text IS NULL OR (j.created_at,j.id)<($5::text::timestamptz,$4)) ORDER BY j.created_at DESC,j.id DESC LIMIT $6")
        .bind(&t).bind(&id).bind(&q.group).bind(&q.after).bind(before).bind(limit + 1).fetch_all(&a.db).await?;
    let has_more = rows.len() > limit as usize;
    rows.truncate(limit as usize);
    let next = if has_more {
        rows.last()
            .and_then(|r| r["id"].as_str())
            .map(str::to_owned)
    } else {
        None
    };
    let digest = approval::canonical_digest(&m);
    for row in &mut rows {
        let allowed = row["packageDigest"] == digest
            && m.actions
                .iter()
                .find(|action| Some(action.name.as_str()) == row["action"].as_str())
                .is_some_and(|action| {
                    auth::permit(&h, action.permission.as_deref().unwrap_or("apps.manage")).is_ok()
                        && gateway::additional_permissions(&h, action).is_ok()
                });
        if !allowed {
            row["message"] = json!({});
            row["result"] = Value::Null;
        }
        row.as_object_mut().unwrap().remove("packageDigest");
    }
    Ok(Json(
        json!({"jobs":rows,"hasMore":has_more,"nextCursor":next,"limit":limit}),
    ))
}
async fn detail(
    State(a): State<App>,
    h: RequestContext,
    Path((app, id)): Path<(String, String)>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &app, true).await?;
    let row=sqlx::query("SELECT actor,action,package_digest,jsonb_build_object('id',id,'status',CASE WHEN status IN ('running','cancel_requested') AND lease_until<now() THEN 'uncertain' ELSE status END,'progress',progress,'message',message,'result',CASE WHEN status='succeeded' THEN result ELSE NULL END,'revision',revision) AS data FROM app_jobs WHERE tenant=$1 AND app=$2 AND id=$3")
        .bind(&t).bind(&app).bind(&id).fetch_optional(&a.db).await?.ok_or(Error(StatusCode::NOT_FOUND,"App job not found".into()))?;
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
    let row=sqlx::query("SELECT action,actor,permission,status,revision,input,lease_until<now() AS expired FROM app_jobs WHERE tenant=$1 AND app=$2 AND id=$3 FOR UPDATE").bind(&t).bind(&app).bind(&id).fetch_optional(&mut *tx).await?.ok_or(Error(StatusCode::NOT_FOUND,"App job not found".into()))?;
    if v["revision"].as_i64() != Some(row.get("revision")) {
        return Err(conflict("App job revision changed"));
    }
    let status: String = row.get("status");
    let expired = row.get::<Option<bool>, _>("expired").unwrap_or(false);
    let op = v["operation"]
        .as_str()
        .ok_or(bad("Job operation required"))?;
    if op == "archive" {
        if !["succeeded", "failed", "cancelled"].contains(&status.as_str()) {
            return Err(conflict("Only completed jobs can be archived"));
        }
        sqlx::query("DELETE FROM app_jobs WHERE tenant=$1 AND app=$2 AND id=$3")
            .bind(&t)
            .bind(&app)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    } else {
        let next = match op {
            "cancel" if status == "queued" => "cancelled",
            "cancel" if status == "running" => "cancel_requested",
            "resolve_cancelled" if status == "uncertain" || expired => "cancelled",
            "retry" if status == "failed" || status == "uncertain" || expired => "queued",
            _ => return Err(conflict("Unsupported job transition")),
        };
        if ["retry", "resolve_cancelled"].contains(&op) && v["approveUnknownOutcome"] != true {
            return Err(conflict(
                "Confirm external outcome before retrying or resolving this job",
            ));
        }
        if op == "retry" {
            let action = m
                .actions
                .iter()
                .find(|a| a.name == row.get::<String, _>("action") && a.handler == "job")
                .ok_or(conflict("Job action is no longer installed"))?;
            auth::permit(&h, action.permission.as_deref().unwrap_or("apps.manage"))?;
            gateway::additional_permissions(&h, action)?;
            validate_input(&action.input_schema, &row.get::<Value, _>("input"))?;
            signal(&mut tx, &t, &m, &id, &action.name).await?;
        }
        sqlx::query("UPDATE app_jobs SET status=$4,lease=CASE WHEN $4='cancel_requested' THEN lease ELSE NULL END,lease_until=CASE WHEN $4='cancel_requested' THEN lease_until ELSE NULL END,actor=CASE WHEN $4='queued' THEN $5 ELSE actor END,package_digest=CASE WHEN $4='queued' THEN $6 ELSE package_digest END,progress=CASE WHEN $4='queued' THEN 0 ELSE progress END,started_at=CASE WHEN $4='queued' THEN NULL ELSE started_at END,revision=revision+1,updated_at=now() WHERE tenant=$1 AND app=$2 AND id=$3").bind(&t).bind(&app).bind(&id).bind(next).bind(h.principal.user.as_deref().ok_or(bad("Personal account required"))?).bind(approval::canonical_digest(&m)).execute(&mut *tx).await?;
    }
    sqlx::query("INSERT INTO outbox(tenant,kind,data) VALUES($1,'app.job_controlled',$2)")
        .bind(&t)
        .bind(json!({"app":app,"jobId":id,"operation":op,"actor":h.principal.user}))
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(Json(json!({"accepted":true})))
}
