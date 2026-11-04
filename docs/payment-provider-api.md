# Payment providers · API 1

Payment apps declare their methods in the same versioned manifest edited in App Studio and produced by coding agents. The public core owns tenant/customer authorization, authoritative minor-unit invoices with explicit currency precision, immutable attempts, reservations, durable jobs, refund admission, verified receipts and order events. An isolated provider owns onboarding, provider-specific conversion, credentials and PSP calls. Shopware Payments implementations and partner attribution live exclusively in the private connector repository.

## Package and account lifecycle

Use `runtime: service`, `category: payment`, `permissions: [payments.provider]` and `paymentProvider: {apiVersion: "1", methods: [...]}`. Each method defines `id`, localized `name`, `currencies`, `countries`, `capabilities`, `intent` and `checkout`. Capabilities include capture, authorize, void, refund, multi_capture, vault and recurring. `vault` admits the shared customer-owned saved-method contract described below; `recurring` remains a declaration without a general subscription executor. A declaration never replaces the provider implementation or actual acceptance. Reserved core identities cannot register as external providers.

[The neutral example](../extensions/apps/payment-provider/manifest.json) runs against the local synthetic service in `scripts/payment_providers.py`. It does not implement Stripe or another PSP. A Stripe service can use the same boundary with its own real SDK and webhook verification; no core switch statement or Stripe secrets in the public frontend are required.

1. Install the immutable package through `POST /api/apps`. Its methods enter Settings inactive; installing a package cannot start collecting money.
2. Configure a private versioned service on the operator's server. Tenant and model input cannot choose its URL or credential.
3. App Studio → Payments chooses the business country, sales channel and test/live environment. `POST /api/payment-providers/{app}/onboarding` accepts `operation: start|status|disconnect`, channel, optional environment, country, approve and a bounded requestKey. Mutations require `payments.manage` and approval. The provider must echo exact provider/version/tenant/channel/environment identity, opaque accountRef, ready, status and enabled method IDs. Returned URLs require an operator-approved HTTPS origin. No arbitrary provider payload, credentials or company identity is forwarded to the merchant/model.
4. Activate ready methods in Settings → Payment methods. Checkout discovery hides disconnected/uninstalled methods. Readiness is rechecked transactionally at order creation. A channel-specific connection overrides the default, including an explicitly disconnected override. The account panel opens in the saved channel environment. Inspecting or disconnecting a different environment/account cannot replace the active binding; replacement requires an approved `start`.

`GET /api/payment-providers` lists installed contracts and this tenant's account bindings. Onboarding does not trust a browser-supplied merchant ID. A private service must establish that mapping from verified provider evidence.

## Operator configuration

Supply the following shape through a secret store as `PAYMENT_SERVICES`. Tokens below are placeholders; never commit real credentials:

```json
{
  "my_provider": {
    "1.0.0": {
      "defaultEnvironment": "sandbox",
      "sandbox": {
        "url": "https://payments.example.test",
        "token": "REPLACE_WITH_A_PRIVATE_SERVICE_CREDENTIAL",
        "environment": "sandbox",
        "approvalOrigins": ["https://payments.example.test", "https://approved-psp.example.test"]
      },
      "live": {
        "url": "https://payments.example.test",
        "token": "REPLACE_WITH_A_SEPARATE_PRIVATE_CREDENTIAL",
        "environment": "live",
        "approvalOrigins": ["https://payments.example.test", "https://approved-psp.example.test"]
      }
    }
  }
}
```

Retain old versions/environments until all attempts settle, expire, refund and finish their retention period. Existing flat version entries remain compatible. Changing a channel's current account does not rewrite previous attempts. HTTPS, exact environment, bounded bodies, a 15-second timeout, shared connections without redirects and tenant/provider concurrency limits apply. Explicit loopback HTTP is accepted only for `contract-fixture`. Private staging tenants cannot call external payment services.

## Provider RPC and receipt boundary

