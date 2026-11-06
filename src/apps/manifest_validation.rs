//! Native complete-package extension and policy adapter for the independent ordered package compiler.
use super::*;
use veyndo_app_model::package::{CompileError, Extensions, Policy};
impl Policy for editor_contract::ReferencePolicy {
    fn known_scope(&self, scope: &str) -> bool {
        auth::SCOPES.contains(&scope)
    }
    fn component_source(&self, source: &str) -> bool {
        Sandbox::component_source(source)
    }
}
struct NativeExtensions<'a>(&'a Manifest);
impl Extensions for NativeExtensions<'_> {
    type Error = Error;
    fn before(&self) -> Result<()> {
        let m = self.0;
        core_extensions::validate(m)?;
        native_lifecycle::validate(m)?;
        settings::validate(m)?;
        configuration_inputs::validate(m)?;
        presentation::validate(m.presentation.as_ref())?;
        ontology::validate(m)?;
        schema_changes::validate(m)?;
        distribution::validate(m)?;
        commerce_hooks::validate(m)?;
        business_capability::validate(m)?;
        crate::payments::validate_contract(m)?;
        Ok(())
    }
    fn after(&self) -> Result<()> {
        let m = self.0;
        event_projection::validate(m)?;
        event_contract::validate(m)?;
        schedules::validate(m)?;
        webhooks::validate(m)?;
        surfaces::validate_contract(m)?;
        native_views::validate(m)?;
        Ok(())
    }
}
pub(crate) fn validate(m: &Manifest) -> Result<()> {
    let contract = m.common_contract();
    veyndo_app_model::package::compile(
        &contract,
        &editor_contract::ReferencePolicy,
        &NativeExtensions(m),
    )
    .map_err(|error| match error {
        CompileError::Host(error) => error,
        CompileError::Model(error) => model_contract::error(error),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn extra_action_rights_are_known_private_scopes() {
        let mut value: Value = serde_json::from_str(include_str!(
            "../../extensions/apps/marketplaces/manifest.json"
        ))
        .unwrap();
        let parse = |v: &Value| serde_json::from_value::<Manifest>(v.clone()).unwrap();
        assert!(validate(&parse(&value)).is_ok());
        let idx = value["actions"]
            .as_array()
            .unwrap()
            .iter()
            .position(|a| a["name"] == "import_order")
            .unwrap();
        value["actions"][idx]["requiredPermissions"] = json!(["not.a.scope"]);
        assert!(validate(&parse(&value)).is_err());
        value["actions"][idx]["requiredPermissions"] = json!(["customers.pii"]);
        value["actions"][idx]["public"] = json!(true);
        value["actions"][idx]
            .as_object_mut()
            .unwrap()
            .remove("permission");
        assert!(validate(&parse(&value)).is_err());
    }
}
