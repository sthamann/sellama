//! Adapt the shared provider declaration grammar; native payment authority and actual effects remain attached.
#[cfg(test)]
use crate::{Result, apps};
pub(crate) use veyndo_app_model::payment_provider::ProviderMethod;
#[cfg(test)]
pub(crate) fn validate_contract(m: &apps::Manifest) -> Result<()> {
    veyndo_app_model::payment_provider::validate_contract(m).map_err(apps::model_contract::error)
}
#[cfg(test)]
mod tests {
    use super::*;

    fn manifest() -> apps::Manifest {
        serde_json::from_str(include_str!(
            "../../extensions/apps/payment-provider/manifest.json"
        ))
        .unwrap()
    }
    #[test]
    fn multiple_capture_requires_its_operational_dependencies() {
        let mut m = manifest();
        m.payment_provider.as_mut().unwrap().methods[0]
            .capabilities
            .push("multi_capture".into());
        assert!(validate_contract(&m).is_ok());
        for required in ["capture", "authorize", "void"] {
            let mut missing = m.clone();
            missing.payment_provider.as_mut().unwrap().methods[0]
                .capabilities
                .retain(|c| c != required);
            assert!(validate_contract(&missing).is_err());
        }
    }
    #[test]
    fn reserved_identity_and_invalid_capability_contracts_are_rejected() {
        let base = manifest();
        assert!(validate_contract(&base).is_ok());
        for id in ["paypal", "manual", "simulated"] {
            let mut m = base.clone();
            m.id = id.into();
            assert!(validate_contract(&m).is_err());
        }
        let mut m = base.clone();
        let duplicate = m.payment_provider.as_ref().unwrap().methods[0].clone();
        m.payment_provider.as_mut().unwrap().methods.push(duplicate);
        assert!(validate_contract(&m).is_err());
        let mut m = base.clone();
        m.payment_provider.as_mut().unwrap().methods[0].capabilities = vec!["refund".into()];
        assert!(validate_contract(&m).is_err());
        let mut m = base;
        m.runtime = "declarative".into();
        assert!(validate_contract(&m).is_err());
    }
}
