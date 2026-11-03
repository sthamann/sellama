# Saved payment methods

Signed-in customers can choose to save a supported payment method for their next
purchase. Consent starts unchecked. After successful provider confirmation, the
method appears in the customer's account. A later checkout can select it without
copying payment credentials into Veyndo's storefront.

## Customer workflow

1. Sign in and select a payment method that supports saving.
2. Select **Save this payment method for future purchases** if desired.
3. Complete the provider's approval and the purchase. Saving can finish later
   than the payment itself.
4. On the next purchase, select the saved method. The provider can still require
   approval or authentication.
5. Open the customer account to revoke it. Revocation blocks future use in
   Veyndo immediately and queues private service cleanup. Completed orders,
   captures and refunds remain unchanged.

The Shopware Payments package **1.6.0** declares this contract for PayPal, card
and Venmo. Provider eligibility and the actual method's availability still apply.
This consent covers customer-present reuse. It does not authorize automatic
subscription charges or merchant-initiated recurring debits.

## Shared ownership and authorization

`payment_instruments` is one fixed native table for all shops and providers.
It contains opaque handles, redacted display metadata, original consent and the
customer/account/environment binding. No table is created for a customer or app.
Composite foreign keys and forced authenticated RLS retain shop isolation.

The private provider owns encrypted tokens in one fixed private table. They never
enter public API/MCP results, frontend state, Flow payloads or app packages.
Authenticated encryption binds a token to shop, provider account, customer,
method, environment and opaque handle. Browser account credentials remain required
when saving or reusing a method. A cart token, matching email, merchant permission
or another customer's session does not grant this authority.

The original payment attempt freezes consent and provider version. A queued create
rechecks revocation; an already submitted financial operation must still reconcile.
Delayed provider evidence uses the existing durable notification/payment jobs.
Invalid or unavailable optional saved-method metadata cannot undo a verified
capture. At most 32 active handles are admitted per native customer account.

## API, MCP and events

| Entry | Authority and behavior |
| --- | --- |
| `GET /store-api/account/payment-methods` | Current owning customer; redacted methods and installed capability discovery |
| `POST /store-api/account/payment-methods/{id}/revoke` | Same customer, opaque ID and stable `requestKey` |
| MCP `checkout.payment.methods` | Same native list and customer identity |
| MCP `checkout.payment.method.revoke` | Same native revoke, with `approve: true` |
| Checkout `paymentFunding` | Either `{save: true}` or `{save: false, id: "opaque-id"}`; validated again at purchase |
| `payment.instrument.revoked` | Existing outbox/Flow registry; only the opaque instrument ID |

The Store API payment status exposes `savedPaymentMethodStatus` separately from
financial state: pending, saved, failed or reused. Native OpenAPI, TypeScript and
WIT operation inputs are generated from the shared registry.
The checkout explains pending or failed saving beside the payment result, so a
problem saving a method does not look like a failed purchase.

## Deployment and acceptance

Apply Core migration **110** and private provider migrations **003/004** before
enabling 1.6.0. Reapply the private runtime grants. Configure an explicit private
`SWP_VAULT_KEY` as 64 random hexadecimal characters or 32 URL-safe base64-encoded
bytes. Preserve that key with private backups; replacing it alone does not rotate
existing ciphertext. Historical
1.0.0 through 1.5.0 attempts retain their original contracts.

The local acceptance uses actual Rust Core/provider processes and PostgreSQL,
with synthetic provider responses. It covers save, own-account repeat purchase,
HTTP/MCP projections, missing/foreign credentials, idempotent revocation, encrypted
storage, delayed confirmation and process restart without repeating capture.
The implementation is merged into main. Hosted migration/configuration and actual
PSP acceptance remain separate. The hosted simulation transport is also locally
accepted for PayPal/card save, repeat purchase, revocation and refund with zero
external provider calls.
[Exact local steps and UI captures](evidence/payment-saved-methods-2026-11-03.md).

Revocation removes permission to reuse the private handle. It does not claim that
the original token has been deleted at the PSP. Automated recurring payments,
subscription lifecycle and external method-by-method acceptance remain separate.

[Payment capture management](payment-capture-management.md) ·
[Invoice checkout](payment-invoice-checkout.md) ·
[Current acceptance](shopware-payments-acceptance.md).
