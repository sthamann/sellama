//! Exchange a native buyer login for short-lived, Checkout-only authority.
use crate::*;
use axum::{Form, http::header::CACHE_CONTROL};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use ring::{
    aead,
    rand::{SecureRandom, SystemRandom},
};
use std::sync::OnceLock;

pub(crate) const INTROSPECTION: &str = "/api/identity/checkout/introspect";
const AUDIENCE: &str = "veyndo-checkout";
const PREFIX: &str = "checkout-v1_";
const MAX_TOKEN_LEN: usize = 256;
const TTL: i64 = 300;

struct Config {
    key: aead::LessSafeKey,
    credential: String,
    shops: Vec<String>,
    browser_origin: Option<String>,
}

fn config() -> Option<&'static Config> {
    static CONFIG: OnceLock<Option<Config>> = OnceLock::new();
    CONFIG
        .get_or_init(|| {
            let key = env::var("CHECKOUT_IDENTITY_KEY").ok()?;
            let credential = env::var("CHECKOUT_INTROSPECTION_TOKEN").ok()?;
            let shops = env::var("CHECKOUT_IDENTITY_SHOPS").ok()?;
            let shops: Vec<_> = shops.split(',').map(str::trim).map(str::to_owned).collect();
            if shops.iter().any(|t| validate_tenant(t).is_err())
                || !(32..=256).contains(&credential.len())
                || !credential.bytes().all(|b| b.is_ascii_graphic())
                || credential == key
            {
                return None;
            }
            let key = URL_SAFE_NO_PAD.decode(key).ok()?;
            let browser_origin = env::var("CHECKOUT_BROWSER_ORIGIN").ok().filter(|value| {
                reqwest::Url::parse(value).is_ok_and(|url| {
                    url.origin().ascii_serialization() == *value
                        && (url.scheme() == "https"
                            || !runtime_config::get().strict
                                && url.scheme() == "http"
                                && matches!(url.host_str(), Some("127.0.0.1" | "[::1]")))
                })
            });
            Some(Config {
                key: aead::LessSafeKey::new(aead::UnboundKey::new(&aead::AES_256_GCM, &key).ok()?),
                credential,
                shops,
                browser_origin,
            })
        })
        .as_ref()
}

pub(crate) fn browser_checkout_enabled(tenant: &str) -> bool {
    config()
        .is_some_and(|c| c.browser_origin.is_some() && c.shops.iter().any(|shop| shop == tenant))
}

pub(super) fn admitted_shop(tenant: &str) -> bool {
    config().is_some_and(|c| c.shops.iter().any(|shop| shop == tenant))
}

struct Grant {
    tenant: String,
    digest: String,
    buyer_hash: String,
    exp: i64,
}

fn now() -> i64 {
    chrono::Utc::now().timestamp()
}

fn unavailable() -> Error {
    Error(
        StatusCode::SERVICE_UNAVAILABLE,
        "Checkout identity is not enabled".into(),
    )
}

fn inactive() -> Error {
    Error(
        StatusCode::UNAUTHORIZED,
        "Checkout buyer access expired or unavailable".into(),
    )
}

fn seal(c: &Config, tenant: &str, session: &str, buyer: &str, exp: i64) -> Result<String> {
    let mut nonce = [0; 12];
    SystemRandom::new()
        .fill(&mut nonce)
        .map_err(|_| unavailable())?;
    // Compact encoding keeps the proof within the Checkout port's credential limit
    // even for the longest shop identifier and any existing customer ID.
    let mut body = exp.to_be_bytes().to_vec();
    body.extend_from_slice(&Sha256::digest(session.as_bytes()));
    body.extend_from_slice(&Sha256::digest(buyer.as_bytes()));
    body.extend_from_slice(tenant.as_bytes());
    c.key
        .seal_in_place_append_tag(
            aead::Nonce::assume_unique_for_key(nonce),
            aead::Aad::from(AUDIENCE),
            &mut body,
        )
        .map_err(|_| unavailable())?;
    Ok(format!(
        "{PREFIX}{}",
        URL_SAFE_NO_PAD.encode([nonce.as_slice(), &body].concat())
    ))
}

