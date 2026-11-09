//! Classify the opt-in Checkout test payment without introducing a second payment ledger.
use crate::{StoredCart, Value};

pub(crate) fn provider(method: &Value) -> Option<&'static str> {
    if method["mode"] != "app" {
        return None;
    }
    match method["id"].as_str()? {
        "paypal-sandbox" if method["provider"].is_null() => Some("paypal"),
        "shopware-payments-paypal"
            if method["provider"] == "shopware_payments"
                && method["providerMethod"] == "paypal" =>
        {
            Some("shopware_payments")
        }
        _ => None,
    }
}

pub(crate) fn test_environment(environment: &str) -> bool {
    environment == "sandbox"
        || (environment == "contract-fixture" && !crate::runtime_config::get().strict)
}

pub(super) fn attempt(payment: &Value) -> bool {
    provider(&payment["method"]).is_some_and(|provider| payment["provider"] == provider)
        && payment["environment"]
            .as_str()
            .is_some_and(test_environment)
        && payment["realMoneyCharged"] == false
        && payment["attemptId"]
            .as_str()
            .is_some_and(|id| !id.is_empty())
}

pub(crate) fn has_saved_funding(cart: &StoredCart) -> bool {
    cart.data
        .checkout
        .as_ref()
        .and_then(|selection| selection.payment_funding.as_ref())
        .is_some_and(|funding| funding.save || funding.id.is_some())
}