The core sends `POST /v1/onboarding` or `POST /v1/payments/execute` to the configured service with its bearer credential and derived `x-tenant`. Execute contains API/provider/adapter version, tenant, attemptId, orderId, immutable environment/accountRef/method/intent/capabilities/channel, amountMinor, currency, **currencyScale**, provider reference/capture ID, operation, stable requestKey, input, authoritative order snapshot and return/cancel URLs. Currency scale is stored on the attempt and repeated in its immutable provider context; `7123` with `KWD` and scale `3` means `7.123 KWD`, while `7123 JPY` with scale `0` means `7123 JPY`. Do not assume cents. Cart bearer tokens are removed. Operations are create, reconcile, capture, authorize, void, cancel, refund and checkout_session. Provider recovery must reuse request keys and inspect remote state after lost responses.

All financial replies echo the immutable identity and invoice plus a bounded provider reference. Provider-neutral states:

| State | Required evidence |
| --- | --- |
| ready / pending | Matching identity and reference; approved HTTPS URL if present |
| approved | `confirmed: true`; automatically queues the frozen intent |
| authorized | `confirmed: true`, exact authorizedAmountMinor, authorizationId and declared authorize capability |
| captured | `confirmed: true`, exact full settledAmountMinor and captureId, or the capture collection below |
| partially_captured | Confirmed authorized method with `multi_capture`, exact cumulative capture collection below the invoice total |
| voided / cancelled | Confirmed provider state; an existing authorization requires void evidence before releasing inventory |
| refunded | Confirmed exact `refund: {id, amountMinor, currency}` for the queued refund |
| refund_pending | Does not change the refund balance; retry the same operation and poll the original provider refund |

The core enforces global provider/environment/account receipt allocation, immutable capture IDs, serial bounded refund admission and once-only stock restoration. Unknown, mismatched or reused receipts cannot partially update the ledger. Lost or malformed results remain visible as uncertain jobs. A late verified capture after release is marked `captured_late` for review. Browser messages, redirects and general app responses never mark an order paid.

## Embedded checkout and subdomains

`GET /store-api/payments/{attempt}/session?parentOrigin=...` requires the owning cart context token. A parent must be the configured commerce origin or the tenant's owned shop/channel subdomain. The provider returns `uiUrl`, scoped sessionToken, matching nonce and expiresIn (maximum 600 seconds). UI and shop must have separate origins; the UI origin must be approved in operator configuration.

A provider can return `readySignal: true` and send `veyndo.payment.ready` after its controls render. The parent checks the same frame/origin/nonce and treats this only as presentation readiness. A 20-second loading timeout exposes a presentation-only reload; no new order or financial command is issued. Legacy providers use frame load. Explicit loopback HTTP UI is restricted to `contract-fixture` and approved origins.

The checkout iframe receives only the scoped token and nonce via an exact-origin message. Parent messages require the exact frame window, origin and nonce. `veyndo.payment.changed` requests server reconciliation; `veyndo.payment.redirect` may navigate only to the already server-approved URL. The private service independently validates the bound parent. An actual provider frontend can implement hosted card fields, wallets or additional fields without obtaining a commerce merchant token. Customer secrets remain with the provider.

## Admin, MCP, flows and events

Merchant HTTP and `merchant.payment` MCP enqueue the same jobs with `payments.manage`; read access uses `payments.read`. Order detail supports authorization capture/void and refunds. `merchant.payment.providers` and `merchant.payment.onboarding` share the account endpoints.

A private app action with handler `payment_command`, `payments.manage`, a payment contract and `flowAllowed: true` lets Flow Builder queue provider-bound commands. Input contains operation, requestKey, approve, optional amountMinor and either attemptId or the authoritative order event. Permission checks are repeated at execution. `payment_onboarding` is deliberately unavailable to flows. Visual/agent-generated payment apps include these shared declarations; actions cannot target another provider's attempts.

Core order/payment events contain the actual provider and environment. `payment.captured` is emitted only after verified ledger admission. Provider-specific webhook authentication belongs to the private service. It forwards a signed notification to `POST /store-api/payment-providers/{app}/webhooks` with x-tenant, x-payment-timestamp and HMAC-SHA256 x-payment-signature over `timestamp + '.' + raw JSON body`, using that version/environment's service credential. Matching notifications are deduplicated and only queue reconciliation; their payload is not settlement evidence.

