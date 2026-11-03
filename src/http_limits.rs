//! Bounded HTTP payloads and streaming responses for native settings and services.
use super::*;
pub(crate) const SETTINGS_BYTES: usize = 1024 * 1024;

pub(crate) async fn settings_errors(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let response = next.run(request).await;
    if response.status() == StatusCode::PAYLOAD_TOO_LARGE {
        return Error(
            StatusCode::PAYLOAD_TOO_LARGE,
            "Shop settings exceed the 1 MiB request limit. Reduce long descriptions or the number of configured entries.".into(),
        )
        .into_response();
    }
    response
}

pub(crate) async fn json_body(mut r: reqwest::Response) -> Result<Value> {
    let mut bytes = Vec::new();
    while let Some(chunk) = r
        .chunk()
        .await
        .map_err(|_| bad("Invalid remote response"))?
    {
        if bytes.len() + chunk.len() > 65536 {
            return Err(bad("Remote response exceeds limit"));
        }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| bad("Invalid remote JSON response"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn settings_transport_accepts_payment_catalogue_and_keeps_other_limits() {
        async fn accepted(Json(value): Json<Value>) -> Json<Value> {
            Json(json!({"count": value["paymentMethods"].as_array().unwrap().len()}))
        }
        let settings_path = "/settings";
        let ordinary_path = "/ordinary";
        let app = Router::new()
            .route(
                settings_path,
                post(accepted)
                    .layer(axum::extract::DefaultBodyLimit::max(SETTINGS_BYTES))
                    .layer(axum::middleware::from_fn(settings_errors)),
            )
            .route(ordinary_path, post(accepted))
            .layer(axum::extract::DefaultBodyLimit::max(64 * 1024));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let origin = format!("http://{}", listener.local_addr().unwrap());
        let server = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        let client = reqwest::Client::new();
        let payload = json!({"paymentMethods": (0..17).map(|i| json!({
            "id": format!("method-{i}"), "description": "demo".repeat(2000)
        })).collect::<Vec<_>>()});
        assert!(payload.to_string().len() > 64 * 1024);
        let result = client
            .post(format!("{origin}/settings"))
            .json(&payload)
            .send()
            .await
            .unwrap();
        assert_eq!(result.status(), StatusCode::OK);
        assert_eq!(result.json::<Value>().await.unwrap()["count"], 17);
        let ordinary = client
            .post(format!("{origin}/ordinary"))
            .json(&payload)
            .send()
            .await
            .unwrap();
        assert_eq!(ordinary.status(), StatusCode::PAYLOAD_TOO_LARGE);
        let oversized = json!({"paymentMethods": [], "description": "x".repeat(SETTINGS_BYTES)});
        let rejected = client
            .post(format!("{origin}/settings"))
            .json(&oversized)
            .send()
            .await
            .unwrap();
        assert_eq!(rejected.status(), StatusCode::PAYLOAD_TOO_LARGE);
        assert!(
            rejected.json::<Value>().await.unwrap()["errors"][0]["detail"]
                .as_str()
                .unwrap()
                .contains("1 MiB")
        );
        server.abort();
    }
}
