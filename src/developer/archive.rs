//! Recoverable App Studio project deletion; installed packages and app records retain their independent lifecycle.
use super::*;
pub(super) async fn set(a: &App, h: &RequestContext, v: &Value) -> Result<Value> {
    auth::permit(h, "developer.manage")?;
    let t = staging::live(a, h).await?;
    let app = v["app"]
        .as_str()
        .filter(|s| !s.is_empty() && s.len() <= 32)
        .ok_or(bad("App required"))?;
    let archived = v["archived"]
        .as_bool()
        .ok_or(bad("Archived boolean required"))?;
    if v["approve"] != true {
        return Err(bad("Approve the App Studio removal/restore first"));
    }
    let mut tx = a.db.begin().await?;
    let n = veyndo_app_storage::build_versions::archive(
        &mut tx,
        veyndo_app_storage::Scope { tenant: &t, app },
        archived,
    )
    .await?;
    if n == 0 {
        return Err(Error(
            StatusCode::NOT_FOUND,
            "App Studio project unavailable in this state".into(),
        ));
    }
    tx.commit().await?;
    Ok(json!({"app":app,"archived":archived,"versions":n}))
}
pub(super) async fn remove(
    State(a): State<App>,
    h: RequestContext,
    Path(app): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(
        set(
            &a,
            &h,
            &json!({"app":app,"archived":true,"approve":v["approve"]}),
        )
        .await?,
    ))
}
pub(super) async fn restore(
    State(a): State<App>,
    h: RequestContext,
    Path(app): Path<String>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(
        set(
            &a,
            &h,
            &json!({"app":app,"archived":false,"approve":v["approve"]}),
        )
        .await?,
    ))
}
