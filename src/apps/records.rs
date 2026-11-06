//! One fixed PostgreSQL record store; every operation retains tenant/app/model identity and original wire values.
use super::*;
pub(crate) fn key<'a>(
    t: &'a str,
    app: &'a str,
    entity: &'a str,
    id: &'a str,
) -> veyndo_app_storage::RecordKey<'a> {
    veyndo_app_storage::RecordKey {
        scope: veyndo_app_storage::Scope { tenant: t, app },
        entity,
        id,
    }
}
pub(crate) fn lock_key(t: &str, app: &str, entity: &str, id: &str) -> String {
    veyndo_app_storage::records::lock_key(key(t, app, entity, id))
}
pub(crate) fn project(e: &Entity, row: &Value) -> Value {
    let mut out = serde_json::Map::new();
    out.insert("id".into(), row["id"].clone());
    out.insert("revision".into(), row["revision"].clone());
    for f in &e.fields {
        out.insert(f.name.clone(), row[&f.name].clone());
    }
    Value::Object(out)
}
pub(crate) async fn get(
    tx: &mut sqlx::PgConnection,
    t: &str,
    app: &str,
    entity: &str,
    id: &str,
    write: bool,
) -> Result<Option<Value>> {
    Ok(veyndo_app_storage::records::get(tx, key(t, app, entity, id), write).await?)
}

pub(crate) async fn rows(
    tx: &mut sqlx::PgConnection,
    t: &str,
    app: &str,
    e: &Entity,
    limit: i64,
) -> Result<Vec<Value>> {
    let rows = veyndo_app_storage::records::rows(
        tx,
        veyndo_app_storage::Scope { tenant: t, app },
        &e.name,
        limit,
    )
    .await?;
    Ok(rows.iter().map(|row| project(e, row)).collect())
}

pub(super) async fn define(
    tx: &mut sqlx::PgConnection,
    t: &str,
    app: &str,
    version: &str,
    e: &Entity,
) -> Result<()> {
    Ok(veyndo_app_storage::records::define(
        tx,
        veyndo_app_storage::Scope { tenant: t, app },
        version,
        &e.name,
        &json!(e),
    )
    .await?)
}

pub(super) async fn install(tx: &mut sqlx::PgConnection, t: &str, m: &Manifest) -> Result<()> {
    for e in &m.entities {
        let old: Option<Value> = sqlx::query_scalar(
            "SELECT definition FROM app_models WHERE tenant=$1 AND app=$2 AND entity=$3",
        )
        .bind(t)
        .bind(&m.id)
        .bind(&e.name)
        .fetch_optional(&mut *tx)
        .await?;
        if let Some(old) = &old {
            let previous: Entity =
                serde_json::from_value(old.clone()).map_err(|_| bad("Invalid prior app model"))?;
            core_extensions::compatible(&previous, e)?;
            if e.fields
                .iter()
                .any(|f| f.required && !previous.fields.iter().any(|p| p.name == f.name))
            {
                return Err(conflict(
                    "New required field needs a data migration; add it nullable first",
                ));
            }
        }
        define(tx, t, &m.id, &m.version, e).await?;
        if old.is_some_and(|old| old != json!(e)) {
            // Rebuild bounded fixed projections when field contracts change, never CREATE INDEX/TABLE.
            sqlx::query(
                "UPDATE app_records SET fields=fields WHERE tenant=$1 AND app=$2 AND entity=$3",
            )
            .bind(t)
            .bind(&m.id)
            .bind(&e.name)
            .execute(&mut *tx)
            .await?;
        }
    }
    Ok(())
}
pub(crate) async fn reset_preview(tx: &mut sqlx::PgConnection, t: &str, app: &str) -> Result<()> {
    Ok(
        veyndo_app_storage::records::reset_preview(
            tx,
            veyndo_app_storage::Scope { tenant: t, app },
        )
        .await?,
    )
}
