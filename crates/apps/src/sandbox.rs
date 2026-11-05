//! Native verified resource admission adapter for the independent bounded Wasm/WIT executor.
use veyndo_app_runtime::policy::{ResourcePolicy, Resources};
pub(crate) struct NativePolicy;
impl ResourcePolicy for NativePolicy {
    fn admitted(&self, r: Resources) -> bool {
        crate::verified_kernel::wasm_resources_admissible(r.tables, r.memories, r.elements, r.pages)
    }
}
pub struct Sandbox(veyndo_app_runtime::sandbox::Sandbox);
impl Sandbox {
    pub fn new(source: &str) -> Result<Self, String> {
        veyndo_app_runtime::sandbox::Sandbox::new(
            source,
            &NativePolicy,
            &std::env::var("COMPONENT_LEGACY_NAMESPACES").unwrap_or_default(),
        )
        .map(Self)
    }
    pub fn component_source(source: &str) -> bool {
        veyndo_app_runtime::sandbox::Sandbox::component_source(source)
    }
}
impl std::ops::Deref for Sandbox {
    type Target = veyndo_app_runtime::sandbox::Sandbox;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn resource_adapter_uses_the_canonical_verified_predicate() {
        for r in [
            Resources {
                tables: 1,
                memories: 1,
                elements: 10000,
                pages: 16,
            },
            Resources {
                tables: 2,
                memories: 1,
                elements: 0,
                pages: 0,
            },
            Resources {
                tables: 0,
                memories: 2,
                elements: 0,
                pages: 0,
            },
            Resources {
                tables: 0,
                memories: 0,
                elements: 10001,
                pages: 0,
            },
            Resources {
                tables: 0,
                memories: 0,
                elements: 0,
                pages: 17,
            },
        ] {
            assert_eq!(
                NativePolicy.admitted(r),
                crate::verified_kernel::wasm_resources_admissible(
                    r.tables, r.memories, r.elements, r.pages
                )
            );
        }
        assert!(Sandbox::new("(module (table 10001 funcref))").is_err());
        assert!(Sandbox::new("(module (memory 32))").is_err());
        let guest = Sandbox::new(include_str!("../../../extensions/company-limit.wat")).unwrap();
        assert!(guest.approve(100, 200).unwrap());
        assert!(!guest.approve(201, 200).unwrap());
    }
}
