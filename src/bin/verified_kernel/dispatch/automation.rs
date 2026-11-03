//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let n = |key: &str| args[key].as_u64().ok_or_else(|| format!("Invalid {key}"));
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("rule_authenticated") => Ok(json!(rule_authenticated(
            b("customer_present")?,
            b("required")?
        ))),
        Some("rule_boolean_comparison") => Ok(json!(rule_boolean_comparison(
            b("equal")?,
            b("empty")?,
            b("eq")?,
            b("neq")?,
            b("is_empty")?
        ))),
        Some("rule_xor_count") => Ok(json!(rule_xor_count(n("hits")?))),
        Some("flow_delay_admissible") => Ok(json!(flow_delay_admissible(n("seconds")?))),
        Some("destination_tax_admissible") => Ok(json!(destination_tax_admissible(
            b("condition")?,
            b("country")?,
            b("state")?,
            b("postal")?,
            b("date")?
        ))),
        Some("customer_group_net") => {
            Ok(json!(customer_group_net(b("configured")?, b("business")?)))
        }
        Some("resource_quota_admissible") => Ok(json!(resource_quota_admissible(n("limit")?))),
        Some("notification_retry_admissible") => Ok(json!(notification_retry_admissible(
            b("rate_limited")?,
            n("attempts")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