fn open(c: &Config, token: &str) -> Option<Grant> {
    if token.len() > MAX_TOKEN_LEN {
        return None;
    }
    let encoded = token.strip_prefix(PREFIX)?;
    let mut bytes = URL_SAFE_NO_PAD.decode(encoded).ok()?;
    let (nonce, body) = bytes.split_at_mut_checked(12)?;
    let data = c
        .key
        .open_in_place(
            aead::Nonce::try_assume_unique_for_key(nonce).ok()?,
            aead::Aad::from(AUDIENCE),
            body,
        )
        .ok()?;
    let (exp, data) = data.split_at_checked(8)?;
    let exp = i64::from_be_bytes(exp.try_into().ok()?);
    let (digest, data) = data.split_at_checked(32)?;
    let (buyer_hash, tenant) = data.split_at_checked(32)?;
    let tenant = std::str::from_utf8(tenant).ok()?;
    if exp <= now() || !c.shops.iter().any(|shop| shop == tenant) {
        return None;
    }
    let hex = |bytes: &[u8]| -> String { bytes.iter().map(|byte| format!("{byte:02x}")).collect() };
    Some(Grant {
        tenant: tenant.into(),
        digest: hex(digest),
        buyer_hash: hex(buyer_hash),
        exp,
    })
}

pub(super) async fn issue(State(a): State<App>, h: RequestContext) -> Result<impl IntoResponse> {
    let c = config().ok_or_else(unavailable)?;
    let tenant = tenant(&h)?;
    if !c.shops.contains(&tenant) {
        return Err(unavailable());
    }
    let session = header(&h, "x-customer-token").ok_or_else(inactive)?;
    let mut tx = a.db.begin().await?;
    if staging::parent_conn(&mut tx, &tenant).await?.is_some() {
        return Err(unavailable());
    }
    let buyer = b2b::identity(&mut tx, &h).await?;
    Ok((
        [(CACHE_CONTROL, "no-store")],
        Json(json!({
            "access_token":seal(c,&tenant,session,&buyer,now()+TTL)?,
            "token_type":"Bearer","expires_in":TTL,"audience":AUDIENCE,
            "checkout_origin":c.browser_origin,
        })),
    ))
}

#[derive(Deserialize)]
pub(super) struct Inspect {
    token: String,
    token_type_hint: Option<String>,
    resource: String,
}

pub(super) async fn inspect(
    State(a): State<App>,
    headers: axum::http::HeaderMap,
    Form(form): Form<Inspect>,
) -> Result<impl IntoResponse> {
    let c = config().ok_or_else(unavailable)?;
    let mut credentials = headers.get_all("authorization").iter();
    let credential = credentials
        .next()
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    if credentials.next().is_some()
        || !credential.is_some_and(|value| auth::browser::equal(value, &c.credential))
    {
        return Err(inactive());
    }
    let mut result = json!({"active":false});
    if form.resource == AUDIENCE
        && form
            .token_type_hint
            .as_deref()
            .is_none_or(|hint| hint == "access_token")
        && let Some(grant) = open(c, &form.token)
    {
        let buyer = veyndo::tenant_scope::scoped(
            veyndo::tenant_scope::Scope::Tenant(grant.tenant.clone()),
            sqlx::query_scalar::<_, String>("SELECT c.id FROM customer_sessions s JOIN customers c ON c.tenant=s.tenant AND c.email=s.email JOIN tenants t ON t.id=s.tenant WHERE s.tenant=$1 AND s.digest=$2 AND s.expires_at>now() AND c.active AND t.status='active' AND NOT EXISTS(SELECT 1 FROM shop_environments WHERE tenant=s.tenant)")
                .bind(&grant.tenant).bind(&grant.digest).fetch_optional(&a.db)
        ).await?;
        if let Some(buyer) = buyer.filter(|id| hash(id) == grant.buyer_hash) {
            result = json!({"active":true,"sub":buyer,"tenant":grant.tenant,"aud":AUDIENCE,
                "exp":grant.exp,"personal_session":true,"live":true,
                "scope":"checkout.sessions.read checkout.sessions.write checkout.purchase.confirm"});
        }
    }
    Ok(([(CACHE_CONTROL, "no-store")], Json(result)))
}

/// Only the three native Checkout service ports can consume a Checkout grant.
pub(super) fn bind(h: &mut RequestContext) -> Result<()> {
    if let Some(token) = header(h, "x-customer-token").filter(|s| s.starts_with(PREFIX)) {
        let grant = config().and_then(|c| open(c, token)).ok_or_else(inactive)?;
        if grant.tenant != tenant(h)? || h.principal.role.is_some() {
            return Err(inactive());
        }
        h.checkout_buyer = Some(crate::request_context::CheckoutBuyer {
            digest: grant.digest,
            buyer_hash: grant.buyer_hash,
        });
    }
    Ok(())
}
