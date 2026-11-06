# Independent App Runtime service: 6 November 2026

## Exact source and composition

Apps 0.24.0 source `0ed3d8bf75f5cd55b9e0cd3ef5d409ef7bcb233f` adds the independently
buildable Rust package `veyndo-app-runtime-service` 0.1.0 in `service/`. The complete
product imports that clean source through `components.lock.json`. Its runtime
0.2.0 engine remains the same implementation used by native Veyndo.
[Independent change](https://github.com/veyndo/apps/pull/23).

Model 0.13.0 exposes the original first block of `Frozen::validate` as
`validate_bounds`. The full native contextual validator calls that same block
before its original record declarations and field-policy checks, preserving
native acceptance/order. There is no new native data or financial writer.

The separate network composition root owns current OAuth introspection,
HTTP/OpenAPI/stateless MCP, one typed evaluation operation and process capacity.
The library/storage/guest owners retain their no-network/no-identity boundaries.
The server calls the shared model bounds and actual bounded WIT executor; it
creates no Core instance, pool, schema, local role store or token issuer.

## Current authority and supplied examples

Every protected request introspects the caller token at one operator-configured
endpoint using a separate resource-server credential. Current subject, authorized
tenant, exact scope, audience and future expiry must come from that identity owner.
There is no response cache. Body/header principal, tenant, permission and namespace
claims cannot grant access. HTTPS is required except for literal local endpoints
with a loopback server bind. Redirects, bad responses and oversized identity data
fail closed without exposing credentials or upstream response details.

`POST /v1/evaluations`, `GET /v1/contract`, `GET /v1/openapi.json` and `POST /mcp`
share strict typed inputs and the same operation. OpenAPI and MCP descriptions
project the same input/output schemas. MCP negotiation, tool discovery, structured
results, invalid IDs/parameters and tool failures are covered through actual HTTP.
Origin checks, duplicate authorization rejection and no-store responses apply.

Inputs are supplied synthetic snapshots and WIT component source. No record ID
fetches live data. Price/shipping/discount/validation outcomes are marked simulation
and no applied effect, with source and canonical input fingerprints. Ordinary
native review/installation/checkout remain the live authority owners.

## Bounds and cancellation

The current namespace and required service resource policy retain original
memory/table, fuel/epoch, host-call, ABI, fresh-store and outcome checks. Source,
context, record and request byte budgets are checked before execution. Shared frozen
amount/currency/uniqueness/cardinality rules remain active.

Four global tasks, two per current tenant and one per current subject are admitted
without an unbounded queue. Idle keys are removed. The actual blocking task owns
its permits, so request cancellation/timeout cannot release capacity while the
guest still runs. Identity concurrency/timeouts and subsequent request deadlines
remain bounded. These controls are per process; no fleet-wide rate or OS isolation
claim is made.

## Independent observed validation

- 116 model tests and 24 shared runtime tests pass.
- Configuration tests reject insecure destinations, credentials/query fragments and
  unsafe origins. A real blocking cancellation test proves that aborting the waiter
  retains occupied capacity until the task actually finishes.
- The actual Rust process plus a local HTTP identity server passes real Wasm through
  HTTP, MCP, Node Fetch and the unchanged `veyndo/sdk` at
  `c621cee931a2e04ba204607a7115f0202797973c`. Structured results match across transports.
- Immediate revocation, inactive/expired/wrong-audience/missing-scope/missing-tenant
  access, failed/redirecting/oversized identity responses, foreign Origin, duplicate
  authorization, forged input authority, invalid money/duplicate snapshots/source
  limits, bad ABI/namespace and tool errors are rejected without private response
  leakage. OpenAPI/MCP schemas match the operation contract.
- The local Docker image builds and runs as UID/GID 10001 with a read-only root,
  dropped capabilities, no-new-privileges and no Python/Cargo. Actual health and
  missing-identity rejection pass; the test container is removed afterward.
- Independent Linux storage/runtime/service CI passes. Linux container acceptance
  builds the real non-root image and repeats the complete identity/HTTP/MCP/SDK
  fixture with no Core or PostgreSQL. Both final-source component runs pass:
  [push](https://github.com/veyndo/apps/actions/runs/42211539890) and
  [pull request](https://github.com/veyndo/apps/actions/runs/42211547589).
  [Container acceptance](https://github.com/veyndo/apps/actions/runs/42211547497)
  also passes for exact source `0ed3d8bf75f5cd55b9e0cd3ef5d409ef7bcb233f`.

Focused service tests run in the independent component workflow. Container checks
run daily/manual or for Docker recipe changes, preserving the complete product's
existing daily full-test cadence.

## Native composition

The native binary builds, all-target workspace Clippy passes and all 74 App units
pass. Seven actual HTTP/PostgreSQL modules pass: `apps`, `app_studio`,
`tenant_isolation`, `app_schema`, `app_shared_storage`, `business_capability` and
`visual_workspace`.

The actual furniture workflow retains material graph/API/MCP, immutable upgrades,
validated dimensions, pure surcharge, independent purchasing approval on original
and reordered purchases, exact-once stock/orders, saved configuration inputs and
selected version publication. The original completed order remains immutable.
Existing Studio/tenant/update/shared-data/visual release and model provider fixture
checks also pass. This is composed local acceptance, not a new provider payment
or hosted Core runtime acceptance.

The source/ownership, formal kernel/conformance/negative controls and generated
handbook checks retain their existing scope. The kernel itself is unchanged;
new OAuth/network/scheduling code is reviewed and unproved. No complete-server,
complete-isolation or full Apps-platform proof follows from the source registry.

## Remaining service work

The standalone evaluation server is runnable from source/container with a compatible
current OAuth owner. It has not been publicly deployed or connected to native
browser sessions in this change. Full App data identity, supported database
provisioning, install/control APIs and the shared independent/embedded App UI remain
open in [APP-02..05 and MKT-03b/c](../commerce-components.md). The
[service guide](../app-runtime-service.md) separates those owners and supplies
startup, endpoint, SDK and container examples.
