# Transaction details and payment history

Open **Transaction details & history** in an order’s payment section or payment
management. Members need `payments.read`. Authorizations, captures, refunds,
provider fees, platform fees and net received amounts appear alongside the shop’s
recorded payment transitions and operations. Expanding the section loads details;
**Refresh details** reads them again without issuing a financial command.

## One payment, two sources

The provider observation uses the original immutable account, order reference,
environment and adapter version. Contract 1.4.0 adds the optional `details`
capability to the Shopware Payments package. Historical versions still expose
the native history, even when provider inspection is unsupported or unavailable.
Fees are exact minor-unit amounts in their reported currency. An absent fee or
net amount remains absent; the interface never invents one.

The shop history comes from existing durable order history, projected to payment
state and recorded capture/refund totals. It is separate from current provider
observations. Reading neither reconciles the native ledger nor creates capture,
refund or reconciliation jobs. Native summary, history and jobs share one read
snapshot after the provider observation has completed. Results contain the latest
100 native transitions and 100 operations; they are not a complete accounting export.

## Rights and data boundaries

`GET /api/payments/{id}/details` and MCP `merchant.payment.details` use the same
native operation and current `payments.read` permission. An owned payment ID
never grants access to another shop. Payment inspection does not require or grant
customer PII access. Full order history retains its original order/PII rights.

The private Rust service verifies the stored invoice, original merchant payee,
currency and order reference before projecting a whitelist of receipt fields.
Payer information, card/bank fields, provider credentials and full order snapshots
are excluded. The Core validates the typed projection, dates, receipt identities,
currency precision, collection bounds and fee categories. Inspect requests omit
the customer/order payload otherwise needed to create a payment.

## Validation, 3 November 2026

Actual Core and private Rust services with isolated PostgreSQL and local provider
fixtures passed HTTP/MCP inspection, exact fees, denied foreign identities,
revoked read rights, payment-only history and unchanged ledger/job counts.
The explicit simulation also passed inspection and the concurrent 17-method
capture/refund/restart matrix with zero external provider requests. The shared UI
has targeted tests and desktop Chrome rendering checks using marked example data.
Mobile emulation could not be completed because the browser debugging connection
rejected its focus command; this is not mobile or external provider acceptance.
On 4 November, actual PayPal Sandbox captures and partial/full refunds passed for native and original Storyfront orders. Studio displayed the provider order/capture/refund identities and exact fees/net amounts. [Current screenshots and scope](shopware-payments-acceptance.md#actual-paypal-sandbox-purchases-and-refunds-4-november-2026).
