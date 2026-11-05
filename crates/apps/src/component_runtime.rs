//! Native namespace/configuration adapter for the independent typed read-only commerce component runtime.
pub use veyndo_app_runtime::component_runtime::{
    AppRecord, CartItem, CartSnapshot, Kind, Money, Outcome, ProductSnapshot, Snapshot,
};
pub struct Module(veyndo_app_runtime::component_runtime::Module);
impl Module {
    pub fn new(source: &str) -> Result<Self, String> {
        veyndo_app_runtime::component_runtime::Module::new(
            source,
            &crate::sandbox::NativePolicy,
            &std::env::var("COMPONENT_LEGACY_NAMESPACES").unwrap_or_default(),
        )
        .map(Self)
    }
}
impl std::ops::Deref for Module {
    type Target = veyndo_app_runtime::component_runtime::Module;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn operator_namespace_configuration_reaches_the_shared_executor() {
        let source = include_str!("../../../extensions/sdk/wit/snapshot-price.component.wat")
            .replace("veyndo:commerce", "legacy:commerce");
        let configured = std::env::var("COMPONENT_LEGACY_NAMESPACES").unwrap_or_default();
        let enabled = configured.split(',').any(|n| n.trim() == "legacy");
        assert_eq!(Module::new(&source).is_ok(), enabled);
        assert_eq!(crate::sandbox::Sandbox::new(&source).is_ok(), enabled);
    }
}
