//! Native complete-package adapter for graph mapping; the existing authorized list supplies every projected row.
use super::*;
fn context(m: &Manifest) -> veyndo_app_model::intelligence::Context<'_> {
    veyndo_app_model::intelligence::Context {
        id: &m.id,
        version: &m.version,
        entities: &m.entities,
        actions: &m.actions,
        permissions: &m.permissions,
        intelligence: m.intelligence.as_ref(),
    }
}
#[cfg(test)]
pub(super) fn validate(m: &Manifest) -> Result<()> {
    veyndo_app_model::ontology::validate(&context(m)).map_err(model_contract::error)
}
/// Called only after native list admission, current action/entity rights and tenant RLS.
pub(super) fn project(tenant: &str, m: &Manifest, entity: &Entity, rows: &Value) -> Option<Value> {
    veyndo_app_model::ontology::project(tenant, &context(m), entity, rows)
}
#[cfg(test)]
mod tests {
    use super::*;
    fn manifest() -> Manifest {
        serde_json::from_value(json!({"id":"care_graph","version":"0.1.0","coreApi":"1","runtime":"declarative","name":{"en":"Care"},"permissions":["data.read","data.write"],"entities":[{"name":"guides","fields":[{"name":"product_id","kind":"string","coreReference":"product","indexed":true,"required":true},{"name":"care","kind":"string"}]}],"actions":[{"name":"list_guides","description":"Read care guides","handler":"list","entity":"guides","inputSchema":{"type":"object","properties":{},"additionalProperties":false}}],"intelligence":{"description":{"en":"Care"},"tools":["list_guides"],"entities":["guides"],"ontology":[{"entity":"guides","nodeType":"care_advice","label":{"en":"Care advice"},"fields":["product_id","care"]}]}})).unwrap()
    }
    #[test]
    fn contract_uses_native_entities_fields_and_namespaced_types() {
        let m = manifest();
        assert!(super::super::validate(&m).is_ok());
        for change in 0..8 {
            let mut v = serde_json::to_value(&m).unwrap();
            match change {
                0 => v["intelligence"]["ontology"][0]["fields"] = json!(["invented"]),
                1 => v["intelligence"]["ontology"][0]["nodeType"] = json!("product.property"),
                2 => v["intelligence"]["entities"] = json!([]),
                3 => v["intelligence"]["ontology"][0]["label"] = json!({}),
                4 => v["intelligence"]["ontology"][0]["fields"] = json!(["care", "care"]),
                5 => v["permissions"] = json!(["data.write"]),
                6 => v["intelligence"]["ontology"][0]["relations"] = json!({"care":"invented"}),
                _ => {
                    v["intelligence"]["ontology"][0]["relations"] =
                        json!({"product_id":"core.hijack"})
                }
            };
            assert!(validate(&serde_json::from_value(v).unwrap()).is_err());
        }
    }
    #[test]
    fn exact_revision_and_fields_are_native_views_not_duplicate_facts() {
        let mut m = manifest();
        m.intelligence.as_mut().unwrap().ontology[0]
            .relations
            .insert("product_id".into(), "applies_to".into());
        let rows = json!([{"id":"r1","revision":7,"product_id":"mug","care":"Do not machine wash","unselected":"private"}]);
        let graph = project("fixture", &m, &m.entities[0], &rows).unwrap();
        assert_eq!(graph["tenant"], "fixture");
        assert_eq!(graph["nodes"][0]["source"]["tenant"], "fixture");
        assert_eq!(graph["nodes"][0]["type"], "app.care_graph.care_advice");
        assert_eq!(graph["nodes"][0]["source"]["revision"], 7);
        assert_eq!(graph["nodes"][0]["properties"]["care"], rows[0]["care"]);
        assert!(graph["nodes"][0]["properties"].get("unselected").is_none());
        assert_eq!(graph["edges"][0]["targetId"], "mug");
        assert_eq!(graph["edges"][0]["type"], "app.care_graph.applies_to");
        assert_eq!(graph["visibility"], "merchant-private");
        let huge = json!([{"id":"r1","revision":1,"product_id":"mug","care":"x".repeat(20000)}]);
        let bounded = project("fixture", &m, &m.entities[0], &huge).unwrap();
        assert_eq!(bounded["nodes"], json!([]));
        assert_eq!(bounded["omittedRecords"], 1);
    }
    #[test]
    fn legacy_packages_keep_exact_serde_shape_and_no_projection() {
        let mut m = manifest();
        m.intelligence.as_mut().unwrap().ontology.clear();
        assert!(
            serde_json::to_value(&m).unwrap()["intelligence"]
                .get("ontology")
                .is_none()
        );
        assert!(project("fixture", &m, &m.entities[0], &json!([])).is_none());
    }
}
