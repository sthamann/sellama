# App data without table proliferation

Managed apps share four fixed PostgreSQL tables. Installing an app, adding a shop,
creating a model, declaring an index or opening a sandbox creates logical rows;
it does not create another physical table or index. Native commerce tables,
existing app history and the independent connector database contract stay separate.

| Table | Responsibility |
| --- | --- |
| `app_models` | Shop/app/model definition and installed schema version |
| `app_records` | Original record ID, CAS revision, schema version and typed JSONB fields |
| `app_record_indexes` | Declared scalar lookup/unique values using fixed bounded-size digest indexes |
| `app_record_references` | Ordered app relationships and fixed native product/customer/order/channel/B2B/asset references |

Apps 0.7.0 shares settings updates/projections and explicit schema evolution
planning with the native host. All data stays in the existing shared tables;
there is no per-app table or schema migration in this extraction.
[Settings and evolution boundary](evidence/app-evolution-settings-2026-11-05.md).

Apps 0.8.0 also shares event privacy/filter/delivery and schedule/webhook contracts.
It introduces no new queue, event ledger or table. Actual durable processing still
uses the existing native outbox, leases and replay receipts.
[Event and trigger boundary](evidence/app-event-contracts-2026-11-05.md).

Apps 0.9.0 also shares object-binding/AI graph contracts. Graph output is derived
from existing admitted current rows; no second record/graph store is introduced.
[Object and graph boundary](evidence/app-object-graph-contracts-2026-11-05.md).

Apps 0.10.0 adds shared placement and named HTTP route contracts through required
host policies. This registers no route, creates no table and grants no data access;
native runtime admission remains connected.
[Placement/route boundary](evidence/app-surface-contracts-2026-11-05.md).

## One contract across every consumer

The canonical Manifest still defines types, required fields, translation, choices,
validation, relationships and actions. Rust validates the same fields for Studio,
API, MCP, Flows, callbacks, AI proposals and selected sandbox releases. Apps cannot
send SQL or create PostgreSQL objects. `apps/records.rs` is the shared internal
storage adapter; app-specific behavior remains under its package directory.

