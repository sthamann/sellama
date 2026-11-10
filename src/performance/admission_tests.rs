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
#[test]
fn checkout_relay_leaves_capacity_for_native_callback() {
    let a = Admission {
        tenant_limit: 1,
        ..Admission::default()
    };
    let relay = class("/store-api/checkout/independent/confirm");
    assert_eq!(relay, CHECKOUT_RELAY);
    let _waiting_for_service = a.enter("one", relay).unwrap();
    assert!(a.enter("one", relay).is_none());
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
