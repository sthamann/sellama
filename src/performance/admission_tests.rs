//! Regression checks for Core admission limits and the Checkout relay retry interval.
use super::*;
#[test]
fn saturated_tenant_does_not_block_another_or_leak_cancelled_permits() {
    let a = Admission {
        tenant_limit: 1,
        ai_limit: 1,
        ..Admission::default()
    };
    let first = a.enter("one", "ai").unwrap();
    assert!(a.enter("one", "api").is_none());
    assert!(a.enter("two", "checkout").is_some());
    drop(first);
    assert!(a.enter("one", "ai").is_some());
}
#[tokio::test]
async fn checkout_relay_leaves_capacity_for_native_callback() {
    let a = Admission {
        tenant_limit: 1,
        ..Admission::default()
    };
    let relay = class("/store-api/checkout/independent/confirm");
    assert_eq!(relay, CHECKOUT_RELAY);
    let _waiting_for_service = a.enter_relay("one").await.unwrap();
    let _service_callback = a.enter("one", "checkout").unwrap();
    assert!(a.enter("one", "api").is_none());
}

#[test]
fn checkout_relay_capacity_refusals_allow_earlier_retry() {
    for path in [
        "/store-api/checkout/independent/create",
        "/store-api/checkout/independent/confirm",
    ] {
        let response = overloaded(class(path), "Busy");
        assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
        assert_eq!(response.headers()["retry-after"], "1");
        assert_eq!(response.headers()["x-veyndo-checkout-admission"], "refused");
    }
    for path in ["/store-api/checkout/session-order", "/api/concierge"] {
        let response = overloaded(class(path), "Busy");
        assert_eq!(response.headers()["retry-after"], "5");
        assert!(
            !response
                .headers()
                .contains_key("x-veyndo-checkout-admission")
        );
    }
}

#[test]
fn latency_and_keys_have_bounded_cardinality() {
    let a = Admission::default();
    a.record("api", 25, false);
    a.record("api", 6000, true);
    assert_eq!(
        a.snapshot()["classes"][0]["buckets"],
        json!([0, 0, 1, 0, 0, 0, 0, 1])
    );
    assert_eq!(class("/store-api/checkout/order"), "checkout");
    assert_eq!(class("/api/agent/chat"), "ai");
    assert_eq!(class("/api/agent/chat/stream"), "ai");
    assert_eq!(class("/store-api/product/mug/questions"), "ai");
}

#[tokio::test]
async fn relay_waiters_are_bounded_and_drop_cleanly() {
    use std::task::{Context, Poll, Waker};

    let a = Admission {
        tenant_limit: 1,
        ..Admission::default()
    };
    let active = a.enter_relay("one").await.unwrap();
    let mut first = Box::pin(a.enter_relay("one"));
    let mut cancelled = Box::pin(a.enter_relay("one"));
    let mut context = Context::from_waker(Waker::noop());
    assert!(first.as_mut().poll(&mut context).is_pending());
    assert!(cancelled.as_mut().poll(&mut context).is_pending());
    assert_eq!(a.relay_waiters.available_permits(), 14);
    let mut overflow = Box::pin(a.enter_relay("one"));
    assert!(matches!(
        overflow.as_mut().poll(&mut context),
        Poll::Ready(None)
    ));
    let other = a.enter_relay("two").await.unwrap();
    assert!(a.enter("one", "checkout").is_some());
    drop(cancelled);
    drop(active);
    let next = first.await.unwrap();
    assert_eq!(a.relay_waiters.available_permits(), 16);
    drop((next, other));
    assert_eq!(a.relay.available_permits(), 8);
}

#[tokio::test]
async fn relay_process_waiters_release_tenant_slots_on_timeout() {
    use std::task::{Context, Poll, Waker};

    let a = Admission::default();
    let all_slots = a.relay.clone().try_acquire_many_owned(8).unwrap();
    let mut context = Context::from_waker(Waker::noop());
    let tenants: Vec<_> = (0..16).map(|id| format!("tenant-{id}")).collect();
    let mut waiting: Vec<_> = tenants
        .iter()
        .map(|tenant| Box::pin(a.enter_relay(tenant)))
        .collect();
    for waiter in &mut waiting {
        assert!(waiter.as_mut().poll(&mut context).is_pending());
    }
    let mut overflow = Box::pin(a.enter_relay("overflow"));
    assert!(matches!(
        overflow.as_mut().poll(&mut context),
        Poll::Ready(None)
    ));
    assert!(a.enter(&tenants[0], "checkout").is_some());
    assert!(waiting.pop().unwrap().await.is_none());
    assert_eq!(
        a.budget(&tenants[15], |budget| budget.relay.available_permits()),
        Some(4)
    );
    drop((waiting, all_slots));
    assert_eq!(a.relay_waiters.available_permits(), 16);
    assert_eq!(a.relay.available_permits(), 8);
}
