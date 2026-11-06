//! Strict package contract; identifiers and limits are checked before logical model registration.
#[cfg(test)]
use super::*;
pub(crate) use veyndo_app_model::Action;
pub(crate) use veyndo_app_model::Entity;
#[cfg(test)]
pub(crate) use veyndo_app_model::Field;
pub(crate) use veyndo_app_model::configuration::Contract as ConfigurationContract;
pub(crate) use veyndo_app_model::manifest::Manifest;
pub(crate) use veyndo_app_model::surfaces::Surface;
pub(crate) fn identifier(s: &str) -> bool {
    veyndo_app_model::declarations::identifier(s)
}
#[cfg(test)]
mod tests {
    #[cfg(test)]
    use super::*;
    #[test]
    fn identifiers_cannot_inject_sql() {
        assert!(identifier("engraving"));
        for s in [
            include_str!("../../extensions/apps/marketplaces/manifest.json"),
            "x;drop",
            "tenant--",
            "1abc",
            "x.y",
            "é",
        ] {
            assert!(!identifier(s));
        }
    }
    #[test]
    fn order_configurations_are_never_public() {
        let mut m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/engraving/manifest.json"
        ))
        .unwrap();
        m.actions
            .iter_mut()
            .find(|a| a.handler == "configurations")
            .unwrap()
            .public = true;
        assert!(validate(&m).is_err());
    }
    #[test]
    fn executable_package_matches_app_source() {
        let m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/engraving/manifest.json"
        ))
        .unwrap();
        assert_eq!(
            m.configuration.unwrap().wasm_source,
            include_str!("../../extensions/apps/engraving/configuration.wat")
        );
    }
    #[test]
    fn additive_action_metadata_does_not_change_published_legacy_digests() {
        let m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/engraving/manifest.json"
        ))
        .unwrap();
        let value = json!(m);
        assert!(
            value["actions"]
                .as_array()
                .unwrap()
                .iter()
                .all(|a| a.get("readOnly").is_none()
                    && a.get("permission").is_none()
                    && a.get("outputSchema").is_none())
        );
    }
    #[test]
    fn built_in_packages_are_valid() {
        for s in [
            include_str!("../../extensions/apps/algolia/manifest.json"),
            include_str!("../../extensions/apps/care-studio/manifest.json"),
            include_str!("../../extensions/apps/catalog-export/manifest.json"),
            include_str!("../../extensions/apps/contentful/manifest.json"),
            include_str!("../../extensions/apps/edi/manifest.json"),
            include_str!("../../extensions/apps/email/manifest.json"),
            include_str!("../../extensions/apps/engraving/manifest.json"),
            include_str!("../../extensions/apps/erp-handoff/manifest.json"),
            include_str!("../../extensions/apps/furniture-configurator/manifest.json"),
            include_str!("../../extensions/apps/gift-message/manifest.json"),
            include_str!("../../extensions/apps/gmail/manifest.json"),
            include_str!("../../extensions/apps/google-analytics/manifest.json"),
            include_str!("../../extensions/apps/hubspot/manifest.json"),
            include_str!("../../extensions/apps/klaviyo/manifest.json"),
            include_str!("../../extensions/apps/marketplaces/manifest.json"),
            include_str!("../../extensions/apps/migration/manifest.json"),
            include_str!("../../extensions/apps/object-context/manifest.json"),
            include_str!("../../extensions/apps/ontology-care/manifest.json"),
            include_str!("../../extensions/apps/order-alerts/manifest.json"),
            include_str!("../../extensions/apps/packing-helper/manifest.json"),
            include_str!("../../extensions/apps/payment-provider/manifest.json"),
            include_str!("../../extensions/apps/paypal/manifest.json"),
            include_str!("../../extensions/apps/product-advisor/manifest.json"),
            include_str!("../../extensions/apps/product-lab/manifest.json"),
            include_str!("../../extensions/apps/production-review/manifest.json"),
            include_str!("../../extensions/apps/returns-workspace/manifest.json"),
            include_str!("../../extensions/apps/service-example/manifest.json"),
            include_str!("../../extensions/apps/shopware-payments/manifest.json"),
            include_str!("../../extensions/apps/site-builder/manifest.json"),
            include_str!("../../extensions/apps/site-forms/manifest.json"),
            include_str!("../../extensions/apps/slack/manifest.json"),
            include_str!("../../extensions/apps/snapshot-pricing/manifest.json"),
            include_str!("../../extensions/apps/storyfront/manifest.json"),
            include_str!("../../extensions/apps/vercel/manifest.json"),
        ] {
            validate(&serde_json::from_str(s).unwrap()).unwrap();
        }
    }
}
