# Encrypted app configuration acceptance, 6 November 2026

## Shared storage and required host crypto

Apps 0.18.0 exact source `3b366d0bf617a0dafd81b1eb4202b85d28cb2fad` supplies existing
`app_service_secrets` metadata, internal resolution and rotation. Core imports that
exact source through `components.lock.json`. Model 0.12.0/runtime 0.2.0 unchanged.

Required `Crypto` seal/open methods retain the actual native platform key owner.
The shared implementation preserves the original
`app:tenant:app:kind:digest:revision` binding, scoped advisory/row locks, revision
CAS, active package row check, ciphertext write and atomic metadata-only event.
Caller transactions own commit/rollback. `resolve_locked` retains the shared
secret row through original webhook verification and receipt persistence. No
per-app tables/indexes, production schema migration, alternate key owner, default
crypto or plaintext fallback are introduced.

Native settings reads retain the direct verified personal-administrator predicate;
settings writes additionally require a live shop. Transport credential routes retain
their original current team/user, live-shop, declared-kind and approved-digest
checks. Input limits, configured-key projection and browser secret redaction remain
native. Missing
configuration remains distinct from a stale or undecryptable value, so operator
fallback cannot silently replace rejected tenant credentials. Revision increment
uses checked arithmetic and rejects exhausted/negative inputs explicitly.

## Independent execution

[Executable encrypted settings example](https://github.com/veyndo/apps/blob/main/examples/encrypted_settings.rs):

```sh
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo test --locked --test postgres -- --ignored --nocapture
APP_STORAGE_TEST_DATABASE_URL=postgres://.../disposable_storage_test \
  cargo run --locked --example encrypted_settings
```

Select an empty disposable database for the contract test. Its minimum fixture
schema is not a production identity/RLS/schema installation. The example then
uses a fresh ephemeral test-only AES-GCM key, actual model preparation, encrypted
storage, internal resolution and secret-safe projection, rolling back everything.
No key, plaintext or ciphertext is printed. Production hosts supply their actual
identity, key and supported schema owners.

Independent PostgreSQL cases pass for actual AEAD wrong-key and
shop/app/kind/revision substitution rejection, missing/current/stale configuration,
CAS/package mismatch, unavailable key, overflow, two concurrent rotations,
metadata-only projection, atomic outbox failure rollback and rotation blocked by
a webhook shared read. All prior storage/job/install cases remain in the driver;
its long base fixture is separated into its own module. Clippy and example pass.

## Composed acceptance

The final assembled native binary passes nine targeted HTTP/PostgreSQL modules:
`apps`, `app_jobs`, `staging`, `tenant_isolation`, `app_secrets`, `app_surfaces`,
`app_events`, `app_assistants` and `marketplaces`. Strict non-owner forced-RLS
service calls use actual encrypted tenant credentials; CAS/approved package/foreign
actor rejection and metadata redaction pass. Incoming signed webhooks adopt their
path tenant, reject conflicting/revoked signatures and stop for paused shops.
The new exhausted-revision HTTP regression returns 400 without changing the
working credential. Settings/custom service actions, private sandbox denial,
event delivery, schedules, MCP opt-in/current scopes and Marketplace native
order/stock flows remain connected.

All 74 native app unit tests, independent PostgreSQL contract/example and
warning-free component/Core Clippy pass. Exact source/WIT pins, 32 Cargo boundary
controls, six image-context closures, 870 Rust module structure and 351 static API
routes pass. The [Apps PR 17](https://github.com/veyndo/apps/pull/17) Linux CI runs
the unchanged model/runtime plus the expanded storage contract and example.
Only affected Core tests ran; complete verification retains its daily cadence.
Existing extracted-policy and mutation checks retain their scope; surrounding
SQL/crypto/host code is tested and reviewed, not formally proved.

## Remaining boundary

APP-02/MKT-03b remain open for version/identity orchestration, independent supported
production schema and authenticated API/MCP hosting. The library does not admit
HTTP principals, create pools/schemas, provision keys, supply runtime fallbacks or
commit transactions. Existing extracted-policy proof scope is unchanged; shared
SQL/crypto adapters remain reviewed and tested, unproved code. Library/local
acceptance does not establish a new public Core runtime rollout.
