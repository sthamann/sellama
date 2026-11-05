//! Native adapter for shared view contracts; actual grants, runtime execution and current rights remain native.
use super::*;
pub(crate) use veyndo_app_model::views::NativeView;
fn contract(m: &Manifest) -> veyndo_app_model::views::Contract<'_> {
    veyndo_app_model::views::Contract {
        entities: &m.entities,
        actions: &m.actions,
        surfaces: &m.surfaces,
        views: &m.views,
    }
}
impl veyndo_app_model::views::Policy for field_values::Policy {
    fn public_read(&self, writes: bool) -> bool {
        verified_kernel::app_read_admissible(true, writes)
    }
}
pub(super) fn is_native(m: &Manifest, s: &Surface) -> bool {
    veyndo_app_model::views::is_native(&contract(m), s)
}
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::views::validate(&contract(m), &field_values::Policy)
        .map_err(model_contract::error)
}
pub(super) fn payload(m: &Manifest, s: &Surface) -> Option<Value> {
    veyndo_app_model::views::payload(&contract(m), s)
}
