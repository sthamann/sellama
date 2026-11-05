//! Native authenticated-current-rights adapter for the shared action and callback grant rules.
use super::*;
pub(super) struct Authority<'a> {
    pub app: &'a App,
    pub context: &'a RequestContext,
}
impl veyndo_app_model::admission::ScopeAuthority for Authority<'_> {
    type Error = Error;
    fn require_scope(&self, scope: &str) -> Result<()> {
        auth::permit(self.context, scope)
    }
}
impl veyndo_app_model::admission::Authority for Authority<'_> {
    fn require_merchant(&self) -> Result<()> {
        merchant(self.app, self.context).map(|_| ())
    }
}
pub(super) struct Current<'a>(pub &'a RequestContext);
impl veyndo_app_model::admission::ScopeAuthority for Current<'_> {
    type Error = Error;
    fn require_scope(&self, scope: &str) -> Result<()> {
        auth::permit(self.0, scope)
    }
}
pub(super) fn error(error: veyndo_app_model::admission::AdmissionError<Error>) -> Error {
    match error {
        veyndo_app_model::admission::AdmissionError::Authority(error) => error,
        veyndo_app_model::admission::AdmissionError::Model(error) => model_contract::error(error),
    }
}
pub(super) fn check(a: &App, h: &RequestContext, action: &Action, value: &Value) -> Result<()> {
    veyndo_app_model::admission::check(&Authority { app: a, context: h }, action, value)
        .map_err(error)
}
