//! Native field/content-language authority for shared bounded schema migration on the original installation transaction.
use super::*;
use veyndo_app_storage::schema_upgrade::{self as shared, UpgradeError, Validation};
struct Host<'a> {
    tenant: &'a str,
}
impl<'db> Validation<'db> for Host<'_> {
    type Error = Error;
    fn fields<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
        entity: &'a Entity,
        fields: &'a Value,
    ) -> veyndo_app_storage::installation::HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            data::fields(entity, fields)?;
            native_data::validate_languages(tx, self.tenant, entity, fields).await
        })
    }
}
pub(super) async fn upgrade(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant: &str,
    old: &Manifest,
    manifest: &Manifest,
) -> Result<()> {
    shared::upgrade(
        tx,
        veyndo_app_storage::Scope {
            tenant,
            app: &manifest.id,
        },
        old,
        manifest,
        &Host { tenant },
    )
    .await
    .map_err(|error| match error {
        UpgradeError::Database(error) => error.into(),
        UpgradeError::Model(error) => model_contract::error(error),
        UpgradeError::Invalid(message) => bad(message),
        UpgradeError::Conflict(message) => conflict(message),
        UpgradeError::Host(error) => error,
    })
}
