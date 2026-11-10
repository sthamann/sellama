//! Inspect current, expiring native credentials for the one configured Knowledge catalog pilot.
use crate::*;
use axum::{Form, http::header::CACHE_CONTROL};

pub(super) const INTROSPECTION: &str = "/api/identity/knowledge/introspect";
const AUDIENCE: &str = "veyndo-knowledge";

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Inspect {
    token: String,
    resource: String,
    token_type_hint: Option<String>,
}

pub(super) async fn inspect(
    State(a): State<App>,
    headers: axum::http::HeaderMap,
    Form(form): Form<Inspect>,
) -> Result<impl IntoResponse> {
    let unavailable = || {
        Error(
            StatusCode::SERVICE_UNAVAILABLE,
            "Knowledge identity is not configured".into(),
        )
    };
    let tenant = env::var("KNOWLEDGE_IDENTITY_SHOP").map_err(|_| unavailable())?;
    validate_tenant(&tenant).map_err(|_| unavailable())?;
    let secret = env::var("KNOWLEDGE_INTROSPECTION_TOKEN")
        .ok()
        .filter(|value| {
            (32..=256).contains(&value.len()) && value.bytes().all(|byte| byte.is_ascii_graphic())
        })
        .ok_or_else(unavailable)?;
    let mut credentials = headers.get_all("authorization").iter();
    let credential = credentials
        .next()
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));
    if credentials.next().is_some()
        || !credential.is_some_and(|value| super::browser::equal(value, &secret))
    {
        return Err(Error(
            StatusCode::UNAUTHORIZED,
            "Invalid introspection credential".into(),
        ));
    }
    let claims = claims(&a, &tenant, form).await?;
    Ok(([(CACHE_CONTROL, "no-store")], Json(claims)))
}

async fn claims(a: &App, tenant: &str, form: Inspect) -> Result<Value> {
    let inactive = json!({"active":false});
    if form.resource != AUDIENCE
        || form
            .token_type_hint
            .as_deref()
            .is_some_and(|hint| hint != "access_token")
        || !form.token.starts_with("rac_")
        || form.token.len() > 256
        || !form.token.bytes().all(|byte| byte.is_ascii_graphic())
    {
        return Ok(inactive);
    }
    let mut h = RequestContext::new();
    h.insert(
        "x-tenant",
        tenant.parse().map_err(|_| bad("Invalid Knowledge shop"))?,
    );
    h.insert(
        "authorization",
        format!("Bearer {}", form.token)
            .parse()
            .map_err(|_| bad("Invalid access token"))?,
    );
    let expiry = match super::identity::resolve(
        a,
        &mut h,
        "/api/apps/knowledge_catalog/core/catalog_evidence",
        true,
    )
    .await
    {
        Ok(expiry) => expiry,
        Err(error) if matches!(error.0, StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN) => {
            return Ok(inactive);
        }
        Err(error) => return Err(error),
    };
    let Some(expiry) = expiry.filter(|expiry| *expiry > chrono::Utc::now().timestamp()) else {
        return Ok(inactive);
    };
    if h.principal.tenant.as_deref() != Some(tenant)
        || h.tenant_status.as_deref() != Some("active")
        || h.access
            .as_ref()
            .and_then(|access| access.parent.as_ref())
            .is_some()
        || h.principal.agent_key.is_some()
    {
        return Ok(inactive);
    }
    let scope = if h.principal.app.is_some() {
        match apps::admit_catalog_sync(a, &h, tenant).await {
            Ok(true) => "knowledge.catalog.sync",
            Ok(false) => return Ok(inactive),
            Err(error) if matches!(error.0, StatusCode::FORBIDDEN | StatusCode::NOT_FOUND) => {
                return Ok(inactive);
            }
            Err(error) => return Err(error),
        }
    } else if super::permit(&h, "catalog.read").is_ok()
        && super::permit(&h, "knowledge.read").is_ok()
    {
        "knowledge.products.read"
    } else {
        return Ok(inactive);
    };
    Ok(
        json!({"active":true,"sub":h.principal.user,"tenant":tenant,"aud":AUDIENCE,
              "exp":expiry,"scope":scope,"live":true}),
    )
}
