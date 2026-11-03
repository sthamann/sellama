//! Model media references reuse owned immutable product assets, current product CAS and parent variant links.
use super::*;
pub(crate) fn validate_shape(media: &[Value]) -> Result<()> {
    if media.iter().filter(|m| m["type"] == "model").count() > 4 {
        return Err(bad("Maximum four 3D models per product"));
    }
    for item in media {
        if item
            .get("type")
            .is_some_and(|v| v != "image" && v != "model")
        {
            return Err(bad("Unknown product media type"));
        }
        if item["type"] == "model" {
            if !item["url"]
                .as_str()
                .is_some_and(|u| u.starts_with("/store-api/assets/"))
            {
                return Err(bad("3D models require an uploaded GLB asset"));
            }
            if item.get("modelVariant").is_some_and(|v| {
                !v.is_null()
                    && v.as_str()
                        .is_none_or(|s| s.len() > 100 || s.chars().any(char::is_control))
            }) {
                return Err(bad("Invalid 3D material variant"));
            }
        } else if item.get("modelVariant").is_some() {
            return Err(bad("Material variants require a 3D model"));
        }
    }
    Ok(())
}
pub(crate) async fn validate(
    tx: &mut sqlx::PgConnection,
    t: &str,
    product: &str,
    media: &Value,
) -> Result<()> {
    for item in media
        .as_array()
        .ok_or(bad("Invalid product media"))?
        .iter()
        .filter(|m| m["type"] == "model")
    {
        let url = reqwest::Url::parse(&format!("https://local{}", item["url"].as_str().unwrap()))
            .map_err(|_| bad("Invalid model asset URL"))?;
        if url.fragment().is_some() || url.query_pairs().any(|(k, v)| k != "shop" || v != t) {
            return Err(bad("Model asset belongs to another shop"));
        }
        let id = url
            .path()
            .strip_prefix("/store-api/assets/")
            .filter(|s| !s.is_empty() && !s.contains('/'))
            .ok_or(bad("Invalid model asset URL"))?;
        let row = sqlx::query("SELECT substring(content for 1048596) AS prefix FROM product_assets WHERE tenant=$1 AND id=$2 AND public AND kind='attachment' AND mime='model/gltf-binary' AND (product_id=$3 OR product_id=(SELECT parent_id FROM products WHERE tenant=$1 AND id=$3)) FOR SHARE")
            .bind(t).bind(id).bind(product).fetch_optional(&mut *tx).await?.ok_or(bad("Published GLB asset for this product or its parent required"))?;
        let doc = super::model_format::document(&row.get::<Vec<u8>, _>("prefix"))?;
        if let Some(name) = item["modelVariant"].as_str().filter(|s| !s.is_empty())
            && !super::model_format::variants(&doc)?
                .iter()
                .any(|s| s == name)
        {
            return Err(bad("Material variant is not present in this GLB"));
        }
    }
    Ok(())
}
