# Independent App package installer acceptance, 6 November 2026

Source: Apps 0.28.0 at `2b2e84ed4e8e86ee003a88bf12775021311905e5`,
Data service 0.4.0, unchanged model 0.13.0 and authority 0.2.0.
[Source change](https://github.com/veyndo/apps/pull/28).
[Operator setup and SDK example](../app-package-installation-service.md).

## Delivered operation and shared owner

`POST /v1/packages/review`, `POST /v1/packages/install`, MCP
`apps.packages.review/install`, contract version 4 and the existing SDK use the
same complete compiler and original atomic installation sequence. The extracted
`src/models.rs` owns the native model definition/rebuild loop, required host
compatibility and original new-required-field guard. Native `src/apps/records.rs`
delegates on its original transaction with actual core-extension compatibility.
No second compiler, model registry or native authority is introduced.

The independent schema-4 profile is an explicit migration-owner upgrade from the
settings profile. It adds exactly two shared tables for immutable versions and
usage. The serving process uses its existing restricted nonowner login, current
signed tenant scope and exact grants; it never receives migration credentials or
creates SQL objects. Original 100,000 row / 64 MiB per-App budgets apply to actual
record writes through protected accounting in the same transaction.

Only portable private `app_` data packages are admitted here. Unsupported native
resources, UI/effects, code builds, publisher trust and schema migrations are
rejected before installation. Their full native policy ports remain mandatory.
Personal live administrator authority comes from fresh fixed introspection;
package input cannot supply identities, tenant, rights or operator scope catalogues.

## Actual independent process acceptance

`data-service/tests/acceptance.py`, `install_cases.py` and the executable
`examples/install.mjs` exercise the actual Rust service, PostgreSQL and unchanged
SDK without a Core process. The observed journey reviews and installs a complete
package, saves encrypted settings and writes/reads its newly installed model.

* Review writes nothing and checks actual prior models and immutable versions.
* Missing personal/live/current administrator authority and foreign tenant access
  deny; unknown caller identity properties and unsupported package domains reject.
* Exact canonical digest, package revision, permission list and explicit approval
  are required. Compiler errors preserve their actual field/message.
* Two shops use independent instances of the same App ID. Concurrent installation
  yields one winner, one conflict and one version/event.
* Additive upgrades preserve records and revisions. Downgrades, same-version
  changes, destructive shape changes and new required fields reject. Installed
  model versions are attached to actual subsequent records.
* Late model, event and finish failures roll back package, models, versions,
  usage and event together. Exhausted revisions reject safely.
* Actual serving-login attempts cannot rewrite package identity, immutable
  history, usage counters or schema. Missing/excessive grants reject startup.
* Row and byte limits roll back record/history/event; current settings, existing
  record flows and installed package state survive process restart.
* HTTP, MCP and the unchanged generic SDK share the same operations.

The real shared PostgreSQL contract also passes installation hooks/rollback,
version identity, schema recovery, settings, jobs and retained history. Rust
formatting, all-target Clippy and the affected unit tests pass.

## Scope

This is an independently runnable package/data/settings host and an exact native
source integration. Standalone resource resolvers, transport-secret rotation,
jobs, restoration and release orchestration remain open. No production schema or
credential change is required for the native extraction. This acceptance does not
create a newly hosted public App Data service or claim the whole modularization
is complete. Native and remote container results are recorded below.

## Native composition and remote acceptance

The actual native binary passes seven affected HTTP/PostgreSQL suites with
separate signed system/tenant logins: `apps`, `app_studio`, `tenant_isolation`,
`app_schema`, `app_shared_storage`, `app_core_extensions` and `business_capability`.
The login adversary checks deny forged tenant/system/actor contexts, secret/key
reads, schema changes and system-ticket reuse. All 74 App unit tests pass.

[Component CI](https://github.com/veyndo/apps/actions/runs/42237503679) passes
storage, runtime, service and data-reader jobs. The
[actual container](https://github.com/veyndo/apps/actions/runs/42237503657) passes
the same independent installation/settings/records acceptance using the nonroot
Rust-only image, read-only filesystem, no capabilities and no new privileges.
The ordinary Veyndo source integration consumes this exact clean component commit.
