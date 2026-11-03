//! Reporting reuses the behavior owner's exact receipt/expiry predicate and inherited policy resolver; no new tracking store.
use crate::*;
pub(super) async fn read(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    q: &super::config::Query,
    p: &super::period::Period,
    currency: &str,
    base: &commerce::Settings,
    rows: &[sqlx::postgres::PgRow],
) -> Result<Value> {
    let mut policies = vec![];
    for row in rows {
        let channel: String = row.get("id");
        let kind: Option<String> = row.get("kind");
        if q.channel.as_ref().is_some_and(|id| id != &channel)
            || q.channel_type != "all" && kind.as_deref() != Some(&q.channel_type)
        {
            continue;
        }
        let settings = commerce::restore_checkout_data(
            base,
            row.get::<Option<Value>, _>("overrides")
                .unwrap_or(json!([])),
        )?;
        let policy = &settings.legal.behavior_analytics;
        let enabled = policy.enabled && settings.legal.purposes.get("analytics") == Some(&true);
        if enabled {
            policies.push(json!({"channel":channel,"days":policy.retention_days,"version":legal::policy_version(&settings.legal)}));
        }
    }
    // Only bundled SQL fragments are composed. The underlying native consent filter stays a single source.
    let eligible = include_str!("../../cognition/behavior/eligible.sql")
        .replace(
            "FROM session_signal_events e",
            "FROM session_signal_events e JOIN policies p ON p.channel=e.channel_id",
        )
        .replace("e.channel_id=$2", "e.channel_id=p.channel")
        .replace("days=>$3", "days=>p.days")
        .replace("c.policy_version=$4", "c.policy_version=p.version");
    let sql = format!(
        "{}, policies AS (SELECT * FROM jsonb_to_recordset($10::jsonb) AS p(channel text,days int,version text)), events AS ({eligible}) {}",
        include_str!("source.sql"),
        include_str!("traffic.sql")
    );
    let value: Value = sqlx::query_scalar(sqlx::AssertSqlSafe(sql.as_str()))
        .bind(t)
        .bind(if q.compare { &p.previous } else { &p.from })
        .bind(&p.from)
        .bind(&p.to)
        .bind(&p.interval)
        .bind(&q.timezone)
        .bind(currency)
        .bind(&q.channel)
        .bind(&q.channel_type)
        .bind(json!(policies))
        .fetch_one(&mut **tx)
        .await?;
    Ok(value)
}
