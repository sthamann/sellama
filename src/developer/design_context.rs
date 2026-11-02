//! Editor context is validated against the supplied Manifest; references are untrusted evidence, never authority.
use super::*;
/// Reject stale element/language scope before contacting a provider or external reference.
pub(super) fn validate(v: &Value, locales: &[String]) -> Result<Value> {
    let Some(context) = v.get("context").filter(|c| !c.is_null()) else {
        return Ok(Value::Null);
    };
    let view = context["view"].as_str().ok_or(bad("Select an app view"))?;
    let selected = context["selected"]
        .as_str()
        .ok_or(bad("Invalid selected element"))?;
    let language = context["language"]
        .as_str()
        .ok_or(bad("Select a content language"))?;
    if context["channel"] != "*" || !locales.iter().any(|l| l == language) {
        return Err(bad(
            "App definitions use all channels and a configured content language",
        ));
    }
    let views = v["manifest"]["views"].as_array();
    let found = views.and_then(|rows| rows.iter().find(|row| row["id"] == view));
    if (!view.is_empty() && found.is_none())
        || (!selected.is_empty()
            && !found
                .and_then(|row| row["blocks"].as_array())
                .is_some_and(|rows| rows.iter().any(|row| row["id"] == selected)))
    {
        return Err(conflict("Selected app view or element no longer exists"));
    }
    Ok(
        json!({"view":view,"selected":selected,"language":language,"channel":"*","manifestDigest":hash(&v["manifest"].to_string())}),
    )
}
/// Persist only context, capture status and content digests, never uploaded pixels or fetched HTML.
pub(super) fn receipt(context: &Value, evidence: &Value) -> Value {
    let sources: Vec<Value> = evidence
        .as_array()
        .into_iter()
        .flatten()
        .map(|source| {
            let mut source = source.clone();
            if let Some(text) = source.as_object_mut().and_then(|s| s.remove("text")) {
                source["digest"] = json!(hash(&text.to_string()));
            }
            source
        })
        .collect();
    json!({"version":1,"context":context,"sources":sources})
}
pub(super) fn stored(prompt: &str, evidence: Option<&Value>) -> String {
    evidence.map_or_else(
        || prompt.into(),
        |e| json!({"designEvidence":e,"instruction":prompt}).to_string(),
    )
}
pub(super) fn restored(prompt: &str) -> Value {
    serde_json::from_str::<Value>(prompt)
        .ok()
        .and_then(|v| v.get("designEvidence").cloned())
        .unwrap_or(Value::Null)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn selection_is_manifest_and_locale_bound() {
        let mut input = json!({"manifest":{"views":[{"id":"detail","blocks":[{"id":"buy"}]}]},"context":{"view":"detail","selected":"buy","language":"de-DE","channel":"*"}});
        assert!(validate(&input, &["de-DE".into()]).is_ok());
        input["context"]["selected"] = json!("foreign");
        assert!(validate(&input, &["de-DE".into()]).is_err());
        input["context"]["selected"] = json!("");
        assert!(validate(&input, &["fr-FR".into()]).is_err());
        input["context"]["channel"] = json!("other");
        assert!(validate(&input, &["de-DE".into()]).is_err());
    }
    #[test]
    fn retained_evidence_has_no_source_body() {
        let e = receipt(
            &Value::Null,
            &json!([{"url":"https://example.com","text":"<script>untrusted</script>","status":"partial"}]),
        );
        assert!(e["sources"][0].get("text").is_none());
        assert!(e["sources"][0]["digest"].is_string());
        assert_eq!(restored(&stored("test", Some(&e))), e);
        assert!(restored("Visual App Studio build").is_null());
    }
}
