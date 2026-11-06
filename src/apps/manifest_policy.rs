//! Required native policy ports for the complete shared compiler; no package or request fields can select a weaker policy.
use super::*;
use veyndo_app_model as shared;
pub(super) struct Policy;
impl shared::fields::ValuePolicy for Policy {
    fn locale(&self, key: &str) -> bool {
        shared::fields::ValuePolicy::locale(&field_values::Policy, key)
    }
    fn money(&self, value: &Value) -> bool {
        shared::fields::ValuePolicy::money(&field_values::Policy, value)
    }
    fn richtext(&self, value: &Value) -> bool {
        shared::fields::ValuePolicy::richtext(&field_values::Policy, value)
    }
    fn relations(&self, value: &Value) -> bool {
        shared::fields::ValuePolicy::relations(&field_values::Policy, value)
    }
}
impl shared::declarations::ReferencePolicy for Policy {
    fn admitted(&self, product: bool, private: bool) -> bool {
        shared::declarations::ReferencePolicy::admitted(
            &editor_contract::ReferencePolicy,
            product,
            private,
        )
    }
}
impl shared::configuration::Policy for Policy {
    fn known_currency(&self, code: &str) -> bool {
        currencies::scale(code).is_some()
    }
}
impl shared::package::Policy for Policy {
    fn known_scope(&self, scope: &str) -> bool {
        auth::SCOPES.contains(&scope)
    }
    fn component_source(&self, source: &str) -> bool {
        Sandbox::component_source(source)
    }
}
impl shared::views::Policy for Policy {
    fn public_read(&self, writes: bool) -> bool {
        shared::views::Policy::public_read(&field_values::Policy, writes)
    }
}
impl shared::native_lifecycle::CompilerPolicy for Policy {
    fn scopes(&self) -> &[&str] {
        auth::SCOPES
    }
    fn locale(&self, key: &str) -> bool {
        commerce::valid_locale_key(key)
    }
    fn order_base(&self) -> shared::native_lifecycle::Machine {
        commerce::default_machine()
    }
}
impl shared::distribution::SignatureVerifier for Policy {
    type Error = Error;
    fn verify_signature(&self, m: &Manifest) -> Result<()> {
        shared::distribution::SignatureVerifier::verify_signature(
            &distribution::NativeVerifier(&crate::runtime_config::get().publishers),
            m,
        )
    }
}
impl shared::compiler::Policy for Policy {
    fn unsigned_namespace(&self, m: &Manifest) -> Result<()> {
        distribution::unsigned_namespace(m)
    }
    fn destination(&self, url: &str) -> Result<()> {
        event_contract::destination(url).map(|_| ())
    }
    fn readonly(&self, action: &Action) -> bool {
        surfaces::readonly(action)
    }
    fn now(&self) -> chrono::DateTime<chrono::Utc> {
        chrono::Utc::now()
    }
}
