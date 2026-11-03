//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("scope_admissible") => Ok(json!(scope_admissible(
            b("authenticated")?,
            b("known_scope")?,
            b("owner")?,
            b("explicit")?,
            b("explicit_grant")?,
            b("default_grant")?
        ))),
        Some("platform_admissible") => Ok(json!(platform_admissible(
            b("personal")?,
            b("granted")?,
            b("active")?
        ))),
        Some("shop_request_admissible") => Ok(json!(shop_request_admissible(
            b("active")?,
            b("paused")?,
            b("read_only")?,
            b("settlement")?
        ))),
        Some("consent_admissible") => Ok(json!(consent_admissible(
            b("enabled")?,
            b("current")?,
            b("fresh")?,
            b("chosen")?
        ))),
        Some("legal_checkout_admissible") => Ok(json!(legal_checkout_admissible(
            b("strict")?,
            b("current")?,
            b("accepted")?,
            b("digital")?,
            b("immediate")?
        ))),
        Some("channel_access_admissible") => Ok(json!(channel_access_admissible(
            b("active")?,
            b("is_private")?,
            b("merchant")?,
            b("preview")?,
            b("mutating")?
        ))),
        Some("native_asset_bypass") => {
            Ok(json!(native_asset_bypass(b("native_asset")?, b("hosted")?)))
        }
        Some("auth_factor_admissible") => Ok(json!(auth_factor_admissible(
            b("required")?,
            b("verified")?
        ))),
        Some("persistent_key_admissible") => Ok(json!(persistent_key_admissible(
            b("personal")?,
            b("administrator")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
