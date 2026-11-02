# Shopware Payments: integration and test acceptance

Updated 2 November 2026. The private Rust connector implements the provider path;
the public Core owns the order and payment ledger. The public catalogue now ships
the versioned 1.2.0 contract for all 17 methods. Install or upgrade it through the
existing app lifecycle, connect the configured account and enable its methods.
Installing the contract does not provision the private service or activate methods. Use [the provider contract](payment-provider-api.md) for deployment.

## What can be tested now

The existing private `tests/local_stack.py` starts the actual private Rust service,
public Rust Core and disposable PostgreSQL against a synthetic PayPal-shaped HTTP
server. This exercises financial state changes through the real services. The PSP
responses and merchant are synthetic; no external payment network is contacted.

| Journey | Current acceptance |
| --- | --- |
| Merchant onboarding, channel account and disconnect | Real services with simulated referral/account callbacks; disconnect survives a delayed callback |
| Purchase and immediate capture | Real Core/private-service order and signed callback, exact receipt and once-only capture |
| Authorization and void | Private provider lifecycle, including pending outcome rejection and repeated confirmed void |
| Partial, pending and full refund | Real native ledger; pending refund is polled by its original ID rather than submitted again |
| Currency | EUR, USD and zero-decimal JPY purchases and refunds; malformed precision and unsupported currencies denied before PSP traffic |
| Recovery | Private service restart and saved request replay; original EUR adapter 1.0.0 remains usable |
| Tenant, receipt and browser-session isolation | Foreign tenant/account/payee/amount/parent rejected; scoped token and nonce retained |
| SEPA form confirmation | Private endpoint validates the IBAN and explicit mandate consent before the original nested provider request |
| Native browser purchase | Actual Chrome desktop and 390px viewport: private SEPA form, confirmed payment, return and empty cart; simulated PSP only |
| Hosted simulation contract | All 17 methods with 12 concurrent callers, native cancellation, exact partial/full refunds and durable replay across restart; zero PSP traffic |
| Restricted service runtime | Separate migration bootstrap and non-owner runtime; owner runtime and runtime migration rejected |
| Shipped simulated form | Actual scoped session and confirmation endpoint, German shop language over English browser default, readiness nonce and no bank inputs; rendered Chrome remains a separate check |
| Public Shopware Payments checkout | Not accepted: no dedicated private Payments service was present in the inspected Northflank project |

The connector's 1.1.0 package widens PayPal/card currency declarations to its supported
currency list. It preserves the exact currency scale in new invoices and replay
fingerprints. PayPal's HUF and TWD whole-unit rule is checked without rounding an
invoice. Unsupported three-decimal currencies stay unavailable. Method declarations
still require account capabilities and method-specific country/amount admission.

## Embedded form loading

The native checkout waits visibly for the provider form. Providers can return
`readySignal: true` in their scoped session and send `veyndo.payment.ready` with the
bound nonce after rendering controls. Exact frame window, origin and nonce are
required. A readiness message never records payment or queues capture.

A form that does not respond within 20 seconds shows a translated recovery action.
Reloading requests a new presentation session for the same attempt; it does not
place another order or create another payment. Older providers retain their frame
load behavior. Session request failures also offer recovery. Explicit loopback HTTP
UI origins are permitted only for `contract-fixture` and must still appear in the
operator's approved origins; Sandbox and Live continue to require HTTPS.

## Observed native browser journey

Two local Chrome purchases used the actual private SEPA form: desktop order
`RAC-7e79c7d1` and order `RAC-15319777` at a 390 × 844 viewport. The browser
entered the synthetic account holder/IBAN, confirmed the test mandate and displayed
**Zahlung bestätigt** for EUR 12.50. Both returned to the collection and opened an
empty bag. The same two orders then passed a one-cent native merchant refund,
replay of that refund key and the exact EUR 12.49 remaining refund.

The initial iframe document was held by the browser controller after HTTP 200.
The visible timeout and **Zahlungsmaske erneut laden** recovered the form on both
viewports, without another order. These captures show local simulated provider
acceptance, not an external bank transaction or Storyfront acceptance.

![Local native payment confirmation with synthetic customer data](assets/payments-20261102/payment-confirmed.jpg)

![Empty native bag after returning from the confirmed payment](assets/payments-20261102/returned-empty-cart.jpg)

[Mobile private SEPA form](assets/payments-20261102/mobile-provider-form.jpg) ·
[Mobile form recovery](assets/payments-20261102/mobile-payment-recovery.jpg).

## Comparison with Shopware

The [official Shopware Payments guide](https://docs.shopware.com/en/shopware-6-en/shopware-services/shopware-payments)
describes account/channel setup, immediate/manual collection, payment methods,
transaction management, Flow actions, express checkout, Pay Later placement,
vaulting and wallet configuration. Matching the native ledger backbone is not a
claim of complete feature parity.

The remaining work is tracked explicitly:

- [ ] Deploy the private provider service with its own database access, HTTPS UI
  origin and native Core connection. Simulation needs no PSP credentials; provider
  Sandbox/Live additionally require approved partner configuration and callbacks.
- [ ] Connect an authorized Shopware Payments test account and complete browser
  payment, capture, void, cancellation and refunds against that account.
- [ ] Accept each enabled card/wallet/redirect method, including 3DS outcomes,
  country/currency eligibility and uncertain responses on that actual service.
- [ ] Provide merchant-facing manual collection and the original express/payment
  messaging controls through the existing versioned payment configuration.
- [ ] Complete vault/recurring lifecycle, multi-capture, externally initiated refund
  and dispute reconciliation, reporting/fees and shipment tracking.
- [ ] Repeat the Storyfront embedded purchase, return and empty original cart with
  the actual private provider; native simulated Storyfront acceptance is separate.

Shopware supplies a test account in its own integration. Access to the original
source does not supply the approved partner credentials for a standalone Veyndo
service. Apple Pay is not supported in that Shopware test account; its domain
registration uses an active production account. Real charges are outside this
acceptance: the selected payment mode remains simulated.

The [PayPal currency reference](https://developer.paypal.com/api/codes/currency/)
explains the whole-unit currencies. Additional merchant eligibility and currency
receiving preferences are applied by the provider, not inferred from a manifest.

## Repeating the local test

Build the public Core and private connector. Version 1.2.0 also provides
`SWP_SIMULATION_ONLY=true` for the hosted simulation cases, including execution of
the shipped checkout document with Node 22. Use a separate throwaway database for
each invocation.

For the original-shaped provider regression, In the private repository run
`COMMERCE_ROOT=/absolute/path/to/veyndo python3 tests/local_stack.py`. Supply a
throwaway `DATABASE_URL` or the test container and `DB_PORT`. Do not point the suite
at a merchant database. It removes its own automatically created database on exit.
`SWP_BROWSER_ACCEPTANCE=true` retains the isolated test processes for a browser
journey and writes only the local shop/provider URLs to `.run/browser-acceptance.json`.
Stopping it cleans up the isolated database.

See [checkout](checkout.md), [payment provider API](payment-provider-api.md),
[testing](testing.md) and [the current product status](status.md).
