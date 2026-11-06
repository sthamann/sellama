//! Native current environment/package/actor admission for shared immutable build staging; original privileged transaction and installer remain authoritative.
use super::*;
use veyndo_app_storage::build_versions as shared;
pub(super) struct Admission<'a> {
    pub live: &'a str,
    pub actor: &'a RequestContext,
}
impl<'db> shared::StageAdmission<'db> for Admission<'_> {
    type Error = Error;
    fn install<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
        environment: &'a str,
        manifest: &'a Value,
    ) -> shared::StageFuture<'a, Self::Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            staging::owned_on(&mut **tx, self.live, environment).await?;
            let m: apps::Manifest =
                serde_json::from_value(manifest.clone()).map_err(|_| bad("Invalid app"))?;
            builds::validate(&m)?;
            apps::actor_permissions(self.actor, &m)?;
            apps::install_tx(tx, environment, m).await
        })
    }
}
pub(super) fn error(e: veyndo_app_storage::Error) -> Error {
    match e {
        veyndo_app_storage::Error::Database(e) => e.into(),
        veyndo_app_storage::Error::Invalid(s) => bad(s),
        veyndo_app_storage::Error::Conflict(s) => conflict(s),
        veyndo_app_storage::Error::Quota(s) => Error(StatusCode::TOO_MANY_REQUESTS, s.into()),
    }
}
pub(super) fn stage_error(e: shared::StageError<Error>) -> Error {
    match e {
        shared::StageError::Database(e) => e.into(),
        shared::StageError::Unavailable => Error(StatusCode::NOT_FOUND, "Build unavailable".into()),
        shared::StageError::Conflict(s) => conflict(s),
        shared::StageError::Host(e) => e,
    }
}
