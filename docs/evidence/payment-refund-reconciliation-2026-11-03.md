# External payment refund reconciliation, 3 November 2026

This accepts the affected native ledger path with local HTTP provider fixtures. It
does not establish an external PayPal or Shopware Payments test-account journey.

Both actual Rust services and isolated PostgreSQL verified a signed external
refund notification resolving its capture to the original order, one-cent partial
refund, duplicate delivery/reconciliation, a later native refund observed again
at the provider, exclusion of a failed hold and the exact remaining full refund.
The final state is refunded; another native refund is rejected before PSP traffic.
Forged signatures do not change the ledger.

The independent provider-neutral native fixture rejects wrong currency, negative
and excessive amounts, unknown native job identities, duplicate collections and
changed historical amounts. Rejected receipts roll back their claims and monetary
state. Repeating the same completed refund counts it once. Existing POS, payment
Flow, protected commands, old-version attempts and authorization/void cases pass.

Ten focused Core payment units and 15 private provider units pass, together with
format/lint, source ownership/inventory, localization and handbook/link checks.
The extracted refund-admission policy is reused; asynchronous SQL and provider
behavior remain reviewed unproved adapters. This does not add a new formal claim
about the whole payment system.

The hosted service was inspected without reading credential values: it uses
simulation, and the required partner and merchant configuration keys are absent.
The existing PayPal developer account requires user passkey authentication before
its actual test accounts can be inspected. No new credentials or bank transactions
were submitted. Express, vault/recurring, multiple capture, disputes, fees and
tracking retain the open checklist in the payment guide.
