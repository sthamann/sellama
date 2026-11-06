# Managed App Data writes acceptance, 6 November 2026

## Source and boundaries

Apps storage 0.26.0 and Data service 0.2.0 source:
`56c4f0cc567322e2e975a80afd04451945dfb654`, [Apps PR 26](https://github.com/veyndo/apps/pull/26).
Veyndo consumes the exact `components.lock.json` snapshot. The original native
lifecycle/before-and-after history hooks move to `src/managed_hooks.rs`; native
field/reference/package/identity/transaction admission retains its owners.

The optional independent managed-write profile adds approved package-bound CAS
writes and retained history through HTTP/OpenAPI/MCP/SDK. Schema 2 is an explicit
operator upgrade of a dedicated reader database. Serving credentials cannot
install packages, modify models/schema, delete records or update history. Default
read mode retains schema 1 and SELECT-only admission. No production database
upgrade or hosted service configuration is performed by this extraction.

## Observed independent acceptance

* Actual Rust process, current fixed identity endpoint and real PostgreSQL exercise
  schema 1 read mode followed by the explicit schema-2 write profile. Read mode
  denies writes and does not advertise write tools. Startup rejects owner access,
  read/profile mismatches and excessive writer grants.
* Two shops, current apps.manage/action scopes, explicit approval, package digest
  and revision admission pass. A stale package, missing approval, negative revision,
  invalid/unknown fields and excessive body are rejected. Caller tenant/identity
  cannot enter the command contract.
* Two simultaneous updates have one winner and one 409. Only one additional
  revision, history snapshot and event appears. Invalid state reversals and
  immutable identity changes are rejected.
* Actual restricted package row locking works, while direct package edits and
  changing a record tenant are denied. Deactivated packages cannot be written.
* Deliberate late event, history and declared-output failures roll back record,
  history and outbox together. Reconnection preserves only successful changes.
* Old historical read scopes still apply after a package narrows its current
  declarations. Per-record history stays at 20 versions. Actor/source are derived
  from current host context. Events contain only App/entity/record/revision metadata.
* Native reference/translation/index/unique models deny without substitute policy.
  MCP action opt-out denies MCP while authorized HTTP continues working.
* Existing generic SDK exercises actual managed writes and retained history.
  Original independent storage PostgreSQL contracts, focused units and Clippy pass.

## Native composition and CI

Native build, workspace Clippy and all 74 affected App unit tests pass. The actual
signed-scope adversarial verifier passes, followed by seven native HTTP/PostgreSQL
modules under separate system/tenant connections: `apps`, `app_studio`,
`tenant_isolation`, `app_schema`, `app_shared_storage`, `app_core_extensions` and
`business_capability`. Native field/reference/language/commerce validation remains
in front of the shared original state/history implementation.

[Component CI](https://github.com/veyndo/apps/actions/runs/42223873583) passes
storage, runtime, existing service and both Data service profiles.
[Actual nonroot container acceptance](https://github.com/veyndo/apps/actions/runs/42223873732)
also passes on Linux, exercising read-only schema 1 and managed schema 2 in the
same real-process test suite. The source is merged and published as
[0.26.0 prerelease](https://github.com/veyndo/apps/releases/tag/v0.26.0).

The handbook builds/checks 426 pages from 419 Markdown sources. This is targeted
component acceptance; full-platform tests retain their existing daily schedule.

## Remaining host work

Complete independent package installation, native resource policies, settings,
jobs, historical restore, sandbox publication and autonomous Flow/outbox dispatch
remain open. The portable profile does not replace Veyndo's full native policies.
No live payment, provider or public checkout journey is asserted by these tests.
