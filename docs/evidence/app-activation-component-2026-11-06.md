# Package activation component: 6 November 2026

## Exact extraction

Apps 0.22.0 exact source `8fdba5f6a2090dc037ee4f8457cf1f691d46a480` extracts the
native package-state sequence from Core `52eb64e4a491eeac7bd95035b22637cabc5a3bcd`,
`src/apps/routes.rs` and `src/apps/distribution.rs`. The product imports that exact
clean source through `components.lock.json`.

Shared code owns the original host-configuration hook → tenant lifecycle fence
(543) → package fence (7) → branch admission/dependency check → revision CAS
sequence. The original active-dependant SQL is removed from native distribution.
Required host hooks retain actual configuration/automation locking, current
installed package/actor/consent/trust/dependencies/commerce/native-lifecycle and
connected frontend admission. The original native scope, signed database identity,
Boolean input and caller transaction/commit remain with the route/host.

Original first-error order and late revision admission are retained. A missing
activation package still reaches native package admission before revision checking;
a missing deactivation row reaches the original CAS conflict. A same-state request
still advances revision; it is not newly declared idempotent. Overflow fails in
PostgreSQL rather than wrapping. Every error requires caller rollback.
No implicit installation, app-data/version/credential/job deletion, new event,
production DDL, per-app SQL object or extra permission is introduced. Existing
consumers continue to admit the current active package.

## Independent validation

Real PostgreSQL tests use durable synthetic management/consent/trust/commerce/
lifecycle facts and connected references. Cases cover current host denial,
frontends and active dependants, own/foreign scope, branch/error order, stale/missing
revision, same-state advancement, retained records/versions, hook rollback and
reconnect. These fixture facts are not a production authentication implementation.

Actual shared active-package locking and installation run on separate database
connections. Tests prove state changes cannot escape a writer fence, installation
cannot escape an uncommitted deactivation, and deactivation cannot escape an
uncommitted dependent installation. After the first commits, the required inactive
dependency or active-dependant check rejects the second mutation. Concurrent state
CAS produces one winner; exhausted revisions preserve state and roll back hooks.

The executable `package_state` example denies both branches without actual host
authority and rolls back. No approving default or implicit host is supplied.

## Native composition

The native binary builds, workspace/all-target Clippy passes without warnings and
all 74 App unit tests pass. Seven actual HTTP/PostgreSQL modules pass: `apps`,
`app_studio`, `tenant_isolation`, `channel_management`, `app_distribution`,
`app_surfaces` and `visual_workspace`.

Expanded native checks reject read-only state changes, stale and missing revisions
without re-enabling an inactive app, and reactivation of a signed dependent while
its required package is inactive. Re-enabling the dependency then permits the
actual signed child to activate. Existing foreign-shop, signature/namespace,
connected Storyfront frontend/deactivation guard, public surface/private preview,
normal app data and visual publication paths remain accepted.

The channel fixture uses the existing synthetic hosted-frontend origin/key/editor
configuration and local reflecting server. Initial absent fixture configuration
correctly produced service-unavailable before frontend provisioning; after supplying
that documented configuration, the complete native channel fixture passes. This is
connected frontend/proxy admission acceptance, not a new hosted Storyfront purchase.

Exact source/WIT parity, source inventory and structure checks pass: 892 Rust
modules, 982 frontend modules and 351 static route/method pairs. Independent Linux
runs `42203957608` and `42203966348` pass both storage and runtime, recorded in
[Apps PR 21](https://github.com/veyndo/apps/pull/21). Full-suite verification stays
on its daily cadence; local fixtures introduce no new paid provider calls.

## Remaining work

Independent production identity/schema/API/MCP hosting, schema recovery and other
remaining lifecycle orchestration stay open under APP-02..05/MKT-03b/c. This is
library/source composition, not a new hosted Core acceptance. SQL/async/native host
code remains reviewed and unproved; the verified pure kernel is unchanged.
