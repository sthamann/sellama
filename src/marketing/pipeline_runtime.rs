//! Durable sequence execution records each action before dispatch, persists delay cursors and reports uncertain effects.
use super::*;
use super::{flow_jobs::Claim, pipeline::Node};
pub(super) enum Outcome {
    Finished(Value),
    Deferred,
}

pub(super) async fn run(a: &App, job: &Claim, f: &flows::Flow) -> Result<Outcome> {
    let (t, id, definition) = (&job.tenant, &job.id, &job.definition);
    let p = f.pipeline.as_ref().ok_or(bad("Pipeline required"))?;
    let graph = p.graph()?;
    let mut next = job.cursor.clone().or_else(|| Some(p.entry.clone()));
    let mut trace = job.execution["trace"]
        .as_array()
        .cloned()
        .unwrap_or_default();
    while let Some(node_id) = next {
        job.renew(a).await?;
        super::flow_access::headers(a, t, f.actor.as_deref()).await?;
        let node = graph.get(&node_id).ok_or(bad("Unknown flow cursor"))?;
        match node {
            Node::Condition {
                condition,
                on_true,
                on_false,
                ..
            } => {
                let data: Cart = serde_json::from_value(definition["cartData"].clone())
                    .map_err(|_| bad("Missing flow cart context"))?;
                let cart = StoredCart {
                    id: String::new(),
                    tenant: t.into(),
                    token: String::new(),
                    data,
                    revision: 0,
                    status: "event".into(),
                };
                let matched = condition.checked_matches(&cart, &definition["ruleContext"])?;
                next = if matched {
                    on_true.clone()
                } else {
                    on_false.clone()
                };
                trace.push(json!({"node":node_id,"matched":matched}));
            }
            Node::Stop { .. } => {
                return Ok(Outcome::Finished(json!({"stopped":true,"trace":trace})));
            }
            Node::Delay {
                seconds,
                next: target,
                ..
            } => {
                job.defer(a, target.as_deref(), *seconds, json!({"trace":trace,"delayCompleted":node_id,"finishAfterDelay":target.is_none()})).await?;
                return Ok(Outcome::Deferred);
            }
            Node::Action {
                action,
                config,
                next: target,
                ..
            } => {
                if action == "action.stop.flow" {
                    return Ok(Outcome::Finished(json!({"stopped":true,"trace":trace})));
                }
                let existing =
                    sqlx::query("SELECT state,result FROM flow_steps WHERE job=$1 AND node=$2")
                        .bind(id)
                        .bind(&node_id)
                        .fetch_optional(&a.db)
                        .await?;
                let result = if let Some(r) = existing {
                    if r.get::<String, _>("state") != "completed" {
                        return Err(bad("Flow step has an uncertain previous execution"));
                    }
                    r.get::<Value, _>("result")
                } else {
                    sqlx::query("INSERT INTO flow_steps(job,node) VALUES($1,$2)")
                        .bind(id)
                        .bind(&node_id)
                        .execute(&a.db)
                        .await?;
                    let result = super::flow_actions::execute(
                        a,
                        t,
                        f,
                        &format!("flow:{id}:{node_id}"),
                        action,
                        config,
                        definition,
                    )
                    .await;
                    match result {
                        Ok(v) => {
                            sqlx::query("UPDATE flow_steps SET state='completed',result=$1,finished_at=now() WHERE job=$2 AND node=$3").bind(&v).bind(id).bind(&node_id).execute(&a.db).await?;
                            v
                        }
                        Err(e) => {
                            sqlx::query("UPDATE flow_steps SET state='failed',error=$1,finished_at=now() WHERE job=$2 AND node=$3").bind(&e.1).bind(id).bind(&node_id).execute(&a.db).await?;
                            return Err(e);
                        }
                    }
                };
                trace.push(json!({"node":node_id,"action":action,"result":result}));
                next = target.clone();
            }
        }
        job.checkpoint(a, next.as_deref(), json!({"trace":trace}))
            .await?;
    }
    Ok(Outcome::Finished(json!({"completed":true,"trace":trace})))
}
