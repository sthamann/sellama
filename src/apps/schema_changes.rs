//! Native error and Manifest adapters for the shared pure evolution planner; transactional execution remains in schema_upgrade.
use super::*;
pub(crate) use veyndo_app_model::evolution::{Migration, Step};
pub(super) fn convert(value: &Value, field: &Field) -> Result<Value> {
    veyndo_app_model::evolution::convert(value, field).map_err(model_contract::error)
}
pub(super) fn shape(
    old: &Manifest,
    next: &Manifest,
    path: Option<&Migration>,
) -> Result<Vec<Entity>> {
    veyndo_app_model::evolution::shape(&old.entities, &next.entities, path)
        .map_err(model_contract::error)
}
