//! Typed MCP schemas and JSON-RPC transport.
use crate::*;
mod protocol;
mod transport;
use protocol::RpcError;
pub(crate) async fn mcp(State(a): State<App>, h: RequestContext, Json(v): Json<Value>) -> Response {
    if let Some(origin) = header(&h, "origin") {
        // Trust only explicit deployment configuration, never Host or forwarded headers.
        let public = env::var("COMMERCE_PUBLIC_ORIGIN").ok().and_then(|v| {
            reqwest::Url::parse(&v)
                .ok()
                .filter(|u| {
                    u.scheme() == "https"
                        && u.username().is_empty()
                        && u.password().is_none()
                        && u.path() == "/"
                        && u.query().is_none()
                        && u.fragment().is_none()
                })
                .map(|u| u.origin().ascii_serialization())
        });
        let bind = env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:8787".into());
        let local = bind
            .parse::<std::net::SocketAddr>()
            .ok()
            .filter(|b| b.ip().is_loopback());
        let loopback = local.is_some_and(|b| {
            origin == format!("http://{}", b) || origin == format!("http://localhost:{}", b.port())
        });
        if public.as_deref() != Some(origin) && !loopback {
            return Error(StatusCode::FORBIDDEN, "Origin rejected".into()).into_response();
        }
    }
    let (id, method) = match protocol::envelope(&v) {
        Ok(request) => request,
        Err(error) => return Json(error.response(Value::Null)).into_response(),
    };
    if v.get("id").is_none() {
        return StatusCode::ACCEPTED.into_response();
    }
    let result = match method {
        "initialize" => {
            let mut capabilities = json!({"tools":{},"resources":{}});
            if v["params"]["capabilities"]["extensions"][apps::mcp_views::EXTENSION]["mimeTypes"]
                .as_array()
                .is_some_and(|types| types.iter().any(|mime| mime == apps::mcp_views::MIME))
            {
                capabilities["extensions"] = json!({apps::mcp_views::EXTENSION:{}});
            }
            Ok(json!({"protocolVersion":if v["params"]["protocolVersion"]=="2025-11-25"{"2025-11-25"}else{"2026-07-28"},"capabilities":capabilities,"serverInfo":{"name":"veyndo","version":env!("CARGO_PKG_VERSION")}}))
        }
        "ping" => Ok(json!({})),
        "tools/list" => {
            let mut tools = OPERATIONS
                .iter()
                .filter(|operation| operation.admitted(&a, &h))
                .map(|operation| operation.tool())
                .collect::<Vec<_>>();
            match apps::app_tools(&a, &h).await {
                Ok(apps) => {
                    tools.extend(apps);
                    Ok(json!({"tools":tools}))
                }
                Err(e) => Err(RpcError::server(e)),
            }
        }
        "tools/call" => protocol::call(&a, &h, &v["params"]).await,
        "resources/list" => apps::mcp_views::list(&a, &h)
            .await
            .map(|mut resources| {
                resources.insert(0, json!({"uri":"commerce://capabilities","name":"Commerce capabilities","mimeType":"application/json"}));
                json!({"resources":resources})
            })
            .map_err(RpcError::server),
        "resources/read" if v["params"]["uri"] == "commerce://capabilities" => Ok(
            json!({"contents":[{"uri":"commerce://capabilities","mimeType":"application/json","text":json!({"capabilities": OPERATIONS.iter().map(|operation|operation.description()).collect::<Vec<_>>()}).to_string()}]}),
        ),
        "resources/read" => match v["params"]["uri"].as_str() {
            Some(uri) => apps::mcp_views::read(&a, &h, uri).await
                .map_err(RpcError::server)
                .and_then(|resource| resource
                    .map(|content| json!({"contents":[content]}))
                    .ok_or_else(|| RpcError::invalid("Resource not found"))),
            None => Err(RpcError::invalid("Resource not found")),
        },
        _ => Err(RpcError::method()),
    };
    Json(match result {
        Ok(r) => json!({"jsonrpc":"2.0","id":id,"result":r}),
        Err(e) => e.response(id),
    })
    .into_response()
}
