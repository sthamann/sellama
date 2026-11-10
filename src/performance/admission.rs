//! Bounded instance/tenant concurrency, durable UTC-day AI quotas, and low-cardinality latency telemetry.
use crate::*;
use axum::{extract::Request, middleware::Next};
use std::{
    sync::{
        Mutex,
        atomic::{AtomicU64, Ordering},
    },
    time::{Duration, Instant},
};
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

#[path = "relay_admission.rs"]
mod relay_admission;
use relay_admission::{CONFIRM_PATH, RelayRejection, RelayRejections, confirmation_wait};

const CHECKOUT_RELAY: &str = "checkout-relay";

struct Budget {
    relay: Arc<Semaphore>,
    relay_waiters: Arc<Semaphore>,
    slots: Arc<Semaphore>,
    ai: Arc<Semaphore>,
    touched: Instant,
}
#[derive(Default)]
struct Metric {
    calls: u64,
    failures: u64,
    total_ms: u64,
    buckets: [u64; 8],
}
pub(crate) struct Admission {
    general: Arc<Semaphore>,
    checkout: Arc<Semaphore>,
    relay: Arc<Semaphore>,
    relay_waiters: Semaphore,
    relay_rejections: RelayRejections,
    relay_confirm_wait: Duration,
    tenants: Mutex<HashMap<String, Budget>>,
    metrics: Mutex<HashMap<&'static str, Metric>>,
    rejected: AtomicU64,
    tenant_limit: usize,
    ai_limit: usize,
    daily_ai: i64,
}
fn number(key: &str, default: usize, max: usize) -> usize {
    let n = env::var(key)
        .map(|v| v.parse::<usize>().expect("Invalid admission number"))
        .unwrap_or(default);
    assert!(n > 0 && n <= max, "Invalid {key}");
    n
}
impl Default for Admission {
    fn default() -> Self {
        Self {
            general: Arc::new(Semaphore::new(number("HTTP_CONCURRENCY", 128, 4096))),
            checkout: Arc::new(Semaphore::new(number("CHECKOUT_CONCURRENCY", 32, 1024))),
            relay: Arc::new(Semaphore::new(8)),
            relay_waiters: Semaphore::new(16),
            relay_rejections: RelayRejections::default(),
            relay_confirm_wait: confirmation_wait(),
            tenants: Mutex::new(HashMap::new()),
            metrics: Mutex::new(HashMap::new()),
            rejected: AtomicU64::new(0),
            tenant_limit: number("TENANT_CONCURRENCY", 16, 1024),
            ai_limit: number("TENANT_AI_CONCURRENCY", 2, 64),
            daily_ai: number("TENANT_AI_DAILY_QUOTA", 1000, 1_000_000) as i64,
        }
    }
}
impl Admission {
    fn budget<T>(&self, tenant: &str, read: impl FnOnce(&Budget) -> T) -> Option<T> {
        let mut tenants = self.tenants.lock().unwrap();
        if !tenants.contains_key(tenant) && tenants.len() >= 4096 {
            tenants.retain(|_, b| {
                b.touched.elapsed().as_secs() < 60
                    || b.slots.available_permits() != self.tenant_limit
                    || b.relay.available_permits() != self.relay_limit()
                    || b.relay_waiters.available_permits() != self.relay_waiter_limit()
            });
            if tenants.len() >= 4096 {
                return None;
            }
        }
        let budget = tenants.entry(tenant.into()).or_insert_with(|| Budget {
            relay: Arc::new(Semaphore::new(self.relay_limit())),
            relay_waiters: Arc::new(Semaphore::new(self.relay_waiter_limit())),
            slots: Arc::new(Semaphore::new(self.tenant_limit)),
            ai: Arc::new(Semaphore::new(self.ai_limit)),
            touched: Instant::now(),
        });
        budget.touched = Instant::now();
        Some(read(budget))
    }

