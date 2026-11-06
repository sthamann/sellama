//! Immutable development versions are validated before storage; installation targets only private environments.
use super::*;
pub(super) fn validate(m: &apps::Manifest) -> Result<()> {
    apps::validate(m)?;
    if [
        "engraving",
        "paypal",
        "shopware_payments",
        "storyfront",
        "google_analytics",
        "gmail",
        "slack",
        "email",
    ]
    .contains(&m.id.as_str())
        || m.configuration.as_ref().is_some_and(|c| c.inputs.is_none())
        || m.slots.iter().any(|s| {
            !matches!(s.component.as_str(), "entity-list" | "entity-form")
                && !(s.component == "product-configuration"
                    && m.configuration.as_ref().is_some_and(|c| c.inputs.is_some()))
        })
    {
        return Err(bad(
            "Reserved apps and Wasm configuration require a separate reviewed package; service code remains operator deployed",
        ));
    }
    let labels = std::iter::once(&m.name)
        .chain(m.entities.iter().map(|e| &e.label))
        .chain(
            m.entities
                .iter()
                .flat_map(|e| e.fields.iter().map(|f| &f.label)),
        )
        .chain(m.slots.iter().map(|s| &s.label))
        .chain(m.surfaces.iter().map(|s| &s.label));
    if labels
        .into_iter()
        .any(|l| l.is_empty() || l.values().any(|s| s.trim().is_empty() || s.len() > 100))
    {
        return Err(bad("App and field labels must be nonempty and bounded"));
    }
    Ok(())
}
pub(super) async fn save(
    a: &App,
    t: &str,
    v: &Value,
    provider: &str,
    model: Option<&str>,
    evidence: Option<&Value>,
) -> Result<Value> {
    let stage = v["environment"]
        .as_str()
        .ok_or(bad("Private environment required"))?;
    staging::owned(a, t, stage).await?;
    let mut value = v["manifest"].clone();
    routes::actions(&mut value)?;
    generation_bindings::complete(&mut value)?;
    let m: apps::Manifest = serde_json::from_value(value).map_err(|e| bad(e.to_string()))?;
    validate(&m)?;
    let prompt = v["prompt"]
        .as_str()
        .filter(|s| !s.trim().is_empty() && s.len() <= 8000)
        .ok_or(bad("Prompt required, maximum 8000 bytes"))?;
    let (settings, _) = commerce::config(a, t).await?;
    let main = &settings.main_locale;
    apps::native_lifecycle::validate_locale(&m, main)?;
    let base = main.split('-').next().unwrap_or(main);
    let labels = std::iter::once(&m.name)
        .chain(m.entities.iter().map(|e| &e.label))
        .chain(
            m.entities
                .iter()
                .flat_map(|e| e.fields.iter().map(|f| &f.label)),
        )
        .chain(m.surfaces.iter().map(|s| &s.label))
        .chain(
            m.views
                .iter()
                .flat_map(|v| v.blocks.iter().map(|b| &b.title)),
        )
        .chain(m.capability.iter().map(|c| &c.intent))
        .chain(m.capability.iter().flat_map(|c| &c.assumptions))
        .chain(
            m.capability
                .iter()
                .flat_map(|c| c.examples.iter().map(|e| &e.label)),
        );
    if labels.into_iter().any(|l| {
        l.get(main)
            .or_else(|| l.get(base))
            .is_none_or(|s| s.trim().is_empty())
    }) || v["summary"].as_object().is_none_or(|o| {
        o.values()
            .any(|s| s.as_str().is_none_or(|s| s.len() > 1000))
    }) || v["summary"][main]
        .as_str()
        .or_else(|| v["summary"][base].as_str())
        .is_none_or(|s| s.trim().is_empty())
    {
        return Err(bad(
            "App labels and summary need the shop main language; other languages inherit",
        ));
    }
    apps::verify_package(&m).await?;
    let manifest = json!(m);
    let id = uid();
    let retained = design_context::stored(prompt, evidence);
    let mut tx = a.db.begin().await?;
    let digest = veyndo_app_storage::build_versions::save(
        &mut tx,
        &veyndo_app_storage::build_versions::Build {
            scope: veyndo_app_storage::Scope {
                tenant: t,
                app: &m.id,
            },
            id: &id,
            environment: stage,
            version: &m.version,
            manifest: &manifest,
            prompt: &retained,
            provider,
            model,
            summary: &v["summary"],
        },
    )
    .await
    .map_err(version_storage::error)?;
    tx.commit().await?;
    Ok(
        json!({"id":id,"app":m.id,"version":m.version,"digest":digest,"manifest":manifest,"summary":v["summary"],"state":"draft","environment":stage,"designEvidence":evidence}),
    )
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn development_digest_preserves_native_serialized_bytes() {
        let m: apps::Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/product-advisor/manifest.json"
        ))
        .unwrap();
        let value = json!(m);
        assert_eq!(
            veyndo_app_storage::build_versions::digest(&value),
            hash(&value.to_string())
        );
    }
    #[test]
    fn developer_rejects_reserved_apps() {
        let m: apps::Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/storyfront/manifest.json"
        ))
        .unwrap();
        assert!(validate(&m).is_err());
    }
}
