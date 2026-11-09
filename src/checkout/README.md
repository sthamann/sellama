# Native Checkout host

Native and separately hosted Checkout use the same transaction in Commerce.
Preparation, lock and replay admission, pricing, and commit have their own Rust
stages. Checkout sessions can ask for a current quote, confirm a reviewed
purchase or read the original receipt. See the [Checkout component guide](../../docs/checkout-component.md).


`buyer_identity.rs` issues and introspects short-lived Checkout-only credentials
for admitted native buyer sessions. Only the native quote, order and receipt
ports can consume them. The original cart and order remain owned by Commerce.
