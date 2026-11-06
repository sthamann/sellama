# Independent App job supervision acceptance, 6 November 2026

Source: Apps 0.29.0 at `f9524c6ee07a4a1fb201a0a2e6cebe3d81074b00`,
Data service 0.5.0, unchanged model 0.13.0 and authority 0.2.0.
[Operator setup and executable SDK example](../app-job-supervision-service.md).

## Delivered operations and ownership

HTTP `POST /v1/jobs/list`, `/v1/jobs/detail`, `/v1/jobs/control`, MCP
`apps.jobs.list/detail/control`, OpenAPI and contract version 5 use the same
scoped history and original atomic control engine. Shared `src/job_projection.rs`
extracts native current-rights/current-package result redaction and queued-event
selection. Native `src/apps/jobs.rs` delegates to it through its actual current
authority adapter; authentication, actor/detail checks, retry input admission and
execution remain with their original owners.

The explicit schema-5 profile adds one fixed job table/index with signed forced
RLS. Its nonowner serving login has exact control-column writes and terminal-only
archival, no enqueue/input/result/message/identity/schema grants. Earlier profiles
do not inherit job authority. Trusted producers provision already-admitted worker
packages/jobs separately. There is no new worker, public seed, result API, issuer
or automatic external-effect dispatcher.

## Actual independent process acceptance

`data-service/tests/job_cases.py` uses the actual Rust service, PostgreSQL and
fixed current identity endpoint. Synthetic existing jobs/packages are provisioned
only by the separate trusted fixture producer; all supervision uses real APIs.

* History is bounded with stable creation-time/ID ordering and scoped cursors.
  Hostile group labels do not become SQL or authority. Missing cursors conflict.
* Two shops and different actors have distinct visibility. Revoked primary or
  additional rights and stale package digests redact message/result. Inputs,
  leases and internal row digests do not enter responses.
* Detail requires original actor or administrator, current action rights and an
  active matching package. Current administrative scope, personal/live claims,
  exact package/revision and explicit approval gate controls.
* Explicit false approval, unknown operations, null fields, foreign identity
  properties and stale digest/revision are rejected. A real negative test caught
  reliance on an unsupported JSON Schema `const`; the host now checks the actual
  approval boolean before entering its transaction.
* Queued cancellation, retained running-worker lease, expired uncertainty,
  reviewed retry/resolution and terminal archival pass. Retry checks current
  action rights and stored input against the current schema before emitting a
  queued signal. It cannot fabricate successful worker completion.
* Competing controls yield one success/one conflict. Late outbox failure rolls
  back updates and archival deletion. Exhausted revision rejects safely.
* Actual serving SQL cannot enqueue, forge input/result/identity, create schema
  objects or delete active work. Missing or excessive grants reject startup.
* The unchanged generic SDK lists, inspects and explicitly cancels a real queued
  fixture job. MCP and HTTP agree; state survives restart.

The existing reader, portable managed-write, encrypted settings and complete
portable-install journeys remain passing in the same independent process test.
The real shared PostgreSQL contract and a focused stale/revoked-result unit
regression also pass. Production host SQL/network/authority remain unproved by
Lean; the original verified kernel is unchanged.

## Remaining lifecycle boundary

This acceptance covers supervision of existing jobs. Independent producer/worker
hosting, callback evidence, dispatch, recovery and full release orchestration
remain separate checklist work. It requires no native production schema or
credential change and does not create a new publicly hosted App Data service.

## Integrated and container acceptance

The native binary passes `apps`, `app_jobs`, `app_studio`, `tenant_isolation` and
`app_shared_storage` through actual HTTP/PostgreSQL with separate signed system
and tenant logins. Adversarial SQL checks reject forged actor/shop/system scope,
key/identity-secret reads, schema/projection changes and system-ticket reuse.
All 74 App unit tests pass.

[Component CI](https://github.com/veyndo/apps/actions/runs/42245124618) passes
storage, runtime, service and data-reader jobs. The
[actual container](https://github.com/veyndo/apps/actions/runs/42245124612) repeats
the independent supervisor/settings/install/records acceptance with nonroot user
10001, a read-only filesystem, no capabilities and no new privileges.
[Component change](https://github.com/veyndo/apps/pull/29).
