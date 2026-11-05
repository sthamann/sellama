//! Editor mounts, enumerated fields and tenant-owned core references; no app alters core tables.
use super::*;
pub(super) fn validate_fields(e: &Entity) -> Result<()> {
    veyndo_app_model::declarations::validate_fields(e, &ReferencePolicy)
        .map_err(model_contract::error)
}
pub(super) struct ReferencePolicy;
impl veyndo_app_model::declarations::ReferencePolicy for ReferencePolicy {
    fn admitted(&self, product: bool, private: bool) -> bool {
        verified_kernel::app_core_reference_admissible(product, private)
    }
}
/// The generic entity endpoint cannot bypass stricter action permissions.
pub(crate) fn entity_access(
    m: &Manifest,
    e: &Entity,
    h: &RequestContext,
    handler: &str,
) -> Result<()> {
    core_extensions::access(e, h, handler == "save")?;
    if handler == "save"
        && m.actions
            .iter()
            .any(|a| a.handler == "submit" && a.entity.as_deref() == Some(e.name.as_str()))
    {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "Append-only form inbox cannot be edited or restored".into(),
        ));
    }
    for action in m
        .actions
        .iter()
        .filter(|a| a.entity.as_deref() == Some(e.name.as_str()) && a.handler == handler)
    {
        gateway::additional_permissions(h, action)?;
        if let Some(scope) = action.permission.as_deref() {
            auth::permit(h, scope)?;
        }
    }
    Ok(())
}
pub(super) async fn validate_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    t: &str,
    e: &Entity,
    fields: &Value,
) -> Result<()> {
    for f in &e.fields {
        let Some(kind) = f.core_reference.as_deref() else {
            continue;
        };
        let Some(id) = fields[&f.name].as_str() else {
            continue;
        };
        let query = match kind {
            "product" => "SELECT EXISTS(SELECT 1 FROM products WHERE tenant=$1 AND id=$2)",
            "customer" => "SELECT EXISTS(SELECT 1 FROM customers WHERE tenant=$1 AND id=$2)",
            "salesChannel" => {
                "SELECT EXISTS(SELECT 1 FROM sales_channels WHERE tenant=$1 AND id=$2)"
            }
            "order" => "SELECT EXISTS(SELECT 1 FROM orders WHERE tenant=$1 AND id=$2)",
            "b2bCompany" => "SELECT EXISTS(SELECT 1 FROM b2b_companies WHERE tenant=$1 AND id=$2)",
            "b2bUnit" => "SELECT EXISTS(SELECT 1 FROM b2b_units WHERE tenant=$1 AND id=$2)",
            _ => return Err(bad("Unknown core reference")),
        };
        let owned: bool = sqlx::query_scalar(query)
            .bind(t)
            .bind(id)
            .fetch_one(&mut **tx)
            .await?;
        if !owned {
            return Err(bad("Referenced core object does not belong to this shop"));
        }
    }
    Ok(())
}
