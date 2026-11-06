# Independent App Data reader component acceptance, 6 November 2026

## Source and actual boundaries

Apps storage 0.25.0, Data reader 0.1.1 and authority 0.1.0 source:
`b8b5d974ddb67354e83f7aa613143af37eccd800`, from [Apps PR 24](https://github.com/veyndo/apps/pull/24)
and the [strict null-contract correction](https://github.com/veyndo/apps/pull/25).
Veyndo imports the exact snapshot through `components.lock.json`; it does not
maintain a second copy of the storage implementation.

The new independent Rust reader has one typed HTTP/OpenAPI/MCP operation and
Fetch/existing SDK examples. Current fixed-endpoint OAuth merchant identity,
audience, expiry and scopes are checked per request. The installed private list
action supplies schema and primary/additional scope requirements; MCP opt-in is
required only for MCP. Record fields/graph and native pagination retain their
shared model owner.

The explicit versioned reader schema is a fresh dedicated database with four
fixed tables. Its serving login has SELECT only, forced signed RLS, no inheritance,
object ownership, superuser, RLS bypass, schema creation or temporary-table rights.
A read-only repeatable-read transaction checks the actual actor/tenant ticket.
Signing keys are bound to the actual database login. No migration connection is
present in the serving process. Ordinary Core object-bound models are denied
until the real native resolver is available.

## Local observed checks

* Real Rust reader process, fixed local identity HTTP server, independent actual
  PostgreSQL schema and nonowner reader login pass. Two synthetic shops return
  their own pages; caller tenant injection, unsigned GUC changes, forged/expired/
  altered/wrong-role tickets, signing-key reads, DDL and DML are rejected.
* Per-request permission changes, inactive/expired/wrong-audience identities,
  missing merchant context, package disable and MCP opt-out deny correctly.
* Declared-field projection removes undeclared data; localized maps, revisions,
  empty/null values, keyset pagination and ID lookup retain their wire values.
  Native object references fail with `native_resolver_required`.
* Existing generic SDK MCP output and direct Fetch output are the same page.
  Wrong signing keys return sanitized service-unavailable, not successful empty data.
  Startup rejects the migration/owner connection.
* Shared authority unit tests, original page/filter/projection unit, Clippy and
  original independent PostgreSQL storage contracts pass.
* Existing runtime service process/HTTP/MCP/SDK acceptance passes after its fixed
  current identity adapter moves to the shared authority crate.
* The local reader image builds as nonroot `10001:10001`; its final operating
  image has no Python, Cargo or PostgreSQL migration executable. Linux CI runs
  the actual HTTP/MCP/SDK acceptance against this image with a read-only root
  filesystem, dropped capabilities and no new privileges.

## Native composition and GitHub acceptance

* Native build, workspace Clippy, all 74 affected App units and three native
  runtime scope/network/context unit tests pass.
* The original adversarial scope verifier passes using the actual tenant login,
  independently of SET ROLE: no forged shop/system/actor, signing material,
  identity secrets, schema/projection writes or reused system-role tickets.
* Seven actual native HTTP/PostgreSQL suites pass on a disposable copy with
  separate restricted system/tenant logins and `DB_SCOPE_REQUIRED=true`: `apps`,
  `app_studio`, `tenant_isolation`, `app_schema`, `app_shared_storage`,
  `app_core_extensions` and `business_capability`. The latter retains materials,
  dimensions/surcharges, approval, saved configuration/order/reorder and release.
* [Component CI](https://github.com/veyndo/apps/actions/runs/42216607470) passes
  storage, runtime, existing service and the new data reader.
  [Actual reader container](https://github.com/veyndo/apps/actions/runs/42216607725)
  and [existing runtime container](https://github.com/veyndo/apps/actions/runs/42216607474)
  acceptance both pass on Linux. The component is merged and published as
  [0.25.0 prerelease](https://github.com/veyndo/apps/releases/tag/v0.25.0).
* The final reader DTO additionally rejects explicit null for each optional query
  field, while omitted values retain their defaults. Its actual HTTP/MCP/SDK test
  passes, including these new negative cases.
* Component imports preserve unchanged source bytes and modification times, update
  changed content and remove deleted files. A real clean Git fixture checks those
  effects while retaining exact source and signed-verifier drift guards. The final
  service-only import leaves the native rebuild at 0.25 seconds on this machine;
  that is an observed incremental build, not a general performance benchmark.
* Existing formal checks pass without changing a pure policy: 64 policies,
  153 Lean theorems and 222,535 finite comparison cases. Negative checks reject
  187 broken policies, 14 unsupported syntax cases, three stale/disconnected
  bindings, nine proof shortcuts/axiom/audit cases and ten layout bypasses.
  Network, signing host and SQL adapters remain explicitly unproved.
* Source structure and exact inventory pass: 919 Rust modules, 982 frontend modules
  and 351 static API method/route pairs. Documentation build/check covers 423 pages,
  416 Markdown sources and 49,677 local links/assets. These are source/site checks,
  not another full-platform or public checkout acceptance.

## Still outside this acceptance

No full independent installation/write/settings/jobs/history/restore host,
marketplace durable-host cutover, automatic credential rotation or public service
provisioning is asserted. Native package compiler, current object/privacy resolver,
consent, write lifecycle and selected publication retain their existing owners.
This change moves no shop data and changes no production database account.
