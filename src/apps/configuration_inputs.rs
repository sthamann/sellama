//! Native policy adapter for shared configuration grammar, library selection and exact guest arguments.
use super::*;
impl veyndo_app_model::declarations::ReferencePolicy for field_values::Policy {
    fn admitted(&self, product: bool, private: bool) -> bool {
        veyndo_app_model::declarations::ReferencePolicy::admitted(
            &editor_contract::ReferencePolicy,
            product,
            private,
        )
    }
}
impl veyndo_app_model::configuration::Policy for field_values::Policy {
    fn known_currency(&self, code: &str) -> bool {
        currencies::scale(code).is_some()
    }
}
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::configuration::validate(
        &veyndo_app_model::configuration::Context {
            entities: &m.entities,
            actions: &m.actions,
            configuration: m.configuration.as_ref(),
        },
        &field_values::Policy,
    )
    .map_err(model_contract::error)
}
pub(super) fn record<'a>(c: &'a ConfigurationContract, fields: &'a Value) -> Result<&'a str> {
    veyndo_app_model::configuration::record(c, fields, &field_values::Policy)
        .map_err(model_contract::error)
}
pub(super) fn arguments(c: &ConfigurationContract, fields: &Value) -> Result<Vec<i64>> {
    veyndo_app_model::configuration::arguments(c, fields, &field_values::Policy)
        .map_err(model_contract::error)
}
#[cfg(test)]
mod tests {
    use super::*;
    fn package() -> Manifest {
        serde_json::from_str(include_str!(
            "../../extensions/apps/furniture-configurator/manifest.json"
        ))
        .unwrap()
    }
    #[test]
    fn library_and_dimensions_share_real_field_validation_and_legacy_digests() {
        let m = package();
        super::super::validate(&m).unwrap();
        let c = m.configuration.unwrap();
        let fields = json!({"material":"oak","width_cm":260,"depth_cm":80});
        assert_eq!(arguments(&c, &fields).unwrap(), vec![260, 80]);
        assert_eq!(record(&c, &fields).unwrap(), "oak");
        let guest = Sandbox::new(&c.wasm_source).unwrap();
        assert_eq!(
            guest
                .contribution_args(0, &arguments(&c, &fields).unwrap())
                .unwrap(),
            4800
        );
        assert_eq!(guest.contribution_args(2000, &[240, 80]).unwrap(), 2000);
        for invalid in [
            json!({"material":"oak","width_cm":401,"depth_cm":80}),
            json!({"material":"oak","width_cm":"260","depth_cm":80}),
            json!({"material":"oak","width_cm":260,"depth_cm":80,"price":0}),
            json!({"material":"oak","width_cm":260}),
        ] {
            assert!(arguments(&c, &invalid).is_err());
        }
        let legacy: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/gift-message/manifest.json"
        ))
        .unwrap();
        assert!(json!(legacy)["configuration"].get("inputs").is_none());
        assert!(json!(legacy)["configuration"].get("currency").is_none());
        assert_eq!(
            arguments(
                legacy.configuration.as_ref().unwrap(),
                &json!({"message":"Hello"})
            )
            .unwrap(),
            vec![5]
        );
    }
    #[test]
    fn structured_contract_cannot_select_private_data_or_undeclared_arguments() {
        let mut omitted = json!(package());
        omitted["configuration"]["inputs"]["examples"][0]
            .as_object_mut()
            .unwrap()
            .remove("expectedFeeMinor");
        assert!(serde_json::from_value::<Manifest>(omitted).is_err());
        let mut m = package();
        m.entities[0].public_read = false;
        assert!(validate(&m).is_err());
        let mut m = package();
        m.configuration
            .as_mut()
            .unwrap()
            .inputs
            .as_mut()
            .unwrap()
            .arguments
            .push("missing".into());
        assert!(validate(&m).is_err());
        let mut m = package();
        m.configuration.as_mut().unwrap().currency = Some("BAD".into());
        assert!(validate(&m).is_err());
    }
}
