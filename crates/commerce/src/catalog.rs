//! Shared product snapshot and tier contracts, without database or transport authority.
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Tier {
    pub rule_id: String,
    pub quantity_start: u32,
    pub quantity_end: Option<u32>,
    pub discount: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Product {
    #[serde(default, serialize_with = "public_extra")]
    pub extra: Value,
    pub id: String,
    #[serde(default)]
    pub product_number: String,
    pub name: String,
    pub category: String,
    pub description: String,
    pub price: f64,
    pub tax_rate: f64,
    pub stock: i32,
    pub revision: i64,
    pub list_price: Option<f64>,
    pub regulation_price: Option<f64>,
    pub reference_price: Option<crate::pricing::ReferenceDefinition>,
    pub advanced_prices: Vec<Tier>,
    pub min_purchase: u32,
    pub purchase_steps: u32,
    pub max_purchase: Option<u32>,
    pub parent_id: Option<String>,
    pub options: Value,
    pub media: Value,
    pub properties: Value,
    pub delivery_days: i32,
}

/// Public product serialization excludes internal rule facts, notably supplier purchase prices.
fn public_extra<S: serde::Serializer>(extra: &Value, serializer: S) -> Result<S::Ok, S::Error> {
    let mut public = extra.clone();
    if let Some(object) = public.as_object_mut() {
        object.remove("automation");
    }
    public.serialize(serializer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn legacy_product() -> Value {
        json!({
            "id": "blazer", "name": "Blazer", "category": "fashion",
            "description": "A tailored blazer", "price": 179.0, "tax_rate": 19.0,
            "stock": 12, "revision": 7, "list_price": null, "regulation_price": null,
            "reference_price": null, "advanced_prices": [{
                "rule_id": "business", "quantity_start": 3, "quantity_end": null,
                "discount": 0.1
            }],
            "min_purchase": 1, "purchase_steps": 1, "max_purchase": null,
            "parent_id": "collection", "options": {"size": "M"},
            "media": [{"url": "/media/blazer.glb", "variantIds": ["blue"]}],
            "properties": {"material": "wool"}, "delivery_days": 2
        })
    }

    #[test]
    fn legacy_product_defaults_and_wire_fields_are_preserved() {
        let source = legacy_product();
        let product: Product = serde_json::from_value(source.clone()).unwrap();
        assert!(product.extra.is_null());
        assert!(product.product_number.is_empty());
        let mut expected = source;
        expected["extra"] = Value::Null;
        expected["product_number"] = json!("");
        assert_eq!(serde_json::to_value(product).unwrap(), expected);
    }

    #[test]
    fn public_serialization_redacts_rule_facts_without_changing_the_snapshot() {
        let mut source = legacy_product();
        source["product_number"] = json!("BLAZER-M");
        source["extra"] = json!({
            "automation": {"purchasePrices": {"net": 40}, "customFields": {"supplier": "private"}},
            "specifications": {"care": "Dry clean"}, "digital": false
        });
        let product: Product = serde_json::from_value(source.clone()).unwrap();
        let public = serde_json::to_value(&product).unwrap();
        source["extra"]
            .as_object_mut()
            .unwrap()
            .remove("automation");
        assert_eq!(public, source);
        assert_eq!(product.extra["automation"]["purchasePrices"]["net"], 40);
    }
}
