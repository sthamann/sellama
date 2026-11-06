//! Adapt shared graph compilation to the complete native package digest, current scope catalogue and native order base.
use super::*;
pub(crate) use shared::quote_machine;
use veyndo_app_model::native_lifecycle as shared;
pub(super) struct HostPolicy;
impl shared::CompilerPolicy for HostPolicy {
    fn scopes(&self) -> &[&str] {
        auth::SCOPES
    }
    fn locale(&self, key: &str) -> bool {
        commerce::valid_locale_key(key)
    }
    fn order_base(&self) -> shared::Machine {
        commerce::default_machine()
    }
}
pub(super) fn package<'a>(m: &'a Manifest, digest: &'a str) -> shared::Package<'a> {
    shared::Package {
        id: &m.id,
        version: &m.version,
        digest,
        permissions: &m.permissions,
        lifecycles: &m.lifecycles,
    }
}
pub(crate) fn generation_context() -> Value {
    shared::generation_context(&HostPolicy)
}
pub(crate) fn compile(
    base: commerce::OrderMachine,
    apps: &[Manifest],
    object: &str,
) -> Result<commerce::OrderMachine> {
    let digests: Vec<_> = apps.iter().map(approval::canonical_digest).collect();
    let packages: Vec<_> = apps
        .iter()
        .zip(&digests)
        .map(|(m, d)| package(m, d))
        .collect();
    shared::compile(base, &packages, object, &HostPolicy).map_err(model_contract::error)
}