## Evidence and limits

Real HTTP/PostgreSQL tests cover the neutral provider, existing native PayPal behavior, immutable upgrades, capture/refund/authorization/void, hostile onboarding identities/URLs, receipt reuse, signed callbacks, disconnected discovery, ownership and MCP/app actions. Frontend tests exercise agent/visual manifest round trips and forged iframe messages. A new extracted Lean policy proves the exact stock-release decision; SQL, async execution, provider code, SDKs, browser behavior and the transport remain outside that proof.

[Shopware Payments acceptance and remaining parity](shopware-payments-acceptance.md) are tracked separately. Private Shopware Payments tests additionally execute its Rust service with the public core, PayPal-shaped local wire responses, source-derived onboarding, hosted subdomain sessions, signed callback delivery, pending refund recovery and private process restart. These are **local synthetic contract tests**, not successful real PSP transactions. Merchant eligibility, partner credentials, wallet domain registration and observed Sandbox/Live outcomes are separate requirements. The public core now supports [multiple currencies](currencies.md), checks declared provider currency support, and exercises EUR/USD/JPY/KWD capture and refund with a local adapter fixture. Private provider support must be validated separately. General subscriptions/vaulting, multi-capture and every original provider management feature are not implied by this interface.

Installed payment apps expose the same account setup in Apps → app details. The account controls are shared with App Studio, including channel/environment selection, status refresh and confirmed disconnect. Only the visual editor changes a provider draft.

## Shared Shopware Payments service, version 1.2.0

The bundled `shopware_payments` package now contains the public, language-neutral
provider contract for PayPal, Apple Pay, Google Pay, Venmo, Pay Later, invoice,
SEPA, Bancontact, EPS, BLIK, iDEAL, MyBank, Przelewy24, card, Swish, Afterpay and
Klarna. The implementation, upstream source and partner attribution remain in
the separate private Rust service. Klarna declares authorization before capture. Checkout shows authorization as an
approved reservation rather than a captured payment or an endless loading state.
Other methods retain their declared capture flow and their country/currency rules.

Operators can configure `simulation` alongside `sandbox` and `live` in the existing
`PAYMENT_SERVICES` version map. Set `defaultEnvironment` to a configured entry;
startup rejects an unconfigured default. Hosted simulation requires HTTPS and a
private RPC credential, just like hosted provider modes. HTTP remains limited to
loopback `contract-fixture` tests. Migration 109 extends the existing account
constraint without rewriting historical accounts, receipts or attempts.

`GET /api/payment-providers` exposes configured environment names, their default,
owned channel IDs and existing account status under `payments.read`. It never
returns the service URL or token. The shared account panel uses this information,
including existing connections, without requiring unrelated automation access.
Account operations still require `payments.manage`; installing the package leaves
methods inactive until the merchant connects and enables them.

The immutable native order snapshot retains the resolved checkout language, so
the provider document follows the shop language instead of the browser default.

The private service's `SWP_MODE=simulation` uses the same authenticated RPC,
immutable invoice, hosted session, durable signed notification and native Core
ledger. Its page explicitly confirms or cancels a simulated payment without
collecting bank/card data. Approval and its notification are committed together;
server reconciliation alone establishes financial state. The mode rejects real
Sandbox/Live requests and performs no PSP network call. A service restart retains
simulated receipt and idempotency evidence in one fixed private table.

Local acceptance exercises all 17 methods with 12 concurrent callers, native
checkout/cancel/partial/full-refund paths, wrong tenant/nonce, replay, over-refund,
and service restart. The original provider-shaped fixture also retains USD/JPY,
SEPA mandate and historical version tests. These are simulation and contract
checks. Actual wallet SDKs, bank mandates and live provider access retain their
separate provider acceptance requirements.

## Provider-observed external refunds

A confirmed `captured` receipt can optionally include `refunds`, a bounded array of
completed refund records `{id, amountMinor, currency, requestKey?}`. Each record
belongs to the verified original invoice and provider order. Pending, failed and
denied refunds must not be included as refunded money. The native owner rejects
wrong currencies, nonpositive amounts, totals above the captured invoice, duplicate
IDs and changed historical receipt amounts. Repeated snapshots never reduce or
double-count previously admitted refunds.

