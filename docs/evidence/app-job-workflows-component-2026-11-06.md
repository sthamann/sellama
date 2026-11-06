# Durable app job workflows acceptance, 6 November 2026

## Shared ownership

Apps 0.17.0 exact source `49df0be2aa0cc3392657d8f434a301becfa09f95` owns actual
bounded job history/detail and the original merchant control transaction. Core
imports that source through `components.lock.json`; native routes use the same
implementation. Model 0.12.0 and runtime 0.2.0 are unchanged.

`job_history` retains tenant/app scoping, bounded stable created-at/ID cursors,
scoped anchor resolution, group labels, expired-running uncertainty and
success-only results. Its rows are trusted host data. Current native package,
actor and action admission, redaction and removal of the internal fingerprint
remain required before HTTP disclosure. The shared reader never treats a group
or supplied tenant as authority.

`job_control` retains the original row lock, first-error order, expected revision,
completed-only archival, queued/running cancellation, explicit unknown-outcome
confirmation, retry actor/package reset, lease cleanup and queued/control outbox
writes. Every retry invokes mandatory current-action/primary/additional-right and
stored-input admission while holding the original row lock. Caller transactions
own commit/rollback; hook/database rejection must roll back all work.

## Independent execution

[Executable PostgreSQL example](https://github.com/veyndo/apps/blob/main/examples/job_control.rs):

```sh
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo test --locked --test postgres -- --ignored --nocapture
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo run --locked --example job_control
```

Use an empty disposable database for the first command. It installs the existing
minimum test schema, not a production host schema. The example uses those tables,
runs a synthetic failed job through acknowledged retry, cancellation and archival,
and rolls the entire transaction back. Its synthetic admission is not a real
identity provider.

Independent PostgreSQL cases pass for stable tied pages, hostile labels,
foreign/stale cursors, uncertainty/result projection, scope, CAS conflicts,
concurrent control, unknown-outcome confirmation, cancellation lease retention,
retry actor/package reset and hook/outbox/missing-actor rollback. Existing storage
replay/quota/lease/installation cases also pass; warning-free Clippy and the
example pass.

## Native composed acceptance

The final assembled Core binary passed seven targeted HTTP/PostgreSQL modules:
`apps`, `app_jobs`, `app_components`, `staging`, `tenant_isolation`,
`shipping_contract` and `marketplaces`. The dedicated job suite additionally
checks bounded/stable pages, hidden internal fields and foreign detail/control/
cursor rejection. Existing tests retain idempotency, scoped quotas, late/stale
leases, explicit retry, cancellation, evidence, current creator revocation and
archival. Shipping retains unknown-effect fencing across an actual server restart;
Marketplace retains concurrent idempotent native-order/stock behavior.

All 74 native app unit tests and warning-free Core Clippy pass. Exact component
source/WIT checks, 32 Cargo boundary rejection controls and six image-context
closures pass. Structure checks cover 864 Rust modules and 351 static API routes.
The unchanged model/runtime retain their independent CI checks. Only affected
Core tests ran; complete Core verification remains on its daily schedule.

[Apps PR 16](https://github.com/veyndo/apps/pull/16) records the independent Linux
runtime/PostgreSQL checks. Library and composed acceptance use the exact source
above. Existing extracted-policy and mutation checks retain their original proof
scope; shared SQL/control/host adapters are reviewed and tested, unproved code.

## Remaining work

APP-02 and MKT-03b remain open for remaining settings/version hosting, identity,
callback/evidence orchestration and a supported independent production schema,
API/MCP service and SDK examples. Current creator-role checks, signed SQL scope,
completion callbacks/evidence and the direct verified completion predicate retain
their native owners. There is no new queue, implicit retry, principal, production
schema or internal transaction commit. This library/local integration acceptance
is not a new public Core runtime deployment or a proof of SQL/host code.
