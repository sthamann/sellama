//! Serve the same commerce operations without the native storefront or Studio shell.
use crate::{Error, Json, Response, StatusCode, bad, header, json, validate_tenant};
use axum::{extract::Request, http::uri::Authority, middleware::Next, response::IntoResponse};

pub(crate) fn api_host(host: &str, suffix: &str) -> bool {
    crate::brand_redirect::domain(suffix)
        && host
            .trim_end_matches('.')
            .split_once('.')
            .is_some_and(|(label, domain)| {
                label.eq_ignore_ascii_case("api") && domain.eq_ignore_ascii_case(suffix)
            })
}

fn namespace(path: &str, prefix: &str) -> bool {
    path.strip_prefix(prefix)
        .is_some_and(|tail| tail.starts_with('/'))
}

fn protocol_path(path: &str) -> bool {
    matches!(
        path,
        "/health" | "/mcp" | "/.well-known/ucp" | "/.well-known/commerce-facts.json"
    ) || ["/api", "/store-api", "/ucp"]
        .iter()
        .any(|prefix| namespace(path, prefix))
}

fn requires_shop(path: &str) -> bool {
    matches!(path, "/mcp" | "/.well-known/ucp")
        || namespace(path, "/store-api")
        || (namespace(path, "/ucp") && path != "/ucp/2026-10-13/b2b-negotiation.json")
}

fn scoped_asset(request: &Request) -> bool {
    let path = request.uri().path();
    if !["/store-api/assets", "/store-api/company-logo"]
        .iter()
        .any(|prefix| namespace(path, prefix))
    {
        return false;
    }
    request.uri().query().is_some_and(|query| {
        reqwest::Url::parse(&format!("https://local.test/?{query}")).is_ok_and(|url| {
            url.query_pairs()
                .any(|(key, value)| key == "shop" && validate_tenant(&value).is_ok())
        })
    })
}

pub(super) async fn admit(request: Request, next: Next) -> Response {
    let config = crate::runtime_config::get();
    let host = header(request.headers(), "host").and_then(|host| host.parse::<Authority>().ok());
    if !config.http_api_only
        && !host.is_some_and(|host| api_host(host.host(), &config.shop_domain_suffix))
    {
        return next.run(request).await;
    }

    let path = request.uri().path();
    if matches!(path, "/" | "/.well-known/veyndo") {
        if !matches!(request.method().as_str(), "GET" | "HEAD") {
            return StatusCode::METHOD_NOT_ALLOWED.into_response();
        }
        return Json(json!({
            "name": "Veyndo Commerce",
            "version": 1,
            "mode": "api-only",
            "shopHeader": "x-tenant",
            "endpoints": {
                "health": "/health", "store": "/store-api", "admin": "/api",
                "mcp": "/mcp", "ucp": "/.well-known/ucp"
            },
            "documentation": "https://www.veyndo.ai/docs/hosted-component-api.html"
        }))
        .into_response();
    }
    if !protocol_path(path) {
        return Error(
            StatusCode::NOT_FOUND,
            "This origin serves commerce APIs".into(),
        )
        .into_response();
    }
    if requires_shop(path)
        && header(request.headers(), "x-tenant").is_none()
        && !scoped_asset(&request)
    {
        return bad("Set the x-tenant header to your shop ID").into_response();
    }
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_api_host_and_protocol_paths_match() {
        assert!(api_host("API.veyndo.ai", "veyndo.ai"));
        for host in [
            "shop.veyndo.ai",
            "api.veyndo.ai.example",
            "nested.api.veyndo.ai",
        ] {
            assert!(!api_host(host, "veyndo.ai"), "{host}");
        }
        for path in [
            "/health",
            "/store-api/product",
            "/api/workspaces",
            "/mcp",
            "/ucp/v1/carts",
            "/.well-known/ucp",
        ] {
            assert!(protocol_path(path), "{path}");
        }
        for path in [
            "/products/coat",
            "/checkout",
            "/assets/index.js",
            "/apiary/catalog",
            "/mcp/other",
        ] {
            assert!(!protocol_path(path), "{path}");
        }
    }
}
