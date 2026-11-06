//! Native complete-package and bounded-guest adapters for the independent business contracts and executable examples.
use super::*;
#[cfg(test)]
use veyndo_app_model::business_snapshot as snapshot;
#[cfg(test)]
mod tests;
pub(crate) use veyndo_app_model::business_capability::Contract;
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::business_capability::validate(
        &veyndo_app_model::business_capability::Context {
            entities: &m.entities,
            commerce_hooks: m.commerce_hooks.as_ref(),
            capability: m.capability.as_ref(),
        },
        &field_values::Policy,
    )
    .map_err(model_contract::error)
}
pub(super) fn verify(m: &Manifest, guest: &Sandbox) -> Result<()> {
    veyndo_apps::business_examples::verify(m.capability.as_ref(), guest)
        .map_err(model_contract::error)
}
