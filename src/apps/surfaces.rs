//! App-owned UI surfaces and namespaced HTTP routes reuse the authorized action gateway.
use super::*;
use axum::extract::{OriginalUri, Query};
pub(crate) fn router() -> Router<App> {
    Router::new()
        .secure_route(
            "/api/apps/surfaces",
            &[("GET", "catalog.read")],
            get(admin_surfaces),
        )
        .route("/store-api/apps/surfaces", get(public_surfaces))
        .secure_route(
            "/api/apps/{id}/http/{route}",
            &[("GET", "read"), ("POST", "read")],
            get(read_route).post(write_route),
        )
        .route(
            "/store-api/apps/{id}/http/{route}",
            get(read_route).post(write_route),
        )
        .layer(axum::middleware::from_fn(no_store))
}
async fn no_store(request: axum::extract::Request, next: axum::middleware::Next) -> Response {
    let mut response = next.run(request).await;
    response.headers_mut().insert(
        "cache-control",
        axum::http::HeaderValue::from_static("no-store"),
    );
    response
}
pub(crate) fn readonly(action: &Action) -> bool {
    verified_kernel::app_read_admissible(
        action.read_only || ["list", "configurations"].contains(&action.handler.as_str()),
        ["save", "emit", "submit"].contains(&action.handler.as_str()),
    )
}
struct SurfacePolicy<'a>(&'a Manifest);
impl veyndo_app_model::surfaces::Policy for SurfacePolicy<'_> {
    fn native_view(&self, surface: &Surface) -> bool {
        native_views::is_native(self.0, surface)
    }
    fn assistant_view(&self, surface: &Surface) -> Option<&veyndo_app_model::views::NativeView> {
        self.0
            .views
            .iter()
            .find(|view| surface.ui_path == format!("native/{}", view.id))
    }
    fn known_scope(&self, scope: &str) -> bool {
        auth::SCOPES.contains(&scope)
    }
    fn readonly(&self, action: &Action) -> bool {
        readonly(action)
    }
}
pub(crate) fn validate_contract(m: &Manifest) -> Result<()> {
    let contract = veyndo_app_model::surfaces::Contract {
        runtime: &m.runtime,
        permissions: &m.permissions,
        actions: &m.actions,
        surfaces: &m.surfaces,
        api_routes: &m.api_routes,
    };
    veyndo_app_model::surfaces::validate(&contract, &SurfacePolicy(m))
        .map_err(model_contract::error)?;
    veyndo_app_model::intelligence::validate(m.intelligence.as_ref(), &m.actions, &m.entities)
        .map_err(model_contract::error)?;
    Ok(())
}
pub(super) fn surface_url(id: &str, path: &str) -> Option<String> {
    let mut url = reqwest::Url::parse(&gateway::ui_url(id)?).ok()?;
    let base = url.path().trim_end_matches('/');
    let next = format!("{base}/{path}");
    url.set_path(&next);
    url.set_query(None);
    url.set_fragment(None);
    Some(url.to_string())
}
pub(crate) use super::surface_registry::registry;
async fn admin_surfaces(State(a): State<App>, h: RequestContext) -> Result<Json<Value>> {
    Ok(Json(registry(&a, &h, false).await?))
}
async fn public_surfaces(State(a): State<App>, h: RequestContext) -> Result<Json<Value>> {
    Ok(Json(registry(&a, &h, true).await?))
}
async fn dispatch(
    a: &App,
    h: &RequestContext,
    id: &str,
    route: &str,
    method: &str,
    public: bool,
    v: &Value,
) -> Result<Value> {
    let m = package(a, &tenant(h)?, id, true).await?;
    let scope = if public { "storefront" } else { "admin" };
    let route = m
        .api_routes
        .iter()
        .find(|r| r.path == route && r.method == method && r.scope == scope)
        .ok_or(Error(
            StatusCode::NOT_FOUND,
            "App route not registered".into(),
        ))?;
    let action = m
        .actions
        .iter()
        .find(|a| a.name == route.action)
        .ok_or(bad("Unknown app action"))?;
    if method == "GET" && !readonly(action) {
        return Err(bad("Read-only app route required"));
    }
    invoke_app(a, h, id, &route.action, v).await
}
async fn read_route(
    State(a): State<App>,
    h: RequestContext,
    OriginalUri(uri): OriginalUri,
    Path((id, route)): Path<(String, String)>,
    Query(query): Query<HashMap<String, String>>,
) -> Result<Json<Value>> {
    let m = package(&a, &tenant(&h)?, &id, true).await?;
    let scope = if uri.path().starts_with("/store-api/") {
        "storefront"
    } else {
        "admin"
    };
    let r = m
        .api_routes
        .iter()
        .find(|r| r.path == route && r.method == "GET" && r.scope == scope)
        .ok_or(Error(
            StatusCode::NOT_FOUND,
            "App route not registered".into(),
        ))?;
    let action = m
        .actions
        .iter()
        .find(|a| a.name == r.action)
        .ok_or(bad("Unknown app action"))?;
    let mut input = serde_json::Map::new();
    for (key, value) in query {
        let v = if action.input_schema["properties"][&key]["type"] == "string" {
            json!(value)
        } else {
            serde_json::from_str(&value).map_err(|_| bad("Invalid typed query argument"))?
        };
        input.insert(key, v);
    }
    Ok(Json(
        dispatch(
            &a,
            &h,
            &id,
            &route,
            "GET",
            scope == "storefront",
            &Value::Object(input),
        )
        .await?,
    ))
}
async fn write_route(
    State(a): State<App>,
    h: RequestContext,
    OriginalUri(uri): OriginalUri,
    Path((id, route)): Path<(String, String)>,
    Json(v): Json<Value>,
) -> Result<Json<Value>> {
    Ok(Json(
        dispatch(
            &a,
            &h,
            &id,
            &route,
            "POST",
            uri.path().starts_with("/store-api/"),
            &v,
        )
        .await?,
    ))
}

#[cfg(test)]
mod policy_tests {
    use super::*;
    #[test]
    fn native_surface_policy_retains_verified_effect_guards() {
        let m: Manifest = serde_json::from_str(include_str!(
            "../../extensions/apps/care-studio/manifest.json"
        ))
        .unwrap();
        let mut action: Action = serde_json::from_value(json!({"name":"effect","description":"Effect","handler":"save","readOnly":true,"inputSchema":{"type":"object"}})).unwrap();
        let policy = SurfacePolicy(&m);
        for handler in ["save", "emit", "submit"] {
            action.handler = handler.into();
            assert!(!veyndo_app_model::surfaces::Policy::readonly(
                &policy, &action
            ));
        }
        action.read_only = false;
        for handler in ["list", "configurations"] {
            action.handler = handler.into();
            assert!(veyndo_app_model::surfaces::Policy::readonly(
                &policy, &action
            ));
        }
    }
}
