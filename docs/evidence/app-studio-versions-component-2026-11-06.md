# App Studio version acceptance, 6 November 2026

## Shared snapshots, history and staging

Apps 0.19.0 exact source `cc2c1121fa4349cf403fa39a4d325c6f8902764a` supplies actual
immutable development snapshot persistence, original serialized-byte digest,
bounded active/archive history, recoverable archival and row-locked staging.
Core imports the exact source through `components.lock.json`. Model 0.12.0 and
runtime 0.2.0 are unchanged.

Development digests retain the original SHA-256 of the serialized Manifest;
they are not replaced by installed-package canonical fingerprints. Immutable
identity remains `(tenant, app, version)` even when archived. History is bounded
at 100 active and 100 archived rows, preserving original ordering. Trusted host
rows include retained prompts only for native minimized design-evidence projection;
raw prompts do not enter HTTP/MCP history responses.

Staging loads the current non-archived scoped build under its original row lock,
checks the reviewed digest and requires the actual host admission callback. Native
`version_storage` checks owned private environment, typed package/compiler and
current actor scopes, then invokes the real existing installation path on the
original privileged transaction. The shared component marks the build staged
only afterwards. Errors require caller rollback of all package/model/version/event
and build-state writes. Native live/developer/approval gates remain in front of
that path. Final selective live publication and actor-private mutable drafts keep
their existing native owners.

## Independent executable example

```sh
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo test --locked --test postgres -- --ignored --nocapture
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo run --locked --example build_versions
```

Use an empty disposable database for the contract test. Its minimal fixture schema
is not a production identity/RLS setup. [The example](https://github.com/veyndo/apps/blob/main/examples/build_versions.rs)
executes actual save/history/archive/restore operations, rejects staging without
an authorized installer and rolls back. It does not claim a standalone production
installer. PostgreSQL cases separately stage through the actual shared installer
with explicit synthetic hooks. Those hooks demonstrate the port and transaction,
not a replacement identity/compiler implementation.

Independent PostgreSQL acceptance passes for original digest bytes, scoped and
bounded history, immutable archived identities, restore rollback, concurrent
non-overwrite, foreign/digest/archive staging denial, failed current host/installer
admission, post-install state-write rollback and stage/archive row contention.
The executable example and warning-free Clippy pass.

## Native composed acceptance

The final assembled Core binary passes eleven targeted HTTP/PostgreSQL modules:
`apps`, `app_studio`, `app_preview`, `staging`, `tenant_isolation`, `app_components`,
`app_surfaces`, `app_assistants`, `app_generation`, `visual_workspace` and
`marketplaces`. Native HTTP/MCP import, immutable save, reviewed private install,
selected live release, recoverable project removal/restore and private record
isolation remain connected. Archived builds cannot stage and installed
packages/data remain available. Existing agent/context/definition/permission and
Marketplace native order/stock regressions pass. A local Node library issue in the
test environment was resolved by selecting the existing Node 22 toolchain; only
the affected remaining modules were run again.

All 32 developer unit tests pass, including direct native serialized-byte digest
comparison and reserved package rejection. Independent PostgreSQL/example and
warning-free Core/component Clippy pass. Exact source/WIT pins, 32 Cargo boundary
controls, six image-context closures, structure (875 Rust modules) and 351 static
API routes pass. [Apps PR 18](https://github.com/veyndo/apps/pull/18) records Linux
storage/runtime CI, including unchanged model/runtime and all prior storage cases.
Only affected Core tests ran; complete verification retains its daily cadence.
Existing extracted-policy proof scope is unchanged; SQL/host code remains
reviewed/tested and unproved.

## Remaining boundary

APP-02/MKT-03b remain open for remaining lifecycle/version orchestration, mutable
draft storage, independent supported production schema and authenticated API/MCP
hosting. Current identity, compiler/source/locale checks, private ownership, final
publication and transaction commit stay native. No new per-app SQL objects,
principal, schema installer, implicit approval or parallel package installer are
introduced. SQL/host adapters remain tested/reviewed and unproved; library/local
acceptance is distinct from a new public Core runtime rollout.
