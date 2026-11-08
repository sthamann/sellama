//! PostgreSQL ownership of Flow claims, cursor checkpoints and terminal results.
use super::*;

pub(super) struct Claim {
    pub(super) id: String,
    pub(super) tenant: String,
    pub(super) definition: Value,
    pub(super) cursor: Option<String>,
    pub(super) execution: Value,
    attempt: i32,
}

pub(super) async fn claim(a: &App) -> Result<Option<Claim>> {
    // An expired claim can have dispatched an effect. Preserve uncertainty.
    sqlx::query("UPDATE flow_jobs SET state='uncertain',error='Worker stopped before result confirmation' WHERE state='running' AND lease_until<now()").execute(&a.db).await?;
    let row = sqlx::query(
        "WITH ready AS (
           SELECT id FROM flow_jobs
           WHERE state='queued' AND available_at<=now()
             AND EXISTS(SELECT 1 FROM tenants t WHERE t.id=coalesce(
               (SELECT live_tenant FROM shop_environments WHERE tenant=flow_jobs.tenant),
               flow_jobs.tenant) AND t.status='active')
           ORDER BY available_at,event_id LIMIT 1 FOR UPDATE SKIP LOCKED
         )
         UPDATE flow_jobs j SET state='running',attempts=j.attempts+1,
           lease_until=now()+interval '5 minutes'
         FROM ready WHERE j.id=ready.id
         RETURNING j.id,j.tenant,j.definition,j.cursor,j.execution,j.attempts",
    )
    .fetch_optional(&a.db)
    .await?;
    Ok(row.map(|row| Claim {
        id: row.get("id"),
        tenant: row.get("tenant"),
        definition: row.get("definition"),
        cursor: row.get("cursor"),
        execution: row.get("execution"),
        attempt: row.get("attempts"),
    }))
}

impl Claim {
    pub(super) async fn renew(&self, a: &App) -> Result<()> {
        let held = sqlx::query(
            "UPDATE flow_jobs SET lease_until=now()+interval '5 minutes'
             WHERE id=$1 AND tenant=$2 AND attempts=$3 AND state='running' AND lease_until>=now()",
        )
        .bind(&self.id)
        .bind(&self.tenant)
        .bind(self.attempt)
        .execute(&a.db)
        .await?;
        self.require_claim(held.rows_affected())
    }

    pub(super) async fn checkpoint(
        &self,
        a: &App,
        next: Option<&str>,
        execution: Value,
    ) -> Result<()> {
        let saved = sqlx::query(
            "UPDATE flow_jobs SET cursor=$4,execution=$5
             WHERE id=$1 AND tenant=$2 AND attempts=$3 AND state='running'",
        )
        .bind(&self.id)
        .bind(&self.tenant)
        .bind(self.attempt)
        .bind(next)
        .bind(execution)
        .execute(&a.db)
        .await?;
        self.require_claim(saved.rows_affected())
    }

    pub(super) async fn defer(
        &self,
        a: &App,
        next: Option<&str>,
        seconds: u64,
        execution: Value,
    ) -> Result<()> {
        let saved = sqlx::query(
            "UPDATE flow_jobs SET state='queued',cursor=$4,execution=$5,
               available_at=now()+make_interval(secs=>$6),lease_until=NULL
             WHERE id=$1 AND tenant=$2 AND attempts=$3 AND state='running'",
        )
        .bind(&self.id)
        .bind(&self.tenant)
        .bind(self.attempt)
        .bind(next)
        .bind(execution)
        .bind(seconds as f64)
        .execute(&a.db)
        .await?;
        self.require_claim(saved.rows_affected())
    }

    pub(super) async fn finish(
        &self,
        tx: &mut sqlx::PgConnection,
        state: &str,
        result: &Option<Value>,
        error: Option<String>,
    ) -> Result<bool> {
        let saved = sqlx::query(
            "UPDATE flow_jobs SET state=$4,result=$5,error=$6,lease_until=NULL
             WHERE id=$1 AND tenant=$2 AND attempts=$3 AND state='running'",
        )
        .bind(&self.id)
        .bind(&self.tenant)
        .bind(self.attempt)
        .bind(state)
        .bind(result)
        .bind(error)
        .execute(tx)
        .await?;
        Ok(saved.rows_affected() == 1)
    }

    fn require_claim(&self, rows: u64) -> Result<()> {
        if rows == 1 {
            Ok(())
        } else {
            Err(conflict("Flow worker lost its lease"))
        }
    }
}
