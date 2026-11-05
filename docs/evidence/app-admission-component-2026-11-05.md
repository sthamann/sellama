# App authority ports and package fences: 5 November 2026

## Delivered boundary

Apps [0.4.0](https://github.com/veyndo/apps/releases/tag/v0.4.0) contains
`veyndo-app-model` 0.2.0 and `veyndo-app-storage` 0.4.0. The composed platform
imports exact source commit `adc090a2b880d15963ecf5d5f175ecd0222c91f2`, with
per-file hashes in `components.lock.json`. Original owners and source provenance
remain recorded in the component repository.

The shared model now owns the original Action wire type, action admission order,
compound scopes, callback capability mapping, consent/current-role facts and
requested callback scope planning. Trusted host ports require current merchant
and scope checks. They have no permissive default. Native adapters use the
authenticated RequestContext and preserve existing errors and validation pointers.
JSON fields claiming an actor, role or grant cannot implement these ports.

The storage component owns the original transaction-scoped shared advisory lock,
active tenant/app package read with `FOR SHARE`, and canonical JSON SHA-256 digest.
The native host still parses the full typed Manifest and compares its expected
digest inside the original write transaction. All 34 bundled package fingerprints
are unchanged after the Action extraction.

## Authority that remains native

Identity authentication, current membership, callback token generation/storage,
expiry and revocation, signed database scope, package compilation, reserved
package trust, explicit installation consent, service approval and release
orchestration remain with their existing native owners. The final callback
decision still uses `verified_kernel::app_callback_admissible` with separate
consent and current-role facts. The pure scope planner neither issues a key nor
authenticates a request. A third-party host must implement these authority ports
from its own trusted authentication and current permissions.

This extraction introduces no production table, migration, second identity store,
credential issuer or permission cache. It does not complete a separately hosted
Apps HTTP/MCP service. MKT-03b remains open for the remaining host boundary and
independent service acceptance.

## Independent component acceptance

The component's required [CI run](https://github.com/veyndo/apps/actions/runs/42057332614)
passes formatting, model/storage clippy, all 22 model tests and its real PostgreSQL
storage contract. Eight new model cases cover admission order, revocation,
compound permissions, public action constraints, hostile request claims,
separate callback consent/role facts, capability mapping and bounded callback
scope planning with explicit PII/read pairing.

The real PostgreSQL package cases verify scoped active/missing/inactive reads,
stable key-order fingerprints, changed-version fingerprints, an upgrade blocked
while the same package write fence is held, concurrent progress for another
tenant, and a successful upgrade/read after releasing the fence. The test role
and minimal fixture demonstrate transaction behavior; they do not replace the
native restricted-role/RLS acceptance.

## Composed platform acceptance

A fresh native build and clippy pass. All 74 native app unit tests pass. Targeted
native PostgreSQL/HTTP fixtures pass for:

- Apps, callback credentials and explicit consent, including current permission
  and package changes.
- App surfaces, private/public access, pinned UI bytes, HTTP/MCP, local model wire,
  explicit agent opt-in, encrypted settings and tenant isolation (11 checks).
- Leased app jobs, schema evolution, core extensions, native lifecycle transitions
  and the tenant-isolation suite.
- The visual workspace through its existing actual HTTP path.
- The independent Marketplace HTTP/MCP/job adapter composed with native order
  import, stock, order Flow, invoice/PDF and restart/replay checks.

The surface concurrency fixture now holds eight slow calls behind an explicit
release signal, rather than depending on a two-second sleep. It verifies the
actual ninth-call rejection while a native cart and another tenant continue.
The fixture server also admits the eight connections without its former backlog
of five. Production limits are unchanged. Its local model service runs separately
from other Core workers sharing the same test queue, so the intended worker
receives the fixture's model configuration. No paid model call is made.

These are targeted component and composed-system regressions. The complete suite
and coverage retain their daily schedule. This change does not claim a new public
payment, hardware, production capacity or independent service deployment test.
