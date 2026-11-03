//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let n = |key: &str| args[key].as_u64().ok_or_else(|| format!("Invalid {key}"));
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("ai_price_admissible") => Ok(json!(ai_price_admissible(
            n("price")?,
            n("minimum")?,
            n("maximum")?,
            b("margin")?,
            b("discount")?,
            b("brand")?,
            b("available")?
        ))),
        Some("ai_autonomy_admissible") => Ok(json!(ai_autonomy_admissible(
            b("enabled")?,
            b("authorized")?,
            b("price_only")?,
            b("daily_budget")?,
            b("within_delta")?
        ))),
        Some("claim_render_admissible") => Ok(json!(claim_render_admissible(
            b("confirmed")?,
            b("public_source")?,
            b("current_source")?,
            b("valid_time")?,
            b("exact_text")?
        ))),
        Some("experiment_result_admissible") => Ok(json!(experiment_result_admissible(
            b("final_look")?,
            b("enough_units")?,
            b("positive_bound")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
