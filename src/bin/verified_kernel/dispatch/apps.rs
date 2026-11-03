//! Generated conformance driver; invokes the same production policy functions as the commerce server.
use serde_json::{Value, json};
use veyndo::verified_kernel::*;
pub(super) fn eval(j: &Value) -> Result<Value, String> {
    let args = &j["args"];
    let n = |key: &str| args[key].as_u64().ok_or_else(|| format!("Invalid {key}"));
    let b = |key: &str| args[key].as_bool().ok_or_else(|| format!("Invalid {key}"));
    match j["function"].as_str() {
        Some("app_flow_admissible") => Ok(json!(app_flow_admissible(
            b("allowed")?,
            b("read_only")?,
            b("is_public")?
        ))),
        Some("app_read_admissible") => {
            Ok(json!(app_read_admissible(b("read_only")?, b("mutating")?)))
        }
        Some("app_tool_admissible") => {
            Ok(json!(app_tool_admissible(b("enabled")?, b("authorized")?)))
        }
        Some("app_core_reference_admissible") => Ok(json!(app_core_reference_admissible(
            b("product")?,
            b("private_data")?
        ))),
        Some("app_service_transport_admissible") => Ok(json!(app_service_transport_admissible(
            b("clean_url")?,
            b("https")?,
            b("http")?,
            b("loopback")?,
            b("private_origin")?
        ))),
        Some("app_package_authorized") => {
            Ok(json!(app_package_authorized(b("pinned")?, b("bundled")?)))
        }
        Some("wasm_resources_admissible") => Ok(json!(wasm_resources_admissible(
            n("tables")?,
            n("memories")?,
            n("elements")?,
            n("pages")?
        ))),
        Some("app_surface_admissible") => Ok(json!(app_surface_admissible(
            b("current_package")?,
            b("allowed_action")?
        ))),
        Some("app_callback_admissible") => Ok(json!(app_callback_admissible(
            b("capability")?,
            b("current_role")?
        ))),
        Some("app_submission_admissible") => Ok(json!(app_submission_admissible(
            b("private_inbox")?,
            b("live_scope")?,
            b("current_cart")?
        ))),
        Some("app_configuration_release_admissible") => {
            Ok(json!(app_configuration_release_admissible(
                b("extension")?,
                b("product")?,
                b("company")?,
                b("operational")?
            )))
        }
        Some("native_lifecycle_admissible") => Ok(json!(native_lifecycle_admissible(
            b("native")?,
            b("rights")?,
            b("guards")?
        ))),
        Some("source_activation_admissible") => Ok(json!(source_activation_admissible(
            b("imported")?,
            b("reviewed")?,
            b("active")?
        ))),
        Some("job_completion_admissible") => Ok(json!(job_completion_admissible(
            b("cancel_requested")?,
            b("succeeded")?
        ))),
        _ => Err("Unknown policy".into()),
    }
}
