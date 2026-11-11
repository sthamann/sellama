//! Compatibility and hostile-field cases for portable contact/address inputs; no authorization is inferred.
use super::*;
use serde_json::{Value, json};

fn address() -> Value {
    json!({"firstName":"  Demo ","lastName":" Buyer  ","street":"Example Street 1","zipcode":"12345","city":"Test City"})
}

#[test]
fn legacy_address_alias_defaults_and_normalization_keep_the_original_wire() {
    let mut input: Address = serde_json::from_value(address()).unwrap();
    input.validate().unwrap();
    assert_eq!(
        serde_json::to_value(input).unwrap(),
        json!({
            "name":"Demo Buyer","firstName":"  Demo ","lastName":" Buyer  ",
            "salutationId":"","title":"","company":"","department":"","vatId":"",
            "street":"Example Street 1","postalCode":"12345","city":"Test City","country":"DE",
            "countryStateId":"","additionalAddressLine1":"","additionalAddressLine2":"","phoneNumber":""
        })
    );
    let mut duplicate = address();
    duplicate["postalCode"] = json!("98765");
    assert!(serde_json::from_value::<Address>(duplicate).is_err());
}

#[test]
fn contact_defaults_and_nested_addresses_preserve_customer_editable_data() {
    let mut input: Contact = serde_json::from_value(
        json!({"name":"","firstName":"Demo","lastName":"Buyer","address":address()}),
    )
    .unwrap();
    input.validate().unwrap();
    let value = serde_json::to_value(input).unwrap();
    assert_eq!(value["name"], "Demo Buyer");
    assert_eq!(value["address"]["name"], "Demo Buyer");
    assert_eq!(value["vatIds"], json!([]));
    assert!(value["birthday"].is_null());
    assert!(value["defaultPaymentMethodId"].is_null());
    assert_eq!(value["phoneNumber"], "");
    assert_eq!(value.as_object().unwrap().len(), 11);
}

#[test]
fn identity_credentials_group_and_order_claims_are_not_contact_fields() {
    for field in [
        "tenant",
        "customerId",
        "customerGroup",
        "active",
        "password",
        "token",
        "orderId",
        "permissions",
    ] {
        let mut input = json!({"name":"Demo"});
        input[field] = json!("untrusted");
        assert!(serde_json::from_value::<Contact>(input).is_err(), "{field}");
        let mut nested = address();
        nested[field] = json!("untrusted");
        assert!(
            serde_json::from_value::<Address>(nested).is_err(),
            "{field}"
        );
    }
}

#[test]
fn original_byte_limits_control_rejection_and_calendar_checks_remain() {
    let mut long: Contact = serde_json::from_value(json!({"name":"é".repeat(51)})).unwrap();
    assert_eq!(
        long.validate().unwrap_err().to_string(),
        "Customer name required"
    );
    let mut input = address();
    input["street"] = json!("é".repeat(81));
    let mut long: Address = serde_json::from_value(input).unwrap();
    assert_eq!(
        long.validate().unwrap_err().to_string(),
        "Complete address fields required (maximum 160 characters)"
    );
    let mut control: Contact =
        serde_json::from_value(json!({"name":"Demo","company":"Bad\nCompany"})).unwrap();
    assert_eq!(
        control.validate().unwrap_err().to_string(),
        "Invalid customer contact field"
    );
    for date in ["1900-02-29", "2026-04-31", "not-a-date"] {
        let mut input: Contact =
            serde_json::from_value(json!({"name":"Demo","birthday":date})).unwrap();
        assert_eq!(
            input.validate().unwrap_err().to_string(),
            "Birthday requires a valid YYYY-MM-DD date"
        );
    }
}

#[test]
fn syntax_checks_leave_geography_and_payment_eligibility_to_the_host() {
    let mut source = address();
    source["country"] = json!("ZZ");
    let mut input: Address = serde_json::from_value(source.clone()).unwrap();
    input.validate().unwrap(); // Syntactic ISO shape does not configure a selling country.
    source["country"] = json!("zz");
    assert!(
        serde_json::from_value::<Address>(source)
            .unwrap()
            .validate()
            .is_err()
    );
    let mut input: Contact = serde_json::from_value(
        json!({"name":"Demo","defaultPaymentMethodId":"host-must-check-this"}),
    )
    .unwrap();
    input.validate().unwrap(); // A preference does not authorize that method or a payment.
}
