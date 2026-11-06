//! Native current-actor/trust/connected-frontend/commerce admission for the shared package-state transaction; original configuration lock order retained.
use super::*;
use veyndo_app_storage::{activation as shared, installation::HookFuture};
pub(super) struct Host<'a> {
    pub tenant: &'a str,
    pub app: &'a str,
    pub actor: &'a RequestContext,
}
impl<'db> shared::StateHooks<'db> for Host<'_> {
    type Error = Error;
    fn prepare<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move { crate::marketing::lock_config(tx, self.tenant).await })
    }
    fn activating<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            let m = package_on(&mut **tx, self.tenant, self.app, false).await?;
            consent::actor_permissions(self.actor, &m)?;
            approval::installation(&m)?;
            distribution::dependencies(tx, self.tenant, &m).await?;
            commerce_hooks::admission(tx, self.tenant, &m).await?;
            native_lifecycle::admission(tx, self.tenant, &m).await
        })
    }
    fn deactivating<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            let used: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM hosted_frontends WHERE tenant=$1 AND app_id=$2)",
            )
            .bind(self.tenant)
            .bind(self.app)
            .fetch_one(&mut **tx)
            .await?;
            if used {
                return Err(conflict(
                    "App is required by connected frontends; disconnect them first",
                ));
            }
            Ok(())
        })
    }
}
pub(super) fn error(e: shared::ChangeError<Error>) -> Error {
    match e {
        shared::ChangeError::Database(e) => e.into(),
        shared::ChangeError::Invalid(s) => bad(s),
        shared::ChangeError::Conflict(s) => conflict(s),
        shared::ChangeError::Host(e) => e,
    }
}
