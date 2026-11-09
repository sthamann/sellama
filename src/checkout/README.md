# Native Checkout host

Native and separately hosted Checkout use the same transaction in Commerce.
Preparation, lock and replay admission, pricing, and commit have their own Rust
stages. Checkout sessions can ask for a current quote, confirm a reviewed
purchase or read the original receipt. See the [Checkout component guide](../../docs/checkout-component.md).
