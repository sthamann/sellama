//! Shared managed app records: typed writes, optimistic revisions, bounded reads and local RLS context.
use super::*;
pub(crate) fn fields(e: &Entity, v: &Value) -> Result<()> {
    field_values::validate(e, v)
}
/// Keyset pages and indexed equality filters never hydrate an app's entire table.
pub(crate) async fn list_page(
    a: &App,
    t: &str,
    m: &Manifest,
    e: &Entity,
    input: &Value,
) -> Result<Value> {
    list_scoped(a, t, m, e, input, None).await
}
pub(super) async fn list_scoped(
    a: &App,
    t: &str,
    m: &Manifest,
    e: &Entity,
    input: &Value,
    public_channel: Option<&str>,
) -> Result<Value> {
    if !m.permissions.contains(&"data.read".into()) {
        return Err(Error(StatusCode::FORBIDDEN, "App needs data.read".into()));
    }
    let limit = input["limit"].as_i64().unwrap_or(100);
    if !(1..=100).contains(&limit) {
        return Err(bad("App page limit must be 1..100"));
    }
    let after = input["after"].as_str().unwrap_or("");
    if after.len() > 100 {
        return Err(bad("App cursor exceeds limit"));
    }
    let id = input
        .get("id")
        .map(|id| {
            id.as_str()
                .filter(|s| !s.is_empty() && s.len() <= 100)
                .ok_or(bad("Invalid app record ID"))
        })
        .transpose()?;
    let mut filters = Vec::new();
    if let Some(filter) = input.get("filter") {
        let filter = filter
            .as_object()
            .ok_or(bad("App filter must be an object"))?;
        if filter.len() > 4 {
            return Err(bad("App filter exceeds limit"));
        }
        for (name, value) in filter {
            let f = e
                .fields
                .iter()
                .find(|f| f.name == *name && f.indexed && !f.translatable)
                .ok_or(bad("Filter requires an indexed field"))?;
            let valid = match f.kind.as_str() {
                "string" => value.as_str().is_some_and(|v| v.len() <= 2000),
                "integer" => value.as_i64().is_some(),
                "boolean" => value.is_boolean(),
                _ => false,
            };
            if !valid {
                return Err(bad("Invalid indexed app filter"));
            }
            filters.push(veyndo_app_storage::queries::Filter {
                field: &f.name,
                value,
            });
        }
    }
    let mut tx = a.db.begin().await?;
    sqlx::query("SELECT set_config('rac.tenant',$1,true)")
        .bind(t)
        .execute(&mut *tx)
        .await?;
    let publication = public_channel.and_then(|channel| {
        e.publication
            .as_ref()
            .map(|p| veyndo_app_storage::queries::Window {
                status_field: &p.status_field,
                channel_field: &p.channel_field,
                starts_at: &p.starts_at,
                channel,
            })
    });
    let page = veyndo_app_storage::queries::list(
        &mut tx,
        veyndo_app_storage::Scope {
            tenant: t,
            app: &m.id,
        },
        &e.name,
        &veyndo_app_storage::queries::Query {
            limit,
            after,
            id,
            filters: &filters,
            publication,
        },
    )
    .await
    .map_err(persistence::error)?;
    tx.commit().await?;
    let has_more = page.has_more;
    let elements = page
        .rows
        .iter()
        .map(|row| records::project(e, row))
        .collect::<Vec<_>>();
    let next = page.next_cursor;
    let mut result =
        json!({"elements":elements,"limit":limit,"hasMore":has_more,"nextCursor":next});
    if let Some(graph) = ontology::project(t, m, e, &result["elements"]) {
        result["ontology"] = graph;
    }
    Ok(result)
}
/// A proposal binds one indexed record, including records beyond the first page.
pub(crate) async fn record_revision(
    a: &App,
    t: &str,
    m: &Manifest,
    e: &Entity,
    id: &str,
) -> Result<i64> {
    if !m.permissions.contains(&"data.read".into()) {
        return Err(Error(StatusCode::FORBIDDEN, "App needs data.read".into()));
    }
    let mut tx = a.db.begin().await?;
    sqlx::query("SELECT set_config('rac.tenant',$1,true)")
        .bind(t)
        .execute(&mut *tx)
        .await?;
    let revision = records::get(&mut tx, t, &m.id, &e.name, id, false)
        .await?
        .and_then(|row| row["revision"].as_i64());
    tx.commit().await?;
    Ok(revision.unwrap_or(0))
}
pub(crate) async fn save(
    a: &App,
    t: &str,
    m: &Manifest,
    e: &Entity,
    v: &Value,
    h: &RequestContext,
) -> Result<Value> {
    core_extensions::access(e, h, true)?;
    let mut tx = a.db.begin().await?;
    history::context(&mut tx, h, "app.save").await?;
    let result = save_tx(&mut tx, t, m, e, v).await?;
    tx.commit().await?;
    Ok(result)
}
pub(crate) async fn save_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
    e: &Entity,
    v: &Value,
) -> Result<Value> {
    write_tx(tx, t, m, e, v, false).await
}
/// Replayable native imports preserve the ordinary package -> route -> record lock order and all field validators.
pub(crate) async fn import_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
    e: &Entity,
    v: &Value,
) -> Result<Value> {
    write_tx(tx, t, m, e, v, true).await
}
async fn write_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    m: &Manifest,
    e: &Entity,
    v: &Value,
    replay: bool,
) -> Result<Value> {
    if !m.permissions.contains(&"data.write".into()) {
        return Err(Error(StatusCode::FORBIDDEN, "App needs data.write".into()));
    }
    super::lock_package_write(tx, t, m).await?;
    let normalized = normalize_input(m, v)?;
    let v = &normalized;
    fields(e, &v["fields"])?;
    if m.id == "site_builder" {
        site_builder::validate(&e.name, &v["fields"])?;
        site_builder::validate_owned(tx, t, &v["fields"], v["id"].as_str().unwrap_or("")).await?;
    }
    super::editor_contract::validate_references(tx, t, e, &v["fields"]).await?;
    field_values::references(tx, t, e, &v["fields"]).await?;
    if e.fields
        .iter()
        .any(|f| f.translatable || f.kind == "richtext")
    {
        super::native_data::validate_languages(tx, t, e, &v["fields"]).await?;
    }
    if let Some(c) = &m.configuration
        && c.entity == e.name
        && let Some(fee) = v["fields"][&c.price_field].as_i64()
    {
        runtime::validate_fee(c, fee).await?;
    }

    let id = v["id"]
        .as_str()
        .filter(|s| !s.is_empty() && s.len() <= 100)
        .ok_or(bad("Record id required"))?;
    sqlx::query("SELECT set_config('rac.tenant',$1,true)")
        .bind(t)
        .execute(&mut **tx)
        .await?;
    record_write::apply(tx, t, m, e, id, v, replay).await
}
/// Every generic import and ordinary save uses the same app-owned normalization.
pub(crate) fn normalize_input(m: &Manifest, v: &Value) -> Result<Value> {
    if m.id == "site_builder" {
        Ok(
            json!({"id":v["id"],"revision":v["revision"],"fields":site_builder::normalize(&v["fields"])?}),
        )
    } else {
        Ok(v.clone())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fields_reject_type_and_unknown_properties() {
        let e = Entity {
            operational: None,
            extends: None,
            name: "config".into(),
            label: HashMap::new(),
            public_read: false,
            publication: None,
            workflow: None,
            fields: vec![Field {
                name: "fee".into(),
                translatable: false,
                label: HashMap::new(),
                kind: "integer".into(),
                required: true,
                indexed: false,
                references: None,
                core_reference: None,
                choices: vec![],
                unique: false,
                validation: None,
            }],
        };
        assert!(fields(&e, &json!({"fee":200})).is_ok());
        assert!(fields(&e, &json!({"fee":"200"})).is_err());
        assert!(fields(&e, &json!({"fee":200,"tenant":"other"})).is_err());
    }
}
