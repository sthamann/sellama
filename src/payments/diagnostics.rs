//! Safe, provider-neutral operational hints. These never authorize a financial transition.
use crate::Value;

pub(crate) fn code(value: Option<&str>) -> Option<&'static str> {
    match value {
        Some("PAYMENT_SAVED_METHODS_UNAVAILABLE") => Some("PAYMENT_SAVED_METHODS_UNAVAILABLE"),
        Some("PAYMENT_METHOD_UNAVAILABLE") => Some("PAYMENT_METHOD_UNAVAILABLE"),
        Some("PAYMENT_PROVIDER_CONFIGURATION_REQUIRED") => {
            Some("PAYMENT_PROVIDER_CONFIGURATION_REQUIRED")
        }
        _ => None,
    }
}

pub(crate) fn response(value: &Value) -> &'static str {
    code(value["error"].as_str()).unwrap_or("Payment service rejected operation")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::json;
    #[test]
    fn diagnostics_accept_only_exact_public_codes() {
        assert_eq!(
            response(&json!({"error":"PAYMENT_SAVED_METHODS_UNAVAILABLE","details":"secret"})),
            "PAYMENT_SAVED_METHODS_UNAVAILABLE"
        );
        for v in [
            json!({"error":"private provider token"}),
            json!({"error":"PAYMENT_METHOD_UNAVAILABLE\nsecret"}),
            json!({"error":{"code":"PAYMENT_METHOD_UNAVAILABLE"}}),
            Value::Null,
        ] {
            assert_eq!(response(&v), "Payment service rejected operation");
        }
        assert_eq!(code(Some("SQL customer@example.test")), None);
    }
}
