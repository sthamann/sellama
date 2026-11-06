//! Bounded app-record history, current entity rights and restoration through the normal managed save path.
use super::*;
use veyndo_app_storage::record_history as shared;
pub(super) fn router() -> Router<App> {
    Router::new()
        .secure_route(
            "/api/apps/{app}/entities/{entity}/{record}/history",
            &[("GET", "read")],
            get(list),
        )
        .secure_route(
            "/api/apps/{app}/entities/{entity}/{record}/history/{revision}/restore",
            &[("POST", "read")],
            post(restore),
        )
}
pub(super) async fn capture(
    tx: &mut sqlx::PgConnection,
    t: &str,
    m: &Manifest,
    e: &Entity,
    id: &str,
    revision: i64,
    fields: &Value,
) -> Result<()> {
    shared::capture(
        tx,
        &shared::Capture {
            key: records::key(t, &m.id, &e.name, id),
            revision,
            fields,
            read_scopes: &shared::read_scopes(m, &e.name),
        },
    )
    .await
    .map_err(persistence::error)
}
fn entity<'a>(m: &'a Manifest, name: &str, h: &RequestContext, write: bool) -> Result<&'a Entity> {
    let e = m
        .entities
        .iter()
        .find(|e| e.name == name)
        .ok_or(bad("Unknown app entity"))?;
    auth::permit(h, if write { "apps.manage" } else { "apps.read" })?;
    auth::permit(h, "catalog.read")?;
    editor_contract::entity_access(m, e, h, "list")?;
    if write {
        if !m
            .actions
            .iter()
            .any(|a| a.entity.as_deref() == Some(e.name.as_str()) && a.handler == "save")
        {
            return Err(Error(
                StatusCode::FORBIDDEN,
                "This entity has no restorable save action".into(),
            ));
        }
        editor_contract::entity_access(m, e, h, "save")?;
    }
    Ok(e)
}
async fn list(
    State(a): State<App>,
    h: RequestContext,
    Path((app, name, id)): Path<(String, String, String)>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &app, true).await?;
    let e = entity(&m, &name, &h, false)?;
    let mut tx = a.db.begin().await?;
    sqlx::query("SELECT set_config('rac.tenant',$1,true)")
        .bind(&t)
        .execute(&mut *tx)
        .await?;
    let rows = shared::list(
        &mut tx,
        records::key(&t, &app, &name, &id),
        &history_storage::Current(&h),
    )
    .await?;
    tx.commit().await?;
    Ok(Json(
        json!({"versions":rows.iter().map(|r|json!({"revision":r.get::<i64,_>("revision"),"fields":e.fields.iter().map(|f|(f.name.clone(),r.get::<Value,_>("fields")[&f.name].clone())).collect::<serde_json::Map<String,Value>>(),"actor":r.get::<Option<String>,_>("actor"),"source":r.get::<String,_>("source"),"createdAt":r.get::<String,_>("created_at")})).collect::<Vec<_>>(),"canRestore":entity(&m,&e.name,&h,true).is_ok()}),
    ))
}
async fn restore(
    State(a): State<App>,
    h: RequestContext,
    Path((app, name, id, revision)): Path<(String, String, String, i64)>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    let t = merchant(&a, &h)?;
    let m = package(&a, &t, &app, true).await?;
    let e = entity(&m, &name, &h, true)?;
    if v["approve"] != true || v["revision"].as_i64().is_none() {
        return Err(bad("Approve restoration with the current revision"));
    }
    let mut tx = a.db.begin().await?;
    history::context(&mut tx, &h, "app.history.restore").await?;
    sqlx::query("SELECT set_config('rac.tenant',$1,true)")
        .bind(&t)
        .execute(&mut *tx)
        .await?;
    let result = shared::restore(
        &mut tx,
        records::key(&t, &app, &name, &id),
        revision,
        &history_storage::Restore {
            actor: &h,
            manifest: &m,
            entity: e,
            revision: &v["revision"],
        },
    )
    .await
    .map_err(history_storage::error)?;
    tx.commit().await?;
    Ok(Json(result))
}

/// MCP calls the exact HTTP domain operations, retaining entity and historical read permissions.
pub(crate) fn schema(name: &str) -> Option<Value> {
    if !["merchant.app.history", "merchant.app.restore"].contains(&name) {
        return None;
    }
    Some(
        json!({"type":"object","additionalProperties":false,"properties":{"app":{"type":"string"},"entity":{"type":"string"},"id":{"type":"string"},"version":{"type":"integer"},"revision":{"type":"integer"},"approve":{"type":"boolean"}},"required":if name.ends_with("restore"){vec!["app","entity","id","version","revision","approve"]}else{vec!["app","entity","id"]}}),
    )
}
pub(crate) async fn invoke(a: &App, h: &RequestContext, name: &str, v: &Value) -> Result<Value> {
    let app = v["app"].as_str().ok_or(bad("App required"))?.to_owned();
    let entity = v["entity"]
        .as_str()
        .ok_or(bad("Entity required"))?
        .to_owned();
    let id = v["id"].as_str().ok_or(bad("Record required"))?.to_owned();
    if name == "merchant.app.history" {
        let Json(value) = list(State(a.clone()), h.clone(), Path((app, entity, id))).await?;
        return Ok(value);
    }
    if name != "merchant.app.restore" {
        return Err(bad("Unknown app history operation"));
    }
    let Json(value) = restore(
        State(a.clone()),
        h.clone(),
        Path((
            app,
            entity,
            id,
            v["version"].as_i64().ok_or(bad("Version required"))?,
        )),
        Json(v.clone()),
    )
    .await?;
    Ok(value)
}
