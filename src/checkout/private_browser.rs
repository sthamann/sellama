//! Relay only the browser's two Checkout session commands to a private service.
use super::buyer_identity;
use crate::*;
use axum::extract::DefaultBodyLimit;
use axum::http::header::CACHE_CONTROL;
use axum::response::Response;
use std::time::Duration;

const MAX_BODY: usize = 16 * 1024;

pub(super) struct Upstream {
    origin: reqwest::Url,
    http: reqwest::Client,
}

fn private_origin(value: &str, strict: bool) -> Option<reqwest::Url> {
    let url = reqwest::Url::parse(value).ok()?;
    let host = url.host_str()?;
    let internal_name =
        host != "localhost" && host.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'-');
    let loopback = !strict && matches!(host, "127.0.0.1" | "[::1]" | "localhost");
    (url.origin().ascii_serialization() == value
        && (url.scheme() == "https" || (url.scheme() == "http" && (internal_name || loopback))))
        .then_some(url)
}

impl Upstream {
    pub(super) fn configured() -> Option<Self> {
        let origin = private_origin(
            &env::var("CHECKOUT_PRIVATE_ORIGIN").ok()?,
            runtime_config::get().strict,
        )?;
        let http = reqwest::Client::builder()
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .connect_timeout(Duration::from_secs(3))
            .timeout(Duration::from_secs(20))
            .build()
            .ok()?;
        Some(Self { origin, http })
    }
}

pub(super) fn router() -> Router<App> {
    Router::new()
        .route("/store-api/checkout/independent/create", post(create))
        .route("/store-api/checkout/independent/confirm", post(confirm))
        .layer(DefaultBodyLimit::max(MAX_BODY))
}

async fn create(
    State(a): State<App>,
    h: RequestContext,
    Json(body): Json<Value>,
) -> Result<Response> {
    forward(&a, &h, body, None).await
}

async fn confirm(
    State(a): State<App>,
    h: RequestContext,
    Json(body): Json<Value>,
) -> Result<Response> {
    let cart = header(&h, "sw-context-token")
        .filter(|token| (16..=256).contains(&token.len()))
        .ok_or_else(|| bad("Cart capability required"))?;
    forward(&a, &h, body, Some(cart)).await
}

fn unavailable() -> Error {
    Error(
        StatusCode::SERVICE_UNAVAILABLE,
        "Checkout identity is not enabled".into(),
    )
}

async fn forward(a: &App, h: &RequestContext, body: Value, cart: Option<&str>) -> Result<Response> {
    let config = buyer_identity::config().ok_or_else(unavailable)?;
    let upstream = config.private_browser.as_ref().ok_or_else(unavailable)?;
    if h.principal.role.is_some() || h.principal.app.is_some() {
        return Err(Error(
            StatusCode::FORBIDDEN,
            "A live customer cart is required".into(),
        ));
    }
    let grant = buyer_identity::current_grant(a, h, config).await?;
    let path = if cart.is_some() {
        "/v1/sessions/confirm"
    } else {
        "/v1/sessions"
    };
    let mut target = upstream.origin.clone();
    target.set_path(path);
    let mut request = upstream.http.post(target).bearer_auth(&grant).json(&body);
    if let Some(cart) = cart {
        request = request
            .header("sw-context-token", cart)
            .header("x-customer-token", grant);
    }
    let failure = || {
        Error(
            StatusCode::SERVICE_UNAVAILABLE,
            if cart.is_some() {
                "Checkout confirmation could not be verified".into()
            } else {
                "Order failed".into()
            },
        )
    };
    let mut response = request.send().await.map_err(|_| failure())?;
    let status = response.status();
    if status == StatusCode::CONFLICT {
        return Err(conflict("Checkout changed; review your order again"));
    }
    if status.is_client_error() {
        return Err(Error(status, "Order failed".into()));
    }
    if status != StatusCode::OK {
        return Err(failure());
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| failure())? {
        if bytes.len() + chunk.len() > MAX_BODY {
            return Err(failure());
        }
        bytes.extend_from_slice(&chunk);
    }
    let value: Value = serde_json::from_slice(&bytes).map_err(|_| failure())?;
    Ok(([(CACHE_CONTROL, "no-store")], Json(value)).into_response())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn origin_is_exact_and_production_http_is_private() {
        assert!(private_origin("http://veyndo-checkout:8810", true).is_some());
        assert!(private_origin("https://checkout.internal.example", true).is_some());
        assert!(private_origin("http://127.0.0.1:8810", false).is_some());
        for invalid in [
            "http://127.0.0.1:8810",
            "http://localhost:8810",
            "http://checkout.example:8810",
            "http://veyndo-checkout:8810/path",
            "http://veyndo-checkout:8810?key=value",
            "https://user:pass@checkout.internal.example",
            "file:///etc/hosts",
        ] {
            assert!(private_origin(invalid, true).is_none(), "{invalid}");
        }
    }
}