`requestKey`, when present, must identify the original native refund job for this
same tenant, attempt and amount. This lets a refund first observed during
reconciliation later finish its native job without adding the amount a second
time. Unknown jobs and receipt ownership conflicts are rejected transactionally.
External refunds use the existing payment ledger, receipt claims, order state and
outbox; they do not create a new refund executor or grant any client authority.

## Partial and multiple captures

Methods can declare `multi_capture` together with `capture`, `authorize` and `void`.
The versioned payment setting `captureMode: capture|authorize` chooses the intent
for new attempts; absence inherits the provider declaration. The installed
contract is checked on settings save, publication, upgrade and checkout.

A confirmed settlement may include `captures`, at most 1000 unique records with
`id`, positive integer `amountMinor`, the original `currency`, and optional native
`requestKey`. `settledAmountMinor` equals the sum of this snapshot. Capture IDs
and amounts are immutable and cannot be shared between attempts. The merged
native total cannot exceed the original invoice. `captureClosed` closes the
remaining authorization. Partial/multiple settlement also requires the confirmed
original authorization ID and amount. Legacy single-capture receipts retain the
full-invoice rule.

`merchant.payment` and merchant HTTP accept optional `amountMinor` and
`finalCapture` for capture, and optional `captureId` for refund. Additional
captures require an explicit amount. More than one capture requires the refund's
capture ID. Provider refund entries carry that capture ID too. A returned
capture `requestKey` must name an owned native capture job with the exact amount;
one native job cannot acquire two capture IDs. Provider observations can complete
that original pending/uncertain job. Providers return `capturePending: true`
while a capture outcome is unresolved; the Core retains its reservation and
polls the original identity. No new request identity is generated on a retry.
Internal capture/refund allocation maps never travel back to the provider RPC.

Voiding a partially captured authorization returns its confirmed capture snapshot
with `captureClosed: true`. It must not report whole-order cancellation or release
sold stock. Public customer commands cannot override amount/finalCapture/captureId;
for an authorization intent, customer approval requests authorization rather than
merchant capture. [Merchant workflow](payment-capture-management.md).

## Read-only transaction inspection

A method may declare `details`. The native payment details operation issues
`inspect` through the original frozen service version/account. Its receipt keeps
the usual immutable invoice identity and adds a typed `details` object containing
reference/status/timestamps and bounded authorization/capture/refund entries.
Each entry has ID, status, exact minor amount, currency/scale, optional timestamps,
`finalCapture`, exact `fees` (`provider` or `platform`) and optional fee/net amounts.
Unknown fields and customer/card/bank data are rejected. This is an observation,
never a native settlement transition. No customer/order payload is sent for inspection.
See [transaction details](payment-transaction-details.md).

## Customer-owned saved instruments

A method declaring `vault` can receive native `funding` with stable customer and
consent identity, either explicit save consent or a previously admitted opaque
handle. The native Core requires the current owning customer session and freezes
the original account, method, environment and adapter version. It rechecks
revocation before dispatching a queued create.

After a verified successful financial observation, the provider may return
`vault: {reference, customerId, consentId, brand?, last4?}`. The reference must be
an opaque private-service handle, never the PSP token. Delayed evidence follows
ordinary signed reconciliation. Optional vault storage failure cannot roll back
the financial receipt. `vault_revoke` uses the same durable payment jobs and
returns the immutable receipt identity plus `vaultRevoked: true` and the matching
`vaultReference`; it cannot change the financial state.

HTTP/MCP/account controls, rollout and token ownership are described in
[saved payment methods](payment-saved-methods.md).

## Embedded payment loading

The provider frame stays visible with localized loading feedback. Until ready,
the parent repeats only the prebound token/nonce handshake to the fixed provider
origin. Source, origin and nonce checks remain in place. A timeout preserves the
order and offers retry plus the existing server-approved approval link in a new
tab. Returning, readiness messages and SDK callbacks trigger reconciliation; only
verified server evidence changes the financial state.
