# Connectors

Connect order email, Slack notifications, analytics, search and other providers
through one Rust service. Use it directly from another application or connect it
to the existing Veyndo Flow Builder and app screens. Email, Gmail, Google
Analytics, Slack, Vercel, Klaviyo, HubSpot, Contentful and Algolia keep their own
adapters.

## Run it with Veyndo

The Core profile keeps migration 049 and the existing app gateway contract.
Build the binary from the private [Connector repository](https://github.com/veyndo/connectors)
with `cargo build --locked --bin connectors`, or build its root Dockerfile.
For a build from this repository, use the existing Compose connected-apps
profile. Keep the existing provider configuration and encryption key when
switching images. See [Rust services](rust-services.md#deployment-and-existing-data)
for database roles, configuration and recovery.

On 10 November 2026, Northflank switched the existing service to the
independent repository's root Dockerfile. Build `mint-meeting-7629`
(`fc36cad`) passed the service checks with one instance. Its retained Core
profile preserves the installed integrations and queue. The separate-database
configuration below has its own local integration test.

## Run it with a dedicated database

The [Connector repository](https://github.com/veyndo/connectors) contains the
container, SQL schema, action definitions and a JavaScript example. Use
`connectors --print-schema` as the migration owner to initialize an empty
PostgreSQL database, then run the service with `CONNECTOR_PROFILE=standalone`
and the restricted login. The operator registers a namespace and issues an
expiring credential with access to one app and explicit actions. The database
stores the credential's fingerprint. Every API and MCP request checks the
current grant.

Send an empty JSON object to `POST /api/v1/apps/email/actions/status` using
a bearer credential with the `status` grant. Connect an MCP client to
`POST /mcp`, or call `email.status` through the JavaScript SDK. Use a
separate credential with `send` to submit messages and keep the request key
stable when retrying the same request. Provider consent and configuration use
the scoped HTTP endpoints.

To attach this database to Veyndo, register its exact shop ID and configure
`CONNECTOR_CORE_BRIDGE_TOKEN` on the service and in Core's server-side
`APP_SERVICES` mapping. Route the bridge through the private network. Core
retains shop, sandbox and app permission checks. The connector checks the
registered namespace before executing the existing action.

## Operating the queue

Both profiles use the same encrypted job payloads, quotas, idempotency and
worker leases. A provider rejection can be retried according to policy. An
ambiguous result stays visible as `uncertain` for reconciliation. A provider
receipt records acceptance and can be matched with the provider's delivery
records.

## Verify the complete shop

Build both binaries and point the registered native mail journey to the
separate Connector. It exercises both its Core profile and a standalone
database with a restricted login. Use a disposable integration database and
the loopback SMTP fixture.

```sh
CONNECTORS_BINARY=/absolute/path/to/connectors \
  python3 scripts/verify_integration.py --container veyndo-postgres-1 \
    --only email_tests rust_connectors
```

The standalone journey commits an order while the app worker is stopped,
starts that worker, and replays checkout with the same key. It checks the
original order ID, one completed Flow and one SMTP receipt with its order
number. The shop's order transaction stays on Core. See [current hosted
status](status.md#connector-composition-and-public-response-times-9-november-2026)
for the image and measurement scope.

To include the private Checkout service, build it separately and use its
binary with the same disposable PostgreSQL instance and loopback mail server:

```sh
CONNECTORS_BINARY=/absolute/path/to/connectors \
CHECKOUT_TEST_BINARY=/absolute/path/to/veyndo-checkout-service \
  python3 scripts/email_tests.py Contracts.test_independent_checkout_and_connector_recover_order
```

The test discards the first confirmation body, restarts Checkout and
recovers the order through the same shop route. Core records one order and
one stock decrement. The separate app worker then executes the configured
Flow, and the independent Connector delivers one mail with the same order
number. Core exposes one invoice for that order. This run uses simulated
payment and a local SMTP recipient.

With the same two binary paths and a disposable PostgreSQL instance, run
`python3 scripts/email_tests.py Contracts.test_independent_checkout_capture_drives_invoice_mail_and_refund`
to verify the external payment path against the local Shopware Payments
fixture. The test restarts Checkout after discarding the first confirmation.
It checks that an unverified return leaves the payment ready and creates
neither an invoice nor a mail. After verified capture, one Flow processes
`payment.captured` with an invoice action followed by the mail action.
Core creates one invoice and Connector records the same
message ID that the SMTP fixture receives for the order. Repeating payment
reconciliation and the refund preserves the original order, payment and
invoice. The provider responses and SMTP recipient are local fixtures.

The [private Northflank rehearsal](evidence/composed-release-rehearsal-2026-11-10.md#run-five-separate-workloads-on-northflank)
also connected the original Connector image to the separate app worker and
Payments simulator. Its SMTP receiver confirmed the same Message-ID as the
Connector receipt. The test used a native purchase and a loopback inbox.
