# Private App Studio draft component: 6 November 2026

## Scope

Apps 0.20.0, exact source commit `6a243eb4e4899df5bcc0108ce6230d79b245e542`,
extracts the actual native mutable draft persistence from Core
`1095d4d34aa8d689de9b32137d28de2c0e44533b`, `src/developer/drafts.rs`.
Native routes consume that exact source through `components.lock.json`.

Shared storage owns the original strict wire decoding and first-error ordering,
64 KiB serialized JSON budget, retained submitted fields/locales, actor advisory
lock, owned-environment callback, row revision CAS, 20-draft quota and scoped
list/delete. The existing fixed `developer_drafts` table and environment relation
are retained. No schema migration or per-app/model/tenant SQL object is added.

The required host callback checks actual environment ownership on the original
connection. Native middleware and adapter retain authenticated actor derivation,
current developer access, personal or integration-token binding, signed database
scope and caller transaction commit/rollback. No caller-supplied actor claim grants
access. Unfinished packages can be autosaved without passing installation-time
compilation; restoring a draft never installs or publishes it. Immutable versions,
installed package data and final selective release retain their own lifecycles.

## Independent validation

Real PostgreSQL exercises tenant/actor separation (including same tenant/different
actor), environment admission and host failure, exact submitted fields/locales,
wire/identity/revision errors, 64 KiB boundary and multibyte overflow, rollback,
reconnect, CAS create/update contention, per-actor quota contention, updates at
quota, freed capacity and bigint exhaustion without overwrite. Packages/outbox
remain untouched. The runnable `private_drafts` example saves, reads, denies stale
writes and unadmitted environments, deletes and rolls back its synthetic work.

## Native composition

The integrated Core binary builds and workspace/all-target Clippy passes without
warnings. All 32 developer unit tests pass. Five actual HTTP/PostgreSQL modules
pass: `apps`, `app_studio`, `tenant_isolation`, `app_generation` and
`visual_workspace`. The expanded `apps` regression exercises the native role and
wire/identity/revision gates, foreign/owned environment, actual two-window HTTP
save (one success, one 409), preserved final revision and scoped delete. The
existing HTTP envelope rejects an oversized request with 413 before domain JSON
decoding; the independent storage test separately verifies the exact 64 KiB
manifest boundary.

Existing composed modules retain actual private install, immutable version/stage,
selected live release, native simulated order/approval and data isolation checks.
Exact component source/WIT parity and source inventory pass; structure checks
cover 879 Rust modules, 982 frontend modules and 351 static route/method pairs.
No full-suite rerun or new paid provider call was performed for this extraction.

Independent Linux runs `42198314196` and `42198324229` pass both storage and runtime.
Component [PR 19](https://github.com/veyndo/apps/pull/19) contains the exact source.
The native complete product uses the same import, not a second autosave SQL path.

## Remaining acceptance

Independent production schema/role/identity hosting, complete lifecycle
orchestration, standalone authenticated API/MCP/SDK and hosted runtime deployment
remain open in APP-02..05 and MKT-03b/c. This extraction adds no new public endpoint
or permission. SQL/async and native host admission remain reviewed and unproved;
the existing pure verified kernel is unchanged.
