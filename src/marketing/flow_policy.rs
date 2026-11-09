//! All configuration entry points require the publishing actor's native action rights; queued work rechecks them.
use super::*;
pub(crate) fn authorize_flow(h: &RequestContext, f: &flows::Flow) -> Result<()> {
    fn action(h: &RequestContext, name: &str) -> Result<()> {
        auth::permit(h, flow_actions::permission(name))?;
        if matches!(name, "ai_proposal" | "work_proposal") {
            agent::assistant_access(h)?;
        }
        if matches!(name, "ai_proposal" | "work_proposal" | "knowledge.extract") {
            auth::permit(h, "knowledge.read")?;
        }
        Ok(())
    }
    if let Some(p) = &f.pipeline {
        for node in &p.nodes {
            if let pipeline::Node::Action { action: name, .. } = node {
                action(h, name)?;
            }
        }
    } else {
        action(h, &f.action)?;
    }
    Ok(())
}

/// Authoring checks see one consistent snapshot and acquire no publication locks.
pub(super) async fn preflight(
    a: &App,
    t: &str,
    h: &RequestContext,
    id: &str,
    expected: i64,
    data: &Value,
) -> Result<Value> {
    let mut tx = a.db.begin_read_snapshot().await?;
    validate_config(&mut tx, t, h, data, false).await?;
    lifecycle::validate_references(&mut tx, t, "flows", id, data).await?;
    let revision: Option<i64> =
        sqlx::query_scalar("SELECT revision FROM commerce_flows WHERE tenant=$1 AND id=$2")
            .bind(t)
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;
    if revision.unwrap_or(0) != expected {
        return Err(conflict("Configuration revision changed"));
    }
    tx.commit().await?;
    Ok(json!({"valid":true,"saved":false,"revision":expected}))
}

/// Native save and release validate final settings and installed app actions in their write transaction.
pub(crate) async fn validate_flow_config(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    h: &RequestContext,
    value: &Value,
) -> Result<()> {
    validate_config(tx, t, h, value, true).await
}

async fn validate_config(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    h: &RequestContext,
    value: &Value,
    lock: bool,
) -> Result<()> {
    let f: flows::Flow = serde_json::from_value(value.clone()).map_err(|_| bad("Invalid flow"))?;
    f.validate()?;
    authorize_flow(h, &f)?;
    if let Some(template) = &f.work_template {
        super::work_template_source::load(tx, t, h, template).await?;
    }
    let settings_query = if lock {
        "SELECT data FROM commerce_settings WHERE tenant=$1 FOR UPDATE"
    } else {
        "SELECT data FROM commerce_settings WHERE tenant=$1"
    };
    let settings = commerce::decode_config(
        sqlx::query_scalar(settings_query)
            .bind(t)
            .fetch_one(&mut **tx)
            .await?,
    )?;
    commerce::validate_names(&value["name"], &settings, 100)?;
    super::flow_text::validate(&f, &settings)?;
    for step in app_flows::steps(&f) {
        let target = step
            .app_action
            .as_ref()
            .ok_or(bad("Flow app action required"))?;
        if lock {
            sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1,7))")
                .bind(format!("{t}:{}", target.app))
                .execute(&mut **tx)
                .await?;
        }
        let row = sqlx::query("SELECT manifest,active FROM app_packages WHERE tenant=$1 AND id=$2")
            .bind(t)
            .bind(&target.app)
            .fetch_optional(&mut **tx)
            .await?
            .ok_or(bad("Flow app is not installed"))?;
        if !row.get::<bool, _>("active") {
            return Err(conflict("Flow app is inactive"));
        }
        let m: apps::Manifest = serde_json::from_value(row.get("manifest"))
            .map_err(|_| bad("Invalid installed manifest"))?;
        app_flows::validate_manifest_flow(h, &step, &m)?;
    }
    Ok(())
}
