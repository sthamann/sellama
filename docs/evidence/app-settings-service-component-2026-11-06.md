# Independent encrypted App settings acceptance, 6 November 2026

Source: Apps 0.27.0 at
`5e24268e52969d5436d98ee2f62c34dee3534e3d`, Data service 0.3.0 and authority 0.2.0.
[Source change](https://github.com/veyndo/apps/pull/27).
[Operator setup and JavaScript example](../app-settings-service.md).

## Delivered operation

`POST /v1/settings/read`, `POST /v1/settings/save`, MCP `apps.settings.read/save`,
OpenAPI and the existing generic SDK use shared declared settings orchestration.
`src/settings.rs` retains the native partial update/projection and encrypted
revision/package-bound storage, with one metadata-only outbox transaction.
Native routes call that owner while retaining their original verified personal
administrator admission, live-stage restriction and package approval.

`authority/vault` contains the original platform AES-GCM envelope. Cognition
retains operator environment/key loading, with a vault-only declared dependency.
The Cargo boundary checker now classifies authority explicitly and has 36 bypass
negative controls, including accidental OAuth/database features in that dependency.
The shared storage library still owns no pool, environment or current identity.

The independent profile requires schema 3, explicit restricted grants and an
operator vault key. Its fresh fixed OAuth authority must assert nondelegatable
personal/live claims and current apps.read/apps.manage/team.manage. The migration
adds one fixed secret table and native package digest registration, never
per-App/model/shop SQL objects. The serving process cannot install or approve
packages, change schemas, export secrets or acquire migration authority.

## Actual independent process and container

The existing `data-service/tests/acceptance.py` now includes `settings_cases.py`
and executable `examples/settings.mjs`. It runs the actual Rust service,
PostgreSQL, fixed identity endpoint and unchanged SDK, without Core:

* Reader/write profiles hide and reject settings; schema/grant mismatch rejects startup.
* Missing current administrator scopes, personal/live claims, merchant context or
  a bootstrap subject deny both reads and writes. Request tenant fields reject.
* Two tenants have independent configuration; their secret values never appear
  in settings reads, events or ciphertext text.
* Required settings, unknown fields/types, false approval and missing trusted
  digest registration reject. Empty strings, false, zero and omitted secrets
  retain their original semantics.
* Concurrent same-revision writes yield one success and one 409. Late outbox
  failure rolls back ciphertext, revision and event together.
* Package change hides old configuration and requires new explicit configuration;
  old secrets do not silently inherit. Deactivation blocks access.
* The actual serving login cannot edit package digest/identity or delete settings.
* MCP and Fetch agree with the unchanged SDK; wrong vault key or ciphertext from
  another tenant denies. Configuration survives process reconnect.

[Component CI](https://github.com/veyndo/apps/actions/runs/42229149500) passes
storage, runtime, service and data-reader jobs. The
[actual Data container](https://github.com/veyndo/apps/actions/runs/42229149446)
repeats the same PostgreSQL/HTTP/MCP/SDK workflow with nonroot user 10001, a
read-only root filesystem, no capabilities and no new privileges. It contains no
Python, Cargo or psql. The unchanged Runtime container also passes.

## Assembled native Veyndo

The actual rebuilt binary passes `apps`, `app_studio`, `tenant_isolation` and
`app_shared_storage` using separately authenticated system and tenant logins with
strict signed SQL scope. The existing adversarial verifier rejects foreign,
system and personal scope forgery and privileged schema/identity access.

The original `app_surfaces` and `app_secrets` HTTP/provider fixtures also pass,
including encrypted settings on real installed App surfaces, secret-safe reads,
partial updates, current foreign/restricted actor denials, actual private service
configuration injection, sandbox exclusion, credential rotation and webhook
signatures. These use local synthetic providers and their own temporary database.

Workspace/all-target Clippy, 74 actual App unit tests, the native encryption unit,
authority vault interoperability and original shared PostgreSQL storage contracts
pass. Existing Lean production policies and their negative controls retain their
named scope; no proof of encryption, OAuth, SQL or complete host correctness is
claimed. Structure, localization and source ownership checks pass.

## Remaining component work

APP-02c is complete for this explicit installed-App settings profile. Full trusted
installation, transport-secret rotation, internal runtime setting resolution,
jobs, native resource policies, restore and standalone publication remain on
APP-02..05. No public Data service, production schema upgrade or production vault
key was provisioned in this acceptance. Existing native databases need no schema
or ciphertext conversion for the shared-code change.
