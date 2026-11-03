//! Transaction observations reject untyped and foreign evidence without touching payment state.
use super::*;
use crate::json;
fn attempt() -> Attempt {
    Attempt {
        id: "a".into(),
        provider: "example".into(),
        context: json!({}),
        tenant: "shop".into(),
        order: "o".into(),
        amount: 1000,
        currency: "EUR".into(),
        currency_scale: 2,
        state: "captured".into(),
        provider_order: Some("ORDER".into()),
        capture: Some("CAP".into()),
        refunded: 0,
        adapter_version: "1.4.0".into(),
        environment: "sandbox".into(),
        bn_code: "".into(),
    }
}
fn details() -> crate::Value {
    json!({"reference":"ORDER","status":"COMPLETED","createdAt":"2026-11-03T09:00:00Z","captures":[{"id":"CAP","status":"COMPLETED","amountMinor":1000,"currency":"EUR","currencyScale":2,"fees":[{"kind":"provider","amount":{"amountMinor":29,"currency":"EUR","currencyScale":2}}],"net":{"amountMinor":971,"currency":"EUR","currencyScale":2}}],"authorizations":[],"refunds":[]})
}
fn valid(v: crate::Value) -> bool {
    serde_json::from_value::<Details>(v).is_ok_and(|d| d.validate(&attempt()).is_ok())
}
#[test]
fn exact_typed_fee_projection_and_foreign_identity() {
    assert!(valid(details()));
    for (field, value) in [
        ("reference", json!("OTHER")),
        ("status", json!("private@example.test")),
        ("createdAt", json!("yesterday")),
    ] {
        let mut v = details();
        v[field] = value;
        assert!(!valid(v), "{field}");
    }
    for (field, value) in [
        ("currency", json!("USD")),
        ("currencyScale", json!(0)),
        ("amountMinor", json!(1001)),
        ("amountMinor", json!(-1)),
        ("id", json!("../other")),
        ("updatedAt", json!("email@example.test")),
    ] {
        let mut v = details();
        v["captures"][0][field] = value;
        assert!(!valid(v), "{field}");
    }
}
#[test]
fn pii_extra_fields_duplicate_entries_and_malformed_fees_are_rejected() {
    let mut v = details();
    v["payer"] = json!({"email":"private@example.test"});
    assert!(!valid(v));
    let mut v = details();
    v["captures"][0]["card"] = json!({"number":"sensitive"});
    assert!(!valid(v));
    let mut v = details();
    v["captures"] = json!([v["captures"][0].clone(), v["captures"][0].clone()]);
    assert!(!valid(v));
    for (field, value) in [
        ("kind", json!("unknown")),
        (
            "amount",
            json!({"amountMinor":-1,"currency":"EUR","currencyScale":2}),
        ),
        (
            "amount",
            json!({"amountMinor":1,"currency":"EUR","currencyScale":0}),
        ),
    ] {
        let mut v = details();
        v["captures"][0]["fees"][0][field] = value;
        assert!(!valid(v), "{field}");
    }
}
