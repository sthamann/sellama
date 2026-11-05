# Shared app settings and schema evolution: 5 November 2026

## Delivered ownership

Apps [0.7.0](https://github.com/veyndo/apps/releases/tag/v0.7.0) supplies model
0.4.0 from exact source `d95e82586bd42cc340f44064a80b8639d8b82f46`.
`components.lock.json` verifies its complete snapshot and per-file hashes;
component provenance retains native ownership at Core `4b67dc04`.

| Component owner | Native consumer | Responsibility retained by host |
| --- | --- | --- |
| `model/src/settings.rs` | `src/apps/settings.rs` | Current personal administrator, live environment, approved package digest, revision, encrypted store and runtime service dispatch |
| `model/src/evolution.rs` | `src/apps/schema_changes.rs`, `core_extensions.rs` | Full package compilation, native binding admission, selected upgrade path and installed version |
| Same `shape` and `convert` functions | `schema_upgrade.rs`, `upgrade_review.rs` through the native adapter | Scoped transaction/locks, bounded recovery snapshots, actual writes and native field/reference/language checks; review rolls back |

Strict setting and migration wire types preserve the original serialization.
Settings declarations retain localized labels and kinds. Partial updates preserve
omitted values, allow false/zero/optional empty values, enforce required fields,
exact integer/boolean types, string/control limits and the 16 KiB encoded budget.
`visible` removes secret values; `configured` exposes declared key names only;
`declared` removes undeclared/removed settings before runtime dispatch. A malformed
stored settings object is rejected explicitly when preparing an update.

Schema evolution retains explicit rename/remove/convert/fill steps and path,
step, identifier and default-size limits. The shared compatibility check preserves
operational-record and core-binding restrictions. Relationship or model removal
still needs the original offline migration path. Value conversion never coerces
fractional or overflowing strings to integers and never routes integers through
floating-point money. Actual converted fields are still validated in the native
transaction; a pure shape plan alone does not admit or apply a package.

There is no production database migration, new table, new credential, new role or
provider call in this extraction. App data remains in the existing shared tables.
The native complete-domain before/after package validators keep their order.

## Independent acceptance

- All 47 model tests pass, including 13 new settings/upgrade scenarios. The former
  native conversion unit is now covered by the independent exact-conversion case.
- Storage and model clippy and formatting pass. All modules stay below 320 lines.
- `cargo run --locked --example upgrade_settings` executes settings preparation and
  an explicit model upgrade plan without Core, SQL, network or credentials.
- Actual independent PostgreSQL storage/installation contract passes, retaining
  rollback, concurrent CAS/quota, replay, lease, package version and writer fences.
- Component [pull request and CI](https://github.com/veyndo/apps/pull/6) pass;
  CI now also runs that executable example.

## Composed acceptance

A fresh native build, native clippy and all 73 remaining native app unit tests
pass. All 34 bundled packages pass full native validation and retain their exact
pre-extraction fingerprints, including the moved settings/migration wire types.

Actual PostgreSQL/HTTP fixtures pass for apps, consent, schema upgrades, Studio,
private preview, core extensions, staging/release and tenant isolation. The schema
fixture verifies failed conversion rollback across records, package, recovery
history and outbox; corrected rename/remove/convert/fill updates retain recovery
snapshots, increment revisions and preserve a foreign shop. Rollback-only review
checks stale consent, changed validation, active Flow dependencies and private
stage/foreign-shop visibility.

The app-surface fixture passes with added real encrypted-settings checks: clearing
an obligatory secret fails without advancing its revision; a partial non-secret
update retains that secret for the actual private service call; browser responses
remain redacted. Existing stale revision, undeclared key, foreign actor, guest and
private-environment denials remain green. Model wire uses a local synthetic server,
with no paid calls. The native Marketplace fixture also passes HTTP/MCP, sync,
order/stock/invoice/Flow and restart/replay composition.

Source structure, snapshot, documentation hygiene, extracted Lean kernel proof and
negative mutation checks pass. Settings/evolution, SQL, host authority and complete
compiler remain outside the extracted proof boundary. Full coverage retains its
daily schedule; these are affected checks, not a new whole-platform acceptance.

## Remaining extraction and publication scope

MKT-03b remains open for the other typed domain extension validators, identity and
credential/lifecycle hosting, an independently supported production schema and
standalone API/MCP/SDK service. The Rust example prepares values/plans; it does not
install a package or replace host authentication/encryption/transaction handling.

This component release and its Core source integration do not establish a new
public commerce-runtime deployment or a new real-payment acceptance. Public
handbook publication is verified separately after the Core merge.
