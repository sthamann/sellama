//! Adapt shared passive artwork validation; installation and trusted service UI remain native owners.
use super::*;
pub(crate) use veyndo_app_model::presentation::Presentation;
pub(crate) fn validate(p: Option<&Presentation>) -> Result<()> {
    veyndo_app_model::presentation::validate(p).map_err(model_contract::error)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn passive_artwork_validates_and_roundtrips_without_affecting_old_packages() {
        let m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/care-studio/manifest.json"
        ))
        .unwrap();
        assert!(json!(m).get("presentation").is_none());
        let mut generated = json!(m);
        generated["presentation"] =
            json!({"icon":null,"cover":null,"description":{"en":"Care guidance"}});
        let parsed: Manifest = serde_json::from_value(generated).unwrap();
        validate(parsed.presentation.as_ref()).unwrap();
        assert_eq!(
            json!(parsed)["presentation"],
            json!({"description":{"en":"Care guidance"}})
        );
        for url in [
            "/media/shop/cover.webp",
            "/assets/app.svg",
            "https://example.test/app.png",
        ] {
            let mut v = json!(m);
            v["presentation"] =
                json!({"icon":url,"cover":url,"description":{"es":"Guía de cuidado"}});
            let n: Manifest = serde_json::from_value(v).unwrap();
            validate(n.presentation.as_ref()).unwrap();
            assert_eq!(json!(n)["presentation"]["icon"], url);
        }
        for url in [
            "javascript:alert(1)",
            "data:image/svg+xml,x",
            "//example.test/x",
            "http://example.test/x",
            "https://user:secret@example.test/x",
            "/media/../secret",
            "file:///tmp/a",
        ] {
            let p = Presentation {
                icon: Some(url.into()),
                cover: None,
                description: HashMap::new(),
            };
            assert!(validate(Some(&p)).is_err(), "{url}");
        }
    }
}
