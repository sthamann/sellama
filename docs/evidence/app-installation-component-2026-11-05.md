# Shared app installation: 5 November 2026

## Delivered boundary

Apps [0.5.0](https://github.com/veyndo/apps/releases/tag/v0.5.0) contains the
original package installation orchestration in `src/installation.rs`. The complete
platform imports exact source commit `b30e5a71a6d3e8323a8a74d26468eff4b1395841`,
with per-file hashes in `components.lock.json` and original native ownership in
component provenance. `veyndo-app-model` remains 0.2.0.

The shared sequence requires all five host hooks. They use explicit Send futures
and the caller's original SQL transaction, including its authenticated scope.
There is no default hook implementation or component-owned transaction commit.

| Stage | Shared component | Required native host owner |
| --- | --- | --- |
| Prepare | Admitted ID/version match | Full Manifest compiler, package/provider approval, Wasm verification, commerce configuration lock/replacement/payment checks and default fee validation |
| Admission | Original tenant lock 543, package lock 7 and 128-package quota | Distribution dependencies, commerce hooks and native lifecycle admission |
| Upgrade | Existing immutable version digest check and own-tenant previous package read | Typed previous Manifest, original downgrade rejection and checked schema migration |
| Attach | Original package upsert and revision/activation behavior | Fixed-storage attachment and logical model installation |
| Finish | Original immutable version write and `app.installed` outbox event | Default configuration record creation and schedule synchronization |

The order matches the previous native implementation. A failure at any stage
propagates to the caller, which must roll back the whole transaction. The private
preview entry still checks the native personal preview environment before choosing
mutable version mode. Incoming request fields cannot select this mode. Installation
consent and current actor rights remain in the original native entry paths.

`registry.rs` now delegates to this shared sequence. `package_install.rs` supplies
the existing native owners as required hooks. Direct installation, hosted app
setup, private preview, staging clone/release and upgrade review therefore use
the same component. No production database table, role, credential store or
schema migration is introduced.

## Independent acceptance

Required component [CI](https://github.com/veyndo/apps/actions/runs/42062794315)
passes formatting, clippy, the 22 unchanged pure model tests and actual PostgreSQL
storage tests. New installation cases verify:

- Hook ordering and the exact installed response/digest.
- Published version immutability with unchanged package/history/event state after
  rollback of a rejected replacement.
- Rollback after failure at each of prepare, admission, migration, model attachment
  and final configuration/schedule completion, including failures after persistence.
- Identical app/version identifiers in another tenant with independent content.
- Host-selected private mutable preview without writing published version history.
- Two concurrent installations starting with 127 packages: exactly one succeeds,
  the final count is 128 and exactly one installation event is stored. An existing
  package remains updatable at the quota.
- An upgrade waits for the original shared package writer fence; a bounded timeout
  fails the transaction rather than replacing the package underneath the writer.

Test-only hooks record stage effects on the actual connection. They demonstrate
the required host contract, not a production compiler/authentication substitute.
The minimum independent fixture remains distinct from a supported signed-RLS
production schema.

## Composed acceptance and remaining work

A fresh native build and clippy pass. Targeted real PostgreSQL/HTTP fixtures pass
for apps, consent/callbacks, shared storage, schema upgrades, jobs, Studio, private
F5, core extensions, native lifecycles, staging/release, signed distribution and
tenant isolation. The surfaces and visual workspace fixtures use their own Core
and local-model processes; no paid model calls are made. The independent Marketplace
fixture passes HTTP/MCP, sync jobs, native order import, localized snapshots,
stock, Flow, invoice/PDF and restart/replay composition.

All 34 bundled package fingerprints are unchanged. The original native current
rights, reserved/provider package trust, migrations and preview checks remain in
their actual consumers. These targeted checks do not replace daily full coverage
or constitute a new public payment/provider/hardware acceptance.

MKT-03b remains open for the complete independent package compiler, authentication
and credential/lifecycle hosting, supported production schema and standalone
HTTP/MCP/SDK service. This release completes the shared installer, not the entire
independently operated Apps service.
