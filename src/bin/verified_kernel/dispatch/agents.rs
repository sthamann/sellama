//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("planning_request_admissible") => Ok(json!(planning_request_admissible(
            b("read_only")?,
            b("planning_post")?
        ))),
        Some("agent_preview_admissible") => Ok(json!(agent_preview_admissible(
            b("active")?,
            b("private_preview")?,
            b("personal")?,
            b("same_owner")?,
            b("current")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
