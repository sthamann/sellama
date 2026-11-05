//! Native lifecycle/history hooks around the shared record mutation engine; package and typed field validation stay in data.rs.
use super::*;
use veyndo_app_storage::mutations::{Mutation, WriteError, WriteHooks};
struct NativeHooks<'a> {
    tenant: &'a str,
    manifest: &'a Manifest,
    entity: &'a Entity,
    id: &'a str,
}
impl WriteHooks for NativeHooks<'_> {
    type Error = Error;
    async fn before(
        &self,
        tx: &mut sqlx::PgConnection,
        old: Option<&Value>,
        fields: &Value,
        revision: i64,
    ) -> Result<()> {
        record_lifecycle::change(self.entity, old, fields)?;
        if let Some(old) = old {
            let prior: Value = self
                .entity
                .fields
                .iter()
                .map(|f| (f.name.clone(), old[&f.name].clone()))
                .collect();
            record_history::capture(
                tx,
                self.tenant,
                self.manifest,
                self.entity,
                self.id,
                revision,
                &prior,
            )
            .await?;
        }
        Ok(())
    }
    async fn after(
        &self,
        tx: &mut sqlx::PgConnection,
        fields: &Value,
        revision: i64,
    ) -> Result<()> {
        record_history::capture(
            tx,
            self.tenant,
            self.manifest,
            self.entity,
            self.id,
            revision,
            fields,
        )
        .await
    }
}
pub(super) async fn apply(
    tx: &mut sqlx::PgConnection,
    t: &str,
    m: &Manifest,
    e: &Entity,
    id: &str,
    value: &Value,
    replay: bool,
) -> Result<Value> {
    let names = e.fields.iter().map(|f| f.name.as_str()).collect::<Vec<_>>();
    let mutation = Mutation {
        key: records::key(t, &m.id, &e.name, id),
        expected_revision: value["revision"].as_i64().unwrap_or(0),
        fields: &value["fields"],
        declared_fields: &names,
        replay,
    };
    veyndo_app_storage::mutations::write(
        tx,
        &mutation,
        &NativeHooks {
            tenant: t,
            manifest: m,
            entity: e,
            id,
        },
    )
    .await
    .map_err(|error| match error {
        WriteError::Database(error) => error.into(),
        WriteError::Revision(current) => Error::revision(current, "App record revision changed"),
        WriteError::Conflict(message) => conflict(message),
        WriteError::Invalid(message) => bad(message),
        WriteError::Hook(error) => error,
    })
}
