# Shared app event and trigger contracts: 5 November 2026

## Delivered boundary

Apps [0.8.0](https://github.com/veyndo/apps/releases/tag/v0.8.0) supplies model
0.5.0 from exact source `08060b910db73e1f6010457af5e32fdb3da475b2`.
`components.lock.json` checks its complete source snapshot and file hashes;
provenance records the original native owners at Core `e144e595`.

| Shared owner | Native consumer | Responsibility retained by native host |
| --- | --- | --- |
| `model/src/events.rs` | `event_contract.rs` | Mandatory destination admission, actual public DNS/pinned egress, current installed digest/consent, secret resolution, signing and request admission |
| `model/src/subscriptions.rs` | `event_projection.rs`, existing delivery worker | Current actor/package authority, tenant/app delivery scope, leased outbox and replay/uncertainty handling |
| `model/src/triggers.rs` | `schedules.rs`, `webhooks.rs` | Host UTC clock, durable tick/package locks, private-environment/paused-shop restrictions, signatures/freshness, scoped replay receipts and transactional effects |

Strict event filter/delivery, schedule and webhook types retain their wire defaults.
Declared subscription permissions and own-app record/configuration binding use the
original rules. Payloads keep the original per-family field projection, including
separate B2B and customer/financial permissions. Filters evaluate projected data,
never raw hidden customer values. Declaration permissions alone do not establish
current dispatch authority; context must come from a fully admitted current package.

`DestinationPolicy` is required with no default acceptor. The native adapter calls
its unchanged URL/HTTPS/public-address validator and preserves original error
ordering and host errors. Actual DNS/pinned egress remains in the native sender.
The pure component neither resolves destinations nor opens sockets or stores keys.

UTC schedule parsing retains the existing cron parser, single seconds value,
count/input limits and declared emit-action validation. Validation now accepts the
host's explicit UTC time; native admission passes current UTC. Incoming webhook
declarations still bind private emit actions. Actual HMAC verification and all SQL
queues, leases, schedules and replay receipts retain their original owners.

No production schema, table, database role, credential or provider configuration
changes. The native complete-domain package validators retain their order. This
release does not add a second event ledger or processing queue.

## Independent acceptance

All 61 model tests pass, including 14 new subscription/privacy/filter/delivery and
trigger cases. They cover declaration/scope combinations, own/foreign app events,
B2B and dual PII/financial permission, minimized commerce/POS/fulfillment/AI events,
filters over hidden fields, OR/AND equality, scalar/count/size limits, mandatory
host destination rejection, strict wire shapes, deterministic UTC ticks, closed
schedule input schemas and private webhook action bindings.

Storage/model lint and formatting pass. The executable Rust example
`cargo run --locked --example event_contracts` prints a minimized event and a
next UTC tick without Core, SQL, network or credentials. Its external-destination
policy denies every URL. The model's own lockfile supports independent builds;
CI invokes its manifest directly, so root-package lint is enforced rather than
relying on dependency lint. Nested build output is ignored and tracked build
artifacts are explicitly rejected before CI builds.

The actual independent PostgreSQL storage/installation contract also passes,
retaining atomic rollback, CAS/replay/quota, lease and package writer/version
fences. Component [PR and CI](https://github.com/veyndo/apps/pull/7) pass.

## Composed acceptance

A fresh native build, native clippy and all 73 native app unit tests pass.
All 34 bundled packages pass complete native validation and retain their original
fingerprints after moving the wire types.

Ten affected PostgreSQL/HTTP modules pass: apps, consent, private preview, staging,
tenant isolation, events, assistant patterns, strict-RLS secrets/webhooks, export
and Marketplace. This includes:

- Bounded leased event batches, customer minimization and projected filtering;
  another tenant continues during a slow delivery. Stale completion cannot replace
  a newer lease. Aggregate app limits remain shared across two replicas.
- Signed webhook to durable rule/Flow to actual app record; altered bodies,
  expired/foreign signatures and concurrent replay are denied or deduplicated.
- Real persisted cron ticks, no private-stage execution, no duplicated tick after
  restart and webhook replay receipts surviving restart.
- Actual non-owner strict-RLS encrypted service calls, secret rotation/revision,
  digest consent, foreign-context/revoked-signature denial and paused-shop blocking.
- Independent export app event, scoped callback, private artifact and durable job;
  Marketplace HTTP/MCP, sync, native order/stock/invoice/Flow and restart/replay.

These use synthetic local services and isolated test shops, with no paid model or
provider calls. Snapshot/structure/documentation/site checks and existing extracted
Lean kernel proofs/negative mutations pass. Event/model/host/SQL paths remain
unproved; full coverage retains the daily schedule.

## Remaining host and publication scope

MKT-03b remains open for the other typed domain extension validators, identity and
credential/lifecycle hosting, independent supported production schema and standalone
API/MCP/SDK service. A pure eligibility/projection result is not current authority.

The component release and Core source integration do not establish a public Core
runtime deployment or a real payment acceptance. Public handbook publication is
verified separately after merge.
