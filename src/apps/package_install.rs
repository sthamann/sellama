//! Required native installation hooks preserve compiler/trust, commerce, schema, default-record and schedule admission in the shared transaction.
use super::*;
use veyndo_app_storage::installation::{HookFuture, InstallError, InstallHooks};
pub(super) struct Host<'a> {
    pub tenant: &'a str,
    pub manifest: &'a Manifest,
}
impl<'db> InstallHooks<'db> for Host<'_> {
    type Error = Error;
    fn prepare<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            let (t, m) = (self.tenant, self.manifest);
            sqlx::query("SELECT set_config('rac.tenant',$1,true)")
                .bind(t)
                .execute(&mut **tx)
                .await?;
            validate(m)?;
            approval::installation(m)?;
            commerce_hooks::verify_package(m).await?;
            crate::marketing::lock_config(tx, t).await?;
            crate::marketing::validate_app_replacement(tx, t, m).await?;
            crate::payments::install_methods(tx, t, m).await?;
            if let Some(c) = &m.configuration {
                let entity = m.entities.iter().find(|e| e.name == c.entity).unwrap();
                data::fields(entity, &c.default_fields)?;
                let fee = c.default_fields[&c.price_field]
                    .as_i64()
                    .ok_or(bad("Default price required"))?;
                runtime::validate_fee(c, fee).await?;
            }
            Ok(())
        })
    }
    fn admit<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            distribution::dependencies(tx, self.tenant, self.manifest).await?;
            commerce_hooks::admission(tx, self.tenant, self.manifest).await?;
            native_lifecycle::admission(tx, self.tenant, self.manifest).await
        })
    }
    fn upgrade<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
        previous: &'a Value,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            let old: Manifest = serde_json::from_value(previous.clone())
                .map_err(|_| bad("Invalid prior package"))?;
            let version = |s: &str| {
                s.split('.')
                    .map(|v| v.parse::<u32>().unwrap_or(0))
                    .collect::<Vec<_>>()
            };
            if version(&self.manifest.version) < version(&old.version) {
                return Err(conflict(
                    "Downgrade requires an explicit compatible migration",
                ));
            }
            schema_upgrade::upgrade(tx, self.tenant, &old, self.manifest).await
        })
    }
    fn attach<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            storage::attach(tx, self.tenant, self.manifest).await?;
            records::install(tx, self.tenant, self.manifest).await
        })
    }
    fn finish<'a>(
        &'a self,
        tx: &'a mut sqlx::Transaction<'db, sqlx::Postgres>,
    ) -> HookFuture<'a, Error>
    where
        'db: 'a,
    {
        Box::pin(async move {
            let (t, m) = (self.tenant, self.manifest);
            if let Some(c) = &m.configuration {
                let exists = records::get(tx, t, &m.id, &c.entity, &c.record, false)
                    .await?
                    .is_some();
                if !exists {
                    let entity = m.entities.iter().find(|e| e.name == c.entity).unwrap();
                    data::save_tx(
                        tx,
                        t,
                        m,
                        entity,
                        &json!({"id":c.record,"fields":c.default_fields}),
                    )
                    .await?;
                }
            }
            schedules::sync(tx, t, m).await
        })
    }
}
pub(super) fn error(error: InstallError<Error>) -> Error {
    match error {
        InstallError::Database(error) => error.into(),
        InstallError::Invalid(message) => bad(message),
        InstallError::Conflict(message) => conflict(message),
        InstallError::Hook(error) => error,
    }
}