The low-level record and job SQL now belongs to the independent
[`veyndo-app-storage` package](https://github.com/veyndo/apps). Core imports an exact
source snapshot in `extensions/services/app-storage/` and passes its existing
scoped transaction to it. `Scope` and `RecordKey` are admitted storage keys, not
credentials. Current identity/package checks, model rules, CAS, projections,
history and publication remain in the native host. This introduces no second
store, production schema migration or plugin SQL access.
[Extraction tests and remaining standalone host work](evidence/app-storage-component-2026-11-05.md).

Version 0.2.0 also owns the shared record mutation and page-query sequence. Native
writers keep package/model/reference/language checks, then call the common
record lock, revision check, exact replay and atomic event path. Mandatory host
hooks enforce lifecycle rules and retain bounded history in that transaction.
List queries bind filter values and publication field names; the native host
still admits declared indexes and projects only currently visible fields.
[Record operation acceptance](evidence/app-record-operations-2026-11-05.md).

The full identity is `(tenant, app, entity, id)`. Sandboxes use their admitted
private tenant and existing personal ownership/expiry checks. Equal app names,
record IDs or different schema versions in unrelated shops cannot collide.
Public reads project current declared fields only; storage metadata, removed fields,
private form answers and credentials do not become public data.

## Package compiler before installation

The shared Apps 0.6.0/model 0.3.0 compiler checks metadata and declared limits,
capabilities, models/index budgets, configuration and action cross-references,
closed schemas, action privacy/effect rules, legacy slots and event names before
installation. Required host extension validators and reference/scope/Wasm-kind
policies preserve the remaining native checks. This does not create SQL objects,
replace runtime rights/reference ownership, or authenticate a caller.
[Compiler evidence](evidence/app-package-compiler-2026-11-05.md).

## Atomic package installation

The Apps 0.5.0 `installation` module orchestrates the original package transaction
through required host hooks. Its tenant installation lock prevents competing
installs from exceeding the 128-package quota. Its exclusive app lock matches the
existing shared writer fence. Package/version persistence and `app.installed`
share the transaction with native compiler/commerce/schema/model/configuration
and schedule work. Hook failures propagate; the host rolls back every effect.
Published version immutability and host-checked schema/downgrade rules remain in
force; private preview must be admitted by the host before mutable version mode.
No production schema migration is introduced by the extraction.
[Independent and integrated evidence](evidence/app-installation-component-2026-11-05.md).

## Current authority and package identity

Apps 0.4.0 shares the action/right/callback rules through explicit host authority
ports. The storage package owns the original scoped active-package shared lock
and read. Native writers keep the full typed digest comparison and hold the lock
until their transaction ends; installs/upgrades use the same exclusive lock.
This preserves package-before-record ordering and permits unrelated tenants to
continue. The host still authenticates callers and authorizes full packages.
[Package fence and consent evidence](evidence/app-admission-component-2026-11-05.md).

## Shared model compiler

Apps 0.3.0 supplies `veyndo-app-model` alongside the storage package. Native app
entity/field types, declaration grammar, bounded input schemas, typed field values,
enabled-language checks, publication declarations and record workflows use this
pure package. Required policy ports reuse the host currency, rich-content, relation
shape and native reference guard. Actual referenced-object ownership, current
rights, package consent, history and SQL isolation remain native host checks.
The model package has no SQL/network access.
[Wire compatibility and integrated acceptance](evidence/app-model-component-2026-11-05.md).

## References, uniqueness and concurrency

PostgreSQL maintains lookup values and references in the record transaction.
Ordinary database roles cannot edit the projection tables directly. Fixed composite
foreign keys preserve tenant/app/entity containment, prevent deletion of referenced
native objects and permit cyclic app imports through deferred app references.
Deleting a source removes its outgoing references; target protection remains.

Declared `indexed` fields use shared scalar lookup rows, not per-field indexes.
The existing bounded keyset/equality API remains. Values retain their JSON types;
text decimal/date representations are not silently normalized. Unique fields work
even without `indexed=true`, with database-enforced concurrency. Digests bound index
key size; read filters additionally compare the original value. A theoretical hash
collision conservatively rejects a unique write, never overwrites another record.

Package fences still precede record locks. Record locks include the complete logical
identity. Schema changes retain explicit rename/remove/convert/fill plans, immutable
package digests, record revisions and bounded recovery history. They do not execute
app-supplied DDL. A changed F5 model clears only that preview/app's rows.

## Capacity and explicit limits

Entities can declare `operational: true` for execution receipts, locks and other
runtime records. These rows remain in shared storage but are excluded from sandbox
cloning and configuration snapshots used by selected publication. An installed
operational entity cannot become publishable by removing or disabling that flag.
Omitting it retains the previous manifest serialization and package digest.
Operational data stays separate from the configuration selected for publication.

Existing limits remain: 128 registered packages/shop, 12 models/package,
16 fields/model, 64 declared indexed/unique fields/package, 100,000 accounted rows
and 64 MiB of logical storage per shop/app. Accounting includes ordered relation
rows and app-owned native document artifacts. Counters are updated transactionally;
conflicting or quota-rejected writes roll back their projections and events.

The byte counter is not total PostgreSQL disk usage: shared indexes, MVCC/WAL and
retained history have their own costs. Fixed table count is not an unlimited-throughput
claim. Sandbox catalog cloning and bounded release snapshots retain their existing
record limits; this change does not implement copy-on-write product catalogs,
automatic sharding or online tenant relocation.

## Existing database cutover

This is a coordinated maintenance migration, **not a rolling storage conversion**.

1. Back up and verify the existing database using the normal release procedure.
2. Stop/drain every old Core HTTP and worker process. Keep old binaries stopped
   until new schema and code are both ready. Private services must not write app
   SQL directly; the API gateway remains their boundary.
3. Apply native migrations 101–102 with the existing migration login. Migration 102
   refuses connected configured Core system/tenant logins, including idle pools.
4. The migrator locks package/schema inputs, copies every declared physical model
   including inactive/private apps, preserves original values/IDs/revisions,
   validates every record and ordered relationship, checks deferred foreign keys
   and retires the exact verified table set without `CASCADE`.
5. Start the new Core and workers with the existing separate signed system/tenant
   connections; strict startup checks also cover the fixed app tables. Verify app
   reads/writes, native checkout, private previews and selected publication.

Missing legacy tables, invalid targets, mismatched rows/relations, quota violations
or unknown external table dependencies abort migration 102 atomically. There is no
`ON CONFLICT DO NOTHING` data loss, current-data repair, fabricated history or
`app.record.changed` event. Older unrelated legacy backup tables outside the exact
declared set are not silently deleted. Restore the pre-maintenance backup before
running an old binary again; the old binary cannot use the consolidated schema.

Migrations 001–100 remain unchanged. The old 055 hosted-package native repair now
runs after storage consolidation, so historical SQL replay never invokes the new
registry before shared storage exists.

## Verification

`app_shared_storage` exercises actual HTTP installations across eight shops and
32 packages, asserting no physical table/index growth, typed filters, same-ID
isolation, concurrent unique writes, protected projections and exact F5 cleanup.
`app_storage_migration` replays the original SQL through migration 100 and then
tests populated inactive/private tables, cyclic links, precision, translations,
NULL/empty distinctions, documents/history and atomic refusal controls.

Existing app/schema/relations/components/preview/Studio/staging/page/form suites
exercise the shared consumers. Signed-runtime and transaction-pool tests remain
required for deployment. Local verification is not evidence of production cutover.
The [dated local evidence](evidence/shared-app-storage-2026-10-15.json) records actual
results, source hashes, the resolved local oracle prerequisite and deployment limits.

The [15 October hosted acceptance](evidence/shared-app-storage-hosted-2026-10-15.json)
separately records the completed backup, drained-Core migration and public browser
flows. All eight declared legacy tables were retired. After new shop creation,
native app installations, a private page edit and selected publication, the database
still had four physical app tables and no legacy app tables, with 27 packages and
12 logical models. Existing and newly generated Storyfront shops and a new AI-seeded
standard shop completed simulated purchases; the evidence retains untested provider,
invoice, authentication, restore and localization boundaries explicitly.

[App platform](app-platform.md) · [Authenticated SQL authority](authenticated-database-scope.md) · [Testing](testing.md)

## Native object extensions

[Typed product/customer/order/company extensions](app-core-extensions.md) reuse these same four fixed tables and their existing native reference and unique projections. They do not add native columns or app-specific indexes.
