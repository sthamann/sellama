//! Strict package contract; identifiers and limits are checked before logical model registration.
use super::*;
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Manifest {
    pub id: String,
    pub version: String,
    pub core_api: String,
    pub runtime: String,
    pub name: HashMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub distribution: Option<super::distribution::Distribution>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub presentation: Option<super::presentation::Presentation>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capability: Option<super::business_capability::Contract>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub lifecycles: Vec<super::native_lifecycle::Contract>,
    pub permissions: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub configuration: Option<ConfigurationContract>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub settings: Vec<super::settings::Setting>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub commerce_hooks: Option<super::commerce_hooks::Contract>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payment_provider: Option<crate::payments::ProviderContract>,
    #[serde(default)]
    pub entities: Vec<Entity>,
    #[serde(default)]
    pub slots: Vec<Slot>,
    #[serde(default)]
    pub actions: Vec<Action>,
    #[serde(default)]
    pub events: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub event_filters: Vec<event_contract::EventFilter>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub event_delivery: Option<event_contract::EventDelivery>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub surfaces: Vec<Surface>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub api_routes: Vec<ApiRoute>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub intelligence: Option<IntelligenceContract>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub views: Vec<super::native_views::NativeView>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub schedules: Vec<super::schedules::AppSchedule>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub schema_migrations: Vec<super::schema_changes::Migration>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub webhooks: Vec<super::webhooks::AppWebhook>,
}
pub(crate) use veyndo_app_model::Action;
pub(crate) use veyndo_app_model::Slot;
pub(crate) use veyndo_app_model::configuration::Contract as ConfigurationContract;
pub(crate) use veyndo_app_model::intelligence::Contract as IntelligenceContract;
pub(crate) use veyndo_app_model::surfaces::{ApiRoute, Surface};
pub(crate) use veyndo_app_model::{Entity, Field};
pub(crate) fn identifier(s: &str) -> bool {
    veyndo_app_model::declarations::identifier(s)
}
#[cfg(test)]
mod tests {
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