    fn enter(&self, tenant: &str, class: &str) -> Option<Vec<OwnedSemaphorePermit>> {
        self.budget(tenant, |budget| {
            let process = if class == "checkout" {
                &self.checkout
            } else {
                &self.general
            };
            let mut permits = vec![
                process.clone().try_acquire_owned().ok()?,
                budget.slots.clone().try_acquire_owned().ok()?,
            ];
            if class == "ai" {
                permits.push(budget.ai.clone().try_acquire_owned().ok()?);
            }
            Some(permits)
        })?
    }
    fn record(&self, class: &'static str, elapsed: u64, failed: bool) {
        let mut metrics = self.metrics.lock().unwrap();
        let m = metrics.entry(class).or_default();
        m.calls = m.calls.saturating_add(1);
        m.failures += u64::from(failed);
        m.total_ms = m.total_ms.saturating_add(elapsed);
        let bucket = [5, 20, 50, 100, 250, 1000, 5000]
            .iter()
            .position(|limit| elapsed <= *limit)
            .unwrap_or(7);
        m.buckets[bucket] += 1;
    }
    pub(crate) fn snapshot(&self) -> Value {
        let metrics = self.metrics.lock().unwrap();
        let [local_capacity, local_timeout, cluster_capacity] = self.relay_rejections.snapshot();
        json!({"scope":"process + database leases","clusterTenantLimits":true,"tenantLimit":self.tenant_limit,"tenantAiLimit":self.ai_limit,
            "dailyAiQuotaDefault":self.daily_ai,"dailyQuotaScope":"database / UTC day",
            "generalAvailable":self.general.available_permits(),"checkoutAvailable":self.checkout.available_permits(),
            "checkoutRelayAvailable":self.relay.available_permits(),"tenantCheckoutRelayLimit":self.relay_limit(),
            "checkoutRelayWaitersAvailable":self.relay_waiters.available_permits(),
            "checkoutRelayConfirmWaitMs":self.relay_confirm_wait.as_millis(),
            "checkoutRelayRejections":{"localCapacity":local_capacity,"localTimeout":local_timeout,"clusterCapacity":cluster_capacity},
            "trackedTenants":self.tenants.lock().unwrap().len(),"rejected":self.rejected.load(Ordering::Relaxed),
            "latencyBucketUpperMs":[5,20,50,100,250,1000,5000,null],
            "classes":metrics.iter().map(|(name,m)|json!({"class":name,"calls":m.calls,"failures":m.failures,"totalMs":m.total_ms,"buckets":m.buckets})).collect::<Vec<_>>()})
    }
}
fn class(path: &str) -> &'static str {
    if path == "/api/concierge"
        || path == "/api/experience"
        || path.starts_with("/api/agent/")
            && ["/chat", "/chat/stream", "/plan"]
                .iter()
                .any(|s| path.ends_with(s))
        || path.ends_with("/ask")
        || path.ends_with("/questions")
    {
        "ai"
    } else if matches!(
        path,
        "/store-api/checkout/independent/create" | CONFIRM_PATH
    ) {
        CHECKOUT_RELAY
    } else if path.starts_with("/store-api/checkout/")
        || path.starts_with("/store-api/payments/")
        || path.starts_with("/ucp/")
    {
        "checkout"
    } else {
        "api"
    }
}
pub(crate) async fn run(a: &App, mut request: Request, next: Next) -> Response {
    let path = request.uri().path();
    if !(path.starts_with("/api/")
        || path.starts_with("/store-api/")
        || path == "/mcp"
        || path.starts_with("/ucp/"))
    {
        return next.run(request).await;
    }
    let stream_ai = path == "/api/concierge"
        && header(request.headers(), "accept").is_some_and(|value| {
            value
                .split(',')
                .any(|kind| kind.trim() == "text/event-stream")
        });
    let class = class(path);
    let context = RequestContext::from_request(&request);
    // An anonymous caller cannot allocate arbitrary tenant buckets with a forged header.
    let validated = context.validated_tenant;
    let tenant = if validated {
        match tenant(&context) {
            Ok(t) => t,
            Err(e) => return e.into_response(),
        }
    } else {
        "anonymous".into()
    };
    let permits = if class == CHECKOUT_RELAY {
        a.admission.enter_http_relay(path, &tenant).await
    } else {
        a.admission.enter(&tenant, class)
    };
    let Some(mut permits) = permits else {
        a.admission.rejected.fetch_add(1, Ordering::Relaxed);
        return overloaded(class, "Resource concurrency limit reached");
    };
    let cluster_lease = if validated {
        let (scope, limit) = if class == CHECKOUT_RELAY {
            (CHECKOUT_RELAY, a.admission.relay_limit())
        } else {
            ("requests", a.admission.tenant_limit)
        };
        match super::cluster_lease::Lease::acquire(a, &tenant, scope, limit).await {
            Ok(lease) => Some(lease),
            Err(e) if class == CHECKOUT_RELAY && e.0 == StatusCode::TOO_MANY_REQUESTS => {
                a.admission.rejected.fetch_add(1, Ordering::Relaxed);
                a.admission
                    .relay_rejections
                    .record(RelayRejection::ClusterCapacity);
                return overloaded(class, &e.1);
            }
            Err(e) => return e.into_response(),
        }
    } else {
        None
    };
    let ai_lease = if validated && class == "ai" {
        match super::cluster_lease::Lease::acquire(a, &tenant, "ai", a.admission.ai_limit).await {
            Ok(lease) => Some(lease),
            Err(e) => return e.into_response(),
        }
    } else {
        None
    };
    if class == "ai"
        && validated
        // Native durable planning reserves only when enqueue actually creates work, after its replay lookup.
        && !matches!(path, "/api/agent/chat" | "/api/agent/chat/stream" | "/api/agent/plan")
        && let Err(e) = reserve_ai_attempt(a, &tenant).await
    {
        return if e.0 == StatusCode::TOO_MANY_REQUESTS {
            overloaded(class, &e.1)
        } else {
            e.into_response()
        };
    }
    let _ai_lease = if stream_ai && let Some(permit) = permits.pop() {
        request
            .extensions_mut()
            .insert(super::AiStreamAdmission(Arc::new(Mutex::new(Some((
                permit, ai_lease,
            ))))));
        None
    } else {
        ai_lease
    };
    let start = Instant::now();
    let response =
        match tokio::time::timeout(std::time::Duration::from_secs(300), next.run(request)).await {
            Ok(r) => r,
            Err(_) => Error(
                StatusCode::GATEWAY_TIMEOUT,
                "Request exceeded its deadline. Check its job/order status before retrying.".into(),
            )
            .into_response(),
        };
    if class == CHECKOUT_RELAY
        && let Some(lease) = cluster_lease
    {
        lease.finish_relay().await;
    }
    a.admission.record(
        class,
        start.elapsed().as_millis().min(u64::MAX as u128) as u64,
        response.status().is_server_error(),
    );
    response
}
/// Shared interactive/background attempt quota; a failed provider call still counts.
/// This is not token/spend accounting. Staging shares its live tenant's UTC-day budget.
pub(crate) async fn reserve_ai_attempt(a: &App, tenant: &str) -> Result<()> {
    let mut tx = a.db.begin_privileged().await?;
    reserve_ai_attempt_tx(a, tenant, &mut tx).await?;
    tx.commit().await?;
    Ok(())
}
/// Native admission only: reuse the system transaction that persists the accepted work.
/// The explicit tenant resolves a sandbox's live budget; callers must admit the actor first.
pub(crate) async fn reserve_ai_attempt_tx(
    a: &App,
    tenant: &str,
    connection: &mut sqlx::PgConnection,
) -> Result<()> {
    let reserved = sqlx::query_scalar::<_, i64>("WITH owner AS (SELECT coalesce((SELECT live_tenant FROM shop_environments WHERE tenant=$1),$1) AS tenant), scope AS (SELECT tenant,coalesce((SELECT daily_ai FROM tenant_resource_limits l WHERE l.tenant=owner.tenant),$2) AS maximum FROM owner) INSERT INTO tenant_ai_usage(tenant,day,attempts) SELECT tenant,(now() AT TIME ZONE 'UTC')::date,1 FROM scope WHERE maximum>0 ON CONFLICT(tenant,day) DO UPDATE SET attempts=tenant_ai_usage.attempts+1 WHERE tenant_ai_usage.attempts < (SELECT maximum FROM scope) RETURNING attempts")
        .bind(tenant).bind(a.admission.daily_ai).fetch_optional(connection).await?;
    if reserved.is_none() {
        a.admission.rejected.fetch_add(1, Ordering::Relaxed);
        return Err(Error(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily AI request quota reached".into(),
        ));
    }
    Ok(())
}
fn overloaded(class: &str, message: &str) -> Response {
    let mut response = Error(StatusCode::TOO_MANY_REQUESTS, message.into()).into_response();
    // These refusals occur before dispatch to Checkout. Its relay slots are
    // released when the request ends, so a short retry preserves the limits.
    let delay = if class == CHECKOUT_RELAY { "1" } else { "5" };
    response
        .headers_mut()
        .insert("retry-after", axum::http::HeaderValue::from_static(delay));
    if class == CHECKOUT_RELAY {
        response.headers_mut().insert(
            "x-veyndo-checkout-admission",
            axum::http::HeaderValue::from_static("refused"),
        );
    }
    response
}

#[cfg(test)]
#[path = "admission_tests.rs"]
mod tests;
