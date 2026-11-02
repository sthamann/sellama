//! Caption proposals use central inference and current shop languages; only the owning native editor can save them.
use crate::*;
const PROMPT: &str = include_str!("../../crates/cognition/prompts/media-caption.v1.txt");
pub(crate) fn schema(name: &str) -> Option<Value> {
    (name == "merchant.media.caption").then(|| json!({"type":"object","additionalProperties":false,"required":["locale","context"],"properties":{
        "locale":{"type":"string","minLength":2,"maxLength":35},
        "context":{"type":"string","minLength":1,"maxLength":4000},
        "imageUrl":{"type":"string","maxLength":2000},
        "alt":{"type":"string","maxLength":400},
        "caption":{"type":"string","maxLength":600}
    }}))
}
fn output_schema() -> Value {
    json!({"type":"object","additionalProperties":false,"required":["caption","alt"],"properties":{
        "caption":{"type":"string","minLength":1,"maxLength":600},"alt":{"type":"string","maxLength":400}
    }})
}
pub(super) async fn route(
    State(a): State<App>,
    h: RequestContext,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(
        capabilities::invoke(&a, &h, "merchant.media.caption", &v).await?,
    ))
}
pub(super) async fn prepare(a: &App, h: &RequestContext, v: &Value) -> Result<Value> {
    let tenant = merchant(a, h)?;
    auth::permit(h, "assistant.use")?;
    apps::validate_native_input(&schema("merchant.media.caption").unwrap(), v)?;
    let locale = v["locale"].as_str().unwrap();
    let (settings, _) = commerce::config(a, &tenant).await?;
    if !commerce::company_locale_allowed(locale, &settings) {
        return Err(bad("Caption language is not enabled for this shop"));
    }
    performance::reserve_ai_attempt(a, &tenant).await?;
    let _slot = a.inference_slots.clone().try_acquire_owned().map_err(|_| {
        Error(
            StatusCode::TOO_MANY_REQUESTS,
            "Caption model busy; retry shortly".into(),
        )
    })?;
    let _lease = performance::cluster_lease::Lease::acquire(a, &tenant, "model", 2).await?;
    let image = super::caption_source::read(a, h, v["imageUrl"].as_str().unwrap_or("")).await?;
    let basis = if image.is_some() { "image" } else { "context" };
    let evidence = json!({"locale":locale,"context":v["context"],"existingAlt":v["alt"],"existingCaption":v["caption"],"imageAvailable":image.is_some()});
    let result = a
        .inference
        .structured_with_images(
            None,
            PROMPT,
            &evidence.to_string(),
            &output_schema(),
            &image.into_iter().collect::<Vec<_>>(),
        )
        .await
        .map_err(|_| {
            Error(
                StatusCode::BAD_GATEWAY,
                "Caption provider unavailable; your content is unchanged".into(),
            )
        })?;
    validate_output(&result.value)?;
    Ok(
        json!({"caption":result.value["caption"],"alt":result.value["alt"],"locale":locale,"basis":basis,"promptId":"media-caption@1","model":result.model}),
    )
}
fn validate_output(v: &Value) -> Result<()> {
    apps::validate_native_input(&output_schema(), v)?;
    for (field, limit) in [("caption", 600), ("alt", 400)] {
        let s = v[field].as_str().ok_or(bad("Invalid caption proposal"))?;
        if s.len() > limit || s.contains(['<', '>']) || s.chars().any(|c| c.is_control()) {
            return Err(bad("Caption proposal must be bounded plain text"));
        }
    }
    if v["caption"].as_str().unwrap().trim().is_empty() {
        return Err(bad("Caption proposal is empty"));
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn proposals_are_text_not_actions_or_markup() {
        assert!(validate_output(&json!({"caption":"Ein Stuhl aus Holz.","alt":"Stuhl"})).is_ok());
        for value in [
            json!({"caption":"<img onerror=alert(1)>","alt":""}),
            json!({"caption":" ","alt":""}),
            json!({"caption":"text","alt":"","publish":true}),
            json!({"caption":"x".repeat(601),"alt":""}),
        ] {
            assert!(validate_output(&value).is_err());
        }
    }
}
