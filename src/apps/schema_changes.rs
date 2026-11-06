//! Native error and Manifest adapters for the shared pure evolution planner; transactional execution uses shared schema_upgrade through required native validation.
use super::*;
pub(crate) use veyndo_app_model::evolution::Migration;
pub(super) fn shape(
    old: &Manifest,
    next: &Manifest,
    path: Option<&Migration>,
) -> Result<Vec<Entity>> {
    veyndo_app_model::evolution::shape(&old.entities, &next.entities, path)
        .map_err(model_contract::error)
}
