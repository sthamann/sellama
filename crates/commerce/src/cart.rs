//! Persisted cart data with explicit typed host contexts and no credential or storage authority.
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub quantity: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(bound(
    deserialize = "Discount: Deserialize<'de>, BusinessContext: Deserialize<'de>, AppConfiguration: Deserialize<'de>, CheckoutContext: Deserialize<'de>"
))]
pub struct Cart<Discount, BusinessContext, AppConfiguration, CheckoutContext> {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub admin_actor: Option<String>,
    #[serde(default)]
    pub coupons: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pos_actor: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pos_discount: Option<Discount>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub b2b: Option<BusinessContext>,
    #[serde(default)]
    pub currency: String,
    #[serde(default = "default_channel")]
    pub sales_channel: String,
    #[serde(default)]
    pub app_configurations: HashMap<String, AppConfiguration>,
    pub items: Vec<Item>,
    pub group: String,
    pub email: Option<String>,
    #[serde(default)]
    pub customer_id: Option<String>,
    pub company: Option<String>,
    pub session: String,
    pub buyer: Option<Value>,
    pub order: Option<Value>,
    #[serde(default)]
    pub locale: String,
    #[serde(default)]
    pub channel: String,
    #[serde(default)]
    pub checkout: Option<CheckoutContext>,
}

fn default_channel() -> String {
    "default".into()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[derive(Clone, Debug, Serialize, Deserialize)]
    struct HostContext {
        value: u32,
    }

    type HostCart = Cart<HostContext, HostContext, HostContext, HostContext>;

    fn legacy_cart() -> Value {
        json!({
            "items": [{"id": "blazer", "quantity": 2}],
            "group": "private", "email": null, "company": null,
            "session": "fixture-session", "buyer": null, "order": null
        })
    }

    #[test]
    fn legacy_defaults_do_not_require_default_host_contexts() {
        let mut expected = legacy_cart();
        let cart: HostCart = serde_json::from_value(expected.clone()).unwrap();
        expected["coupons"] = json!([]);
        expected["currency"] = json!("");
        expected["sales_channel"] = json!("default");
        expected["app_configurations"] = json!({});
        expected["customer_id"] = Value::Null;
        expected["locale"] = json!("");
        expected["channel"] = json!("");
        expected["checkout"] = Value::Null;
        assert_eq!(serde_json::to_value(cart).unwrap(), expected);
    }

    #[test]
    fn each_context_round_trips_through_its_declared_type() {
        let mut source = legacy_cart();
        source["admin_actor"] = json!("merchant");
        source["pos_actor"] = json!("cashier");
        source["pos_discount"] = json!({"value": 1});
        source["b2b"] = json!({"value": 2});
        source["app_configurations"] = json!({"blazer": {"value": 3}});
        source["checkout"] = json!({"value": 4});
        let cart: HostCart = serde_json::from_value(source).unwrap();
        let encoded = serde_json::to_value(&cart).unwrap();
        assert_eq!(encoded["pos_discount"]["value"], 1);
        assert_eq!(encoded["b2b"]["value"], 2);
        assert_eq!(encoded["app_configurations"]["blazer"]["value"], 3);
        assert_eq!(encoded["checkout"]["value"], 4);
        assert_eq!(encoded["admin_actor"], "merchant");
        assert_eq!(encoded["pos_actor"], "cashier");
    }

    #[test]
    fn malformed_host_context_is_rejected() {
        let mut source = legacy_cart();
        source["b2b"] = json!({"value": "forged"});
        assert!(serde_json::from_value::<HostCart>(source).is_err());
    }
}
