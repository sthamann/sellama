# Veyndo Commerce contracts

This Rust library contains product snapshots, typed carts, contact and address
inputs, money and calculation contracts used by the complete Veyndo shop. It
depends on Serde and the pure kernel. It has no database, HTTP server, model
provider or dependency on the product shell.

An external Rust adapter can parse and validate the same customer-editable input:

```rust
use veyndo_commerce::customer::Contact;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut input: Contact = serde_json::from_str(r#"{"name":"Demo Buyer"}"#)?;
    input.validate()?;
    Ok(())
}
```

Run `cargo run -p veyndo-commerce --example customer_contract` for a complete
synthetic contact and address example. Run `cargo test -p veyndo-commerce` for
wire compatibility, rejected identity fields and calculation regressions.

Contact and address data can be personal. Parsing or validating them grants no
permission to read, store or publish them. The native host keeps authentication,
PII projection, account ownership, current payment/country eligibility and
transactions. Contacts cannot carry an account ID, credential, price group or
order-ownership claim. Existing native validators still check the selected
country, region and payment method against the current shop configuration.

The [component plan](../../docs/commerce-components.md#core-modular-transactional-commerce)
tracks the remaining storage and service extraction. This package is currently
a crate in the product workspace, not a separately hosted Commerce service.
