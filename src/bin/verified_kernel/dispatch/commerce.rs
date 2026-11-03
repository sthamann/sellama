//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let n = |key: &str| args[key].as_u64().ok_or_else(|| format!("Invalid {key}"));
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("discount_cap") => Ok(json!(discount_cap(n("total")?, n("requested")?))),
        Some("stock_admissible") => Ok(json!(stock_admissible(n("stock")?, n("quantity")?))),
        Some("refund_admissible") => Ok(json!(refund_admissible(
            n("captured")?,
            n("refunded")?,
            n("requested")?
        ))),
        Some("capture_admissible") => Ok(json!(capture_admissible(
            n("authorized")?,
            n("captured")?,
            n("reserved")?,
            n("requested")?
        ))),
        Some("revision_admissible") => {
            Ok(json!(revision_admissible(n("current")?, n("expected")?)))
        }
        Some("replay_admissible") => Ok(json!(replay_admissible(
            b("same_cart")?,
            b("cart_open")?,
            b("same_fingerprint")?
        ))),
        Some("checkout_contact_admissible") => Ok(json!(checkout_contact_admissible(
            b("simulated")?,
            b("email_present")?,
            b("billing_present")?
        ))),
        Some("checkout_review_admissible") => Ok(json!(checkout_review_admissible(
            b("revision_matches")?,
            n("expected_total")?,
            n("actual_total")?,
            b("methods_confirmed")?
        ))),
        Some("currency_context_admissible") => Ok(json!(currency_context_admissible(
            b("enabled")?,
            b("configured")?,
            b("fresh")?
        ))),
        Some("currency_scale_admissible") => Ok(json!(currency_scale_admissible(n("scale")?))),
        Some("pos_cash_admissible") => Ok(json!(pos_cash_admissible(
            b("authorized")?,
            n("tender")?,
            n("total")?,
            b("reviewed")?
        ))),
        Some("b2b_budget_admissible") => Ok(json!(b2b_budget_admissible(
            n("limit")?,
            n("spent")?,
            n("requested")?
        ))),
        Some("b2b_approval_admissible") => Ok(json!(b2b_approval_admissible(
            b("different")?,
            b("authorized")?,
            b("pending")?,
            b("current")?
        ))),
        Some("pos_discount_admissible") => Ok(json!(pos_discount_admissible(
            b("actor")?,
            b("currency")?,
            b("reason")?,
            n("minor")?,
            n("goods")?
        ))),
        Some("external_amount_admissible") => Ok(json!(external_amount_admissible(
            n("gross")?,
            n("tax")?,
            n("rate")?
        ))),
        Some("external_paid_total_admissible") => Ok(json!(external_paid_total_admissible(
            b("paid")?,
            n("calculated")?,
            n("declared")?
        ))),
        Some("admin_payment_admissible") => Ok(json!(admin_payment_admissible(
            b("is_admin")?,
            b("manual")?,
            b("simulated")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
