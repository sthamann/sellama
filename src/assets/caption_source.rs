//! Image evidence uses owned assets or DNS-pinned public HTTPS; decoded thumbnails strip metadata before inference.
use crate::*;
use base64::{Engine as _, engine::general_purpose::STANDARD};
pub(super) async fn read(a: &App, h: &RequestContext, url: &str) -> Result<Option<String>> {
    if url.is_empty() {
        return Ok(None);
    }
    let bytes = if let Some(path) = url.strip_prefix("/store-api/assets/") {
        auth::permit(h, "catalog.read")?;
        let id = path.split('?').next().unwrap_or("");
        let bytes: Option<Vec<u8>> = sqlx::query_scalar("SELECT content FROM product_assets WHERE tenant=$1 AND id=$2 AND mime IN ('image/png','image/jpeg','image/webp') AND octet_length(content)<=8388608")
            .bind(merchant(a,h)?).bind(id).fetch_optional(&a.db).await?;
        bytes.ok_or(Error(
            StatusCode::NOT_FOUND,
            "Owned image unavailable".into(),
        ))?
    } else if bundled_demo(url) {
        let path = format!("frontend/dist{url}");
        if tokio::fs::metadata(&path)
            .await
            .map_or(true, |m| m.len() > 8 * 1024 * 1024)
        {
            return Ok(None);
        }
        tokio::fs::read(path)
            .await
            .map_err(|_| bad("Bundled caption image unavailable"))?
    } else if url.starts_with('/') && !url.starts_with("//") {
        // Generated SVG/static previews are not pixel evidence. No internal URL is requested.
        return Ok(None);
    } else {
        let parsed = reqwest::Url::parse(url).map_err(|_| bad("Invalid caption image URL"))?;
        if !parsed.username().is_empty() || parsed.password().is_some() {
            return Err(bad("Caption image credentials are forbidden"));
        }
        let client = apps::public_https_client(&parsed).await?;
        let response = client
            .get(parsed)
            .timeout(std::time::Duration::from_secs(8))
            .send()
            .await;
        let Ok(mut response) = response else {
            return Ok(None);
        };
        if !response.status().is_success() {
            return Ok(None);
        }
        let mut bytes = vec![];
        while let Some(chunk) = response
            .chunk()
            .await
            .map_err(|_| bad("Caption image interrupted"))?
        {
            if bytes.len() + chunk.len() > 8 * 1024 * 1024 {
                return Err(bad("Caption image exceeds 8 MiB"));
            }
            bytes.extend(chunk);
        }
        bytes
    };
    tokio::task::spawn_blocking(move || thumbnail(&bytes))
        .await
        .map_err(|_| bad("Caption image worker failed"))?
}
fn bundled_demo(url: &str) -> bool {
    crate::demo_catalog::template()["products"]
        .as_array()
        .is_some_and(|ps| {
            ps.iter().any(|p| {
                p["media"]
                    .as_array()
                    .is_some_and(|ms| ms.iter().any(|m| m["url"].as_str() == Some(url)))
            })
        })
}
fn thumbnail(bytes: &[u8]) -> Result<Option<String>> {
    let reader = image::ImageReader::new(std::io::Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|_| bad("Caption image format unavailable"))?;
    if !matches!(
        reader.format(),
        Some(image::ImageFormat::Png | image::ImageFormat::Jpeg | image::ImageFormat::WebP)
    ) {
        return Ok(None);
    }
    let mut reader = reader;
    let mut limits = image::Limits::default();
    limits.max_image_width = Some(8192);
    limits.max_image_height = Some(8192);
    limits.max_alloc = Some(128 * 1024 * 1024);
    reader.limits(limits);
    let image = reader
        .decode()
        .map_err(|_| bad("Invalid or oversized caption image"))?
        .thumbnail(768, 768);
    let mut png = std::io::Cursor::new(vec![]);
    image
        .write_to(&mut png, image::ImageFormat::Png)
        .map_err(|_| bad("Caption image encoding failed"))?;
    if png.get_ref().len() > 1024 * 1024 {
        return Err(bad("Caption thumbnail exceeds 1 MiB"));
    }
    Ok(Some(format!(
        "data:image/png;base64,{}",
        STANDARD.encode(png.into_inner())
    )))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bundled_images_require_exact_public_fixture_paths() {
        assert!(bundled_demo("/media/demo/fashion/coat.webp"));
        for url in [
            "/media/demo/fashion/../secrets.webp",
            "/media/demo/fashion/coat.webp?secret=true",
            "/assets/private.png",
        ] {
            assert!(!bundled_demo(url));
        }
    }
    #[test]
    fn evidence_is_a_decoded_bounded_thumbnail() {
        assert!(thumbnail(b"<svg onload=alert(1)>").unwrap().is_none());
        assert!(thumbnail(b"\x89PNG\r\n\x1a\ninvalid").is_err());
        let mut png = std::io::Cursor::new(vec![]);
        image::DynamicImage::new_rgb8(900, 100)
            .write_to(&mut png, image::ImageFormat::Png)
            .unwrap();
        assert!(
            thumbnail(png.get_ref())
                .unwrap()
                .unwrap()
                .starts_with("data:image/png;base64,")
        );
    }
}
