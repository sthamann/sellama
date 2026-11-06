//! Required current historical-read authority and actual native managed save for shared record restoration; no bypass of package/field/reference/CAS/history owners.
use super::*;
use veyndo_app_storage::{RecordKey, record_history as shared};
pub(super) struct Current<'a>(pub(super) &'a RequestContext);
impl shared::ReadAuthority for Current<'_> {
    fn allowed(&self, scope: &str) -> bool {
        auth::allowed(self.0, scope)
    }
}
pub(super) struct Restore<'a> {
    pub actor: &'a RequestContext,
    pub manifest: &'a Manifest,
    pub entity: &'a Entity,
    pub revision: &'a Value,
}
impl shared::ReadAuthority for Restore<'_> {
    fn allowed(&self, scope: &str) -> bool {
        auth::allowed(self.actor, scope)
    }
}
impl<'db> shared::RestoreHost<'db> for Restore<'_> {
    type Error = Error;
    fn save<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
        key: RecordKey<'a>,
        fields: &'a Value,
    ) -> shared::RestoreFuture<'a, Self::Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            data::save_tx(
                tx,
                key.scope.tenant,
                self.manifest,
                self.entity,
                &json!({"id":key.id,"revision":self.revision,"fields":fields}),
            )
            .await
        })
    }
}
pub(super) fn error(e: shared::RestoreError<Error>) -> Error {
    match e {
        shared::RestoreError::Database(e) => e.into(),
        shared::RestoreError::Unavailable => {
            Error(StatusCode::NOT_FOUND, "Record version unavailable".into())
        }
        shared::RestoreError::Forbidden => Error(
            StatusCode::FORBIDDEN,
            "Historical record requires its original read rights".into(),
        ),
        shared::RestoreError::Host(e) => e,
    }
}
