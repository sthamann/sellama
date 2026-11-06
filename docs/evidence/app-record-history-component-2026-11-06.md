# App record history component: 6 November 2026

## Exact scope

Apps 0.21.0 exact source `9a54c8929d5f0d15a11f7c333ea85ce3e40e66f4` extracts
`src/apps/record_history.rs` from Core `5b75a65646a3e16b9fa95f70a1969361e072e583`.
The native product imports that exact clean source through `components.lock.json`.

Shared storage owns immutable capture/read-scope derivation, original actor/source
SQL attribution, original app advisory lock and 20-revision/16 MiB pruning, bounded
scoped history and restore lookup/read admission. Capturing a duplicate version
cannot replace its fields, scopes or attribution. Nonpositive capture revisions
now reject before subtraction; normal managed writes already supply positive
checked revisions. One existing fixed `app_record_versions` table and its original
production migration, package FK and RLS grants are retained. No production DDL,
new public endpoint, extra per-app tables or second record writer is introduced.

`ReadAuthority` and `RestoreHost` are required ports with no approving defaults.
Current entity rights and declared-field response projection stay native. The
restore adapter calls actual `data::save_tx` on the original transaction, preserving
current package/typed fields/references/lifecycle/CAS/history/outbox. Explicit
review, expected current revision, signed scope, current actor/source attribution
and caller commit/rollback remain native. Restoring creates a new revision and
never rewinds clocks, installs an older package or bypasses publication.

## Independent tests

Real PostgreSQL tests cover exact field/locale retention, immutable original
rights/attribution, tenant/app/record separation, malformed scopes failing closed,
rollback/reconnect and original scope derivation. Actual `pg_column_size` history
exceeds 16 MiB to exercise pruning, preserving other apps and tenants. More than
20 captures exercise per-record retention and pruning rollback.

Restoration tests use the actual shared CAS writer/history/outbox: successful new
revision, historical read denial before the writer, current field validation,
stale CAS, two competing connections, failed audit and capture persistence rollback.
The executable `record_history` example captures/reads history, denies missing
rights and restoration without an actual admitted writer, then rolls back.

## Native composition

The integrated native binary builds. Workspace/all-target Clippy passes without
warnings and all 74 native App unit tests pass. Seven real HTTP/PostgreSQL modules
pass: `apps`, `app_studio`, `tenant_isolation`, `app_schema`, `app_shared_storage`,
`app_core_extensions` and `visual_workspace`.

The expanded native visual-workspace regression restores through both HTTP and
MCP, verifies new revision/source attribution, retains the original version,
rejects absent approval, missing historical revision, foreign-shop lookup and
stale current revision, then continues actual page publication, private stage
editing and selective release. Existing append-only form/PII history and write
restrictions remain accepted. Schema conversion/recovery, current core-object
rights, shared records and normal native app/configuration/order fixtures pass.

Exact component source/WIT parity and source inventory pass. Structure checks
cover 886 Rust modules, 982 frontend modules and 351 static route/method pairs.
The full suite remains on its daily cadence; this extraction uses local/synthetic
provider fixtures and no new paid provider calls. Independent component
[PR 20](https://github.com/veyndo/apps/pull/20) records Linux CI against the same pin.

## Remaining acceptance

Independent production identity/schema/API/MCP hosting, remaining package
activation/deactivation and schema-recovery orchestration remain open in APP-02..05
and MKT-03b/c. This is a component/source integration, not a new public Core runtime
acceptance. SQL/async and native host code remain reviewed and unproved; the pure
verified kernel is unchanged.
