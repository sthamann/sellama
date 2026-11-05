# Versioned marketplace host exchange, 5 November 2026

This extends the [source extraction](marketplace-component-2026-11-05.md) with
usable independent host ports and the complete current action surface.
The composed source is Marketplace commit
`f653e89ef49c8af34b3f21d9c8c18d4ee8efa66f`, released as
[0.2.0](https://github.com/veyndo/marketplaces/releases/tag/v0.2.0).
[Component CI](https://github.com/veyndo/marketplaces/actions/runs/42037264403)
passed the actual container build and runtime smoke as well as Rust/SDK checks.
[SDK CI](https://github.com/veyndo/sdk/actions/runs/42036574102) passed Node 22/24.

## Implementation

- The canonical `extensions/sdk/host-exchange-v1.json` covers record actions,
  channel/product projection, exact paid-order intake, job enqueue, claim and
  progress. A source check compares order, line, amount and address fields with
  native Rust DTOs. Domain admission remains native and server authoritative.
- [SDK 0.2.0](https://github.com/veyndo/sdk/releases/tag/v0.2.0) exports generated
  TypeScript inputs, closed operation names and `createHostClient`. The exact
  canonical source is recorded in `HOST-PROVENANCE.json` and rechecked by CI.
- A server client configures tenant, private token, application and fixed host
  path. Requests send contract version 1. There are no automatic write retries.
- Marketplace tenants can configure a fixed `hostPath`; the default existing
  Veyndo URL is preserved. Paths cannot change origin, traverse or carry queries.
- All declared record list/save actions and synchronization work over the same
  independent HTTP/MCP dispatch. Schemas come from the existing manifest. The
  service sync adapter adds an explicit `requestKey`; installed native schemas
  and the existing merchant UI remain compatible.
- The native `job_enqueue` callback accepts only a declared job action and uses
  the existing app action gateway. It preserves the authenticated principal and
  rechecks jobs.write, action/additional permissions, package, schema, live-only
  admission, quotas, idempotency and atomic job/outbox persistence. The admitted
  manifest/action is held through enqueue, so a concurrent package replacement
  cannot reclassify the callback as a service invocation. Native actions and this
  callback share `action_admission.rs`.

## Observed checks

| Path | Actual result |
| --- | --- |
| SDK Node 22/24 | Ten wire tests, generated contract/provenance checks and negative TypeScript inputs pass. Unknown operations, unsafe paths and uncertain write responses are tested. |
| Marketplace independent binary | Eight Rust tests pass. Actual HTTP/MCP/SDK integration uses a non-Veyndo `/commerce/v1/` host without Core or PostgreSQL. Record actions, sync replay/conflict, stale CAS, auth/tenant admission, fifth language and exact money pass. |
| Published package consumer | SDK 0.2.0 installed from its release archive; provider prepare and independent host channel examples execute successfully. |
| Native Core/PostgreSQL | Freshly compiled Core and provider binaries. Direct HTTP and MCP sync return one native job on replay. Changed content under the same key conflicts. |
| Negative authority | Missing job capability, missing additional PII permission, revoked callback key, foreign tenant, non-job target, invalid job input and explicit version 2 are rejected. Denied attempts add no jobs. |
| Registered tenant isolation | 43 checks pass against actual PostgreSQL: API/MCP/UCP and object boundaries, unchanged victim state, scoped foreign keys, revoked keys and app RLS under a restricted role. The serving Core fixture used its local owner login; this is not a new strict Core runtime-role rollout. |
| Existing marketplace effects | Amazon/eBay/Kaufland fixture synchronization, native paid order, exact tax/money, guest snapshot, concurrent replay, one stock decrement, order event/Flow, invoice/PDF and service restart pass. |
| Localization/stock regression | One translation query for 1/20/24 lines; short/fifth locale, variant inheritance, foreign names, immutable replay and atomic concurrent stock pass. |

The tests use local synthetic seller APIs, not live marketplace accounts. The
connected fixture uses the existing native durable host and actual isolated
PostgreSQL. The independent fixture host remains a bounded in-memory test adapter.

## Remaining extraction

MKT-02 is complete for the current mapping, record, sync, review and paid-order
surface. MKT-03 remains open: a separately maintained durable host implementation
must be extracted from the existing app storage/jobs owner and accepted without
creating a copied commerce ledger or parallel queue. Separate Studio packaging,
refund depth and complete composed browser acceptance remain MKT-04/MKT-05.

Deploy the updated Core host callback before enabling direct service sync in
Marketplace 0.2.0. Existing native merchant sync continues to use its original job
path during a rolling update; callback credentials keep their installed digest
and existing grants because the app manifest is unchanged.

The direct service and host clients use trusted server credentials. End users and
agents continue through current host actor permissions. Passing these focused
checks is not a new public checkout acceptance or a production deployment.
