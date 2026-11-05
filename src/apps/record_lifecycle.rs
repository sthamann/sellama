//! Native transport mapping for shared app-owned workflow contracts and state transitions.
use super::*;
#[cfg(test)]
fn contract(e: &Entity) -> Result<()> {
    veyndo_app_model::lifecycle::contract(e).map_err(model_contract::error)
}
pub(super) fn change(e: &Entity, old: Option<&Value>, fields: &Value) -> Result<()> {
    veyndo_app_model::lifecycle::change(e, old, fields).map_err(model_contract::error)
}
#[cfg(test)]
mod tests {
    use super::*;
    fn entity() -> Entity {
        serde_json::from_value(json!({"name":"cases","fields":[{"name":"status","kind":"string","required":true,"choices":[{"value":"new","label":{}},{"value":"closed","label":{}}]},{"name":"order_id","kind":"string"}],"workflow":{"field":"status","initial":"new","immutableFields":["order_id"],"transitions":[{"from":"new","to":"closed"}]}})).unwrap()
    }
    #[test]
    fn lifecycle_rejects_skipped_creation_reverse_states_and_identity_swaps() {
        let e = entity();
        contract(&e).unwrap();
        let new = json!({"status":"new","order_id":"owned"});
        let closed = json!({"status":"closed","order_id":"owned"});
        assert!(change(&e, None, &new).is_ok());
        assert!(change(&e, None, &closed).is_err());
        assert!(change(&e, Some(&new), &closed).is_ok());
        assert!(change(&e, Some(&closed), &closed).is_ok());
        assert!(change(&e, Some(&closed), &new).is_err());
        assert!(
            change(
                &e,
                Some(&new),
                &json!({"status":"new","order_id":"different"})
            )
            .is_err()
        );
    }
    #[test]
    fn invalid_choice_and_identity_contracts_are_rejected() {
        let mut e = entity();
        e.workflow.as_mut().unwrap().initial = "unknown".into();
        assert!(contract(&e).is_err());
        e = entity();
        e.workflow
            .as_mut()
            .unwrap()
            .immutable_fields
            .push("missing".into());
        assert!(contract(&e).is_err());
        e = entity();
        e.fields[0].translatable = true;
        assert!(contract(&e).is_err());
    }
}
