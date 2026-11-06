# App schema recovery component: 6 November 2026

## Exact extraction

Apps 0.23.0 source `fd288a9e0dacd0d71f46a0bdb01401a9075f0899` extracts actual schema
conversion/recovery from Core `b7c8ec7f6abbade8c1b9b7c610d4a5e2d8bb9b32`,
`src/apps/schema_upgrade.rs`, with its original pure evolution and record adapters.
`components.lock.json` imports that clean source into the complete product.
[Independent change](https://github.com/veyndo/apps/pull/22).

The shared operation selects the explicit version path, uses the existing shape
planner and exact rename/remove/convert/fill operations, projects old declared
fields and captures the old manifest/values/IDs/revisions before writing. It then
updates model definitions, record fields/revisions and the existing
`app.schema.migrated` outbox event on the caller installation transaction.

`Validation` is mandatory and receives the original SQL transaction. Native
Veyndo calls `data::fields`, then `native_data::validate_languages`; native
currency/rich-content policies and the current enabled shop languages stay
attached. The complete installer still owns actor/compiler/consent/trust,
tenant/package lifecycle fences, actual references/projections and commit.
Review still attempts that real installer, checks deferred constraints and rolls
back. No record values are added to its public report.

Original bounds remain 2,000 records per affected model, 4,000,000 serialized bytes
per snapshot and 16,000,000 retained recovery bytes per tenant/app. Retention keeps
its original PostgreSQL JSON text accounting plus incoming serialized byte length.
History is never silently pruned. The revision increment is now checked: an
exhausted counter returns a conflict after field validation rather than wrapping
or panicking. Caller rollback is required on every error, including later hooks.
There is no new pool, schema/role migration, per-app SQL object, independent commit
or automatic schema rewind. Removed field recovery is not a grant to replay old
business effects or bypass the ordinary managed restore/publication paths.

## Independent validation

Formatting and all-target Clippy pass. Actual PostgreSQL tests compose the shared
installer with explicit synthetic host hooks and cover:

- Exact conversion and multilingual rename, including empty and inherited/null
  values; original declared snapshots exclude undeclared historical fields.
- Same app/entity/record IDs in another tenant and another app remain unchanged.
- Invalid conversion, denied host validation and a late installation failure leave
  package/model/records/recovery/version/outbox state unchanged after rollback.
- Exhausted revisions reject without wrap; host validation keeps its first-error
  position even when the revision is exhausted.
- Actual 2,000-row success versus 2,001 rejection, oversized snapshot, retained
  byte quota, other-tenant/app quota isolation and snapshot uniqueness failure.
- Same-version and compatible additive paths capture no migration history/event.

The executable `schema_upgrade` example converts a synthetic quantity, reads its
old recovery value and rolls back. It uses an explicit fixture policy, not a
production identity or approving default host.

Both independent Linux runs passed for the exact source:
[push](https://github.com/veyndo/apps/actions/runs/42206660068) and
[pull request](https://github.com/veyndo/apps/actions/runs/42206781021).
Each includes storage, complete model/compiler checks and the bounded runtime.

## Native composition

The native binary builds, all-target workspace Clippy passes and all 74 App unit
tests pass. Seven affected actual HTTP/PostgreSQL modules pass: `apps`,
`app_studio`, `tenant_isolation`, `app_schema`, `app_shared_storage`,
`app_core_extensions` and `visual_workspace`.

Extended native schema regressions verify review and apply return a 409 for an
exhausted record revision with package/fields/history/outbox unchanged. A historical
translation in a disabled language produces 400 without installing; repairing it
through the normal writer permits actual multilingual conversion and revision
advancement. Existing explicit review, private stage ownership, foreign scope,
consumer Flow compatibility, typed field rules, shared storage, reference/PII
permissions and selective visual publication remain accepted.

The source inventory/structure checks, bounded README/status hygiene, exact
component-source check and generated documentation/site checks are part of this
change. The formal kernel itself is unchanged. Reviewed source hashes acknowledge
the checked extraction; SQL/host policy and full migration are not mathematically
proved by those hashes or by the existing kernel proofs.

This is independent library and composed local/API acceptance. Public handbook
publication is tracked separately from a deployed Core runtime or provider payment
acceptance. Standalone App identity, supported schema provisioning, full service
API/MCP/SDK hosting and remaining lifecycle orchestration remain open in APP-02..05
and MKT-03b/c of the [component plan](../commerce-components.md).
