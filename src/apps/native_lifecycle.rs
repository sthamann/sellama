//! Versioned declarative native lifecycles; packages narrow native admission and never execute effects.
use super::*;
mod compile;
mod storage;
pub(crate) use compile::{compile, generation_context, quote_machine};
pub(crate) use storage::{
    admission, bind_order, capture, current_order, order_machine, project_labels, snapshot,
    state_labels, validate_active_locale, validate_order_base,
};
#[cfg(test)]
use veyndo_app_model::native_lifecycle::fact_value;
pub(crate) use veyndo_app_model::native_lifecycle::{Contract, Snapshot};
pub(super) fn validate(m: &Manifest) -> Result<()> {
    let digest = approval::canonical_digest(m);
    veyndo_app_model::native_lifecycle::validate(
        &compile::package(m, &digest),
        &compile::HostPolicy,
    )
    .map_err(model_contract::error)
}
pub(crate) fn validate_locale(m: &Manifest, main: &str) -> Result<()> {
    let digest = approval::canonical_digest(m);
    veyndo_app_model::native_lifecycle::validate_locale(&compile::package(m, &digest), main)
        .map_err(model_contract::error)
}
pub(crate) fn reason(
    h: &RequestContext,
    edge: &commerce::MachineEdge,
    data: &Value,
) -> Option<&'static str> {
    veyndo_app_model::native_lifecycle::reason(edge, data, |p| auth::permit(h, p).is_ok())
}
pub(crate) fn allowed(native: bool, rights: bool, guards: bool) -> bool {
    verified_kernel::native_lifecycle_admissible(native, rights, guards)
}

#[cfg(test)]
mod tests;
