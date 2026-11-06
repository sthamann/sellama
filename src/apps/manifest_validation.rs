//! Complete shared package compiler adapter; trusted native policies retain current authority and exact native errors.
use super::*;
use veyndo_app_model::package::CompileError;
pub(crate) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::compiler::compile(m, &manifest_policy::Policy).map_err(|e| match e {
        CompileError::Host(e) => e,
        CompileError::Model(e) => model_contract::error(e),
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
