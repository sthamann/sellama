//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let n = |key: &str| args[key].as_u64().ok_or_else(|| format!("Invalid {key}"));
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("order_edit_admissible") => Ok(json!(order_edit_admissible(b("terminal")?))),
        Some("completion_admissible") => Ok(json!(completion_admissible(
            b("terminal")?,
            b("payment_ready")?,
            b("deliveries_ready")?
        ))),
        Some("cancellation_admissible") => Ok(json!(cancellation_admissible(
            b("terminal")?,
            b("external_payment")?,
            b("refund_required")?,
            b("deliveries_open")?
        ))),
        Some("manual_payment_admissible") => Ok(json!(manual_payment_admissible(
            b("terminal")?,
            b("external_payment")?,
            b("current_pending")?,
            b("target_paid")?
        ))),
        Some("download_admissible") => Ok(json!(download_admissible(
            b("order_blocked")?,
            b("paid")?,
            b("simulated_authorized")?
        ))),
        Some("receipt_admissible") => Ok(json!(receipt_admissible(
            n("expected")?,
            n("received")?,
            b("same_currency")?,
            b("confirmed")?
        ))),
        Some("reservation_release_admissible") => Ok(json!(reservation_release_admissible(
            b("uncaptured")?,
            b("authorized")?,
            b("void_confirmed")?
        ))),
        Some("payment_transition_admissible") => Ok(json!(payment_transition_admissible(
            n("current")?,
            n("next")?
        ))),
        Some("delivery_split_admissible") => Ok(json!(delivery_split_admissible(
            b("is_open")?,
            b("terminal")?,
            n("available")?,
            n("moving")?
        ))),
        Some("carrier_booking_admissible") => Ok(json!(carrier_booking_admissible(
            b("is_open")?,
            b("closed")?,
            b("labelled")?,
            b("occupied")?,
            b("same")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
