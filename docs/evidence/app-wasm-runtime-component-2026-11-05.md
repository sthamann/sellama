# Independent bounded app execution: 5 November 2026

## Delivered ownership

Apps [0.12.0](https://github.com/veyndo/apps/releases/tag/v0.12.0) supplies
`veyndo-app-runtime` 0.1.0 from exact source
`487d20427d70b1cdde96cf690c61691c5eaeda6f`. Model remains 0.8.0.
`components.lock.json` verifies its complete source snapshot; provenance records
Core `5597d801` and the original executor/WIT owners.

| Independent package owner | Responsibility |
| --- | --- |
| `runtime/src/sandbox.rs`, `sandbox/configuration.rs` | Actual no-import core-Wasm approval/configuration hooks |
| `runtime/src/component_runtime.rs`, `component_runtime/abi.rs` | Typed read-only WIT snapshots, all four commerce hooks and explicit namespace compatibility |
| `runtime/src/sandbox_engine.rs` | Single shared bounded Wasmtime engine/pool and epoch clock |
| `runtime/src/policy.rs` | Required trusted-host resource admission, without default approvals |
| `runtime/wit/commerce.wit` | Exact compiler input for the unchanged commerce ABI |

The independent package depends directly only on Wasmtime, WAT and SHA-256. It
has no Core/kernel, SQL/network, identity or environment dependency. A trusted host
supplies its resource policy, allowed legacy namespaces and already-authorized
snapshot. Neither app JSON nor an HTTP request can select those native policies.

Native `crates/apps` now contains small adapters. `NativePolicy` calls the existing
verified `wasm_resources_admissible` predicate directly; both core-Wasm and component
constructors use it. Operator namespace configuration is supplied explicitly to
the shared implementation. Public native reexports, original preparation/cache,
source/digest fences, authorized snapshot construction, current package/actor
rights, checkout outcome application and sandbox/release retain their owners.
There is no second engine, price calculator, identity issuer or commerce ledger.

Source size, pooled resources, stack, store memory/tables, per-call fuel/epochs,
read-only host calls, snapshot/input size, output money and reason-code bounds
retain their original values. Every invocation gets a fresh store. No WASI,
filesystem, network, SQL or credentials are exposed to guests. These are Wasmtime
process/call limits, not an operating-system or fleet-wide containment claim.

## Independent acceptance

All 17 real guest tests pass: thirteen original approval/configuration/component
regressions and four independent host-boundary scenarios. They cover private
table/memory bombs, growth limits, wrong ABI/argument counts, source and digest
identity, infinite loops, bounded host calls, changed snapshots, money/outcomes,
namespace/version rejection, mandatory policy denial on all construction paths,
fresh guest state and snapshot/input budgets. Healthy calls remain usable after
rejected calls. Formatting and warnings-denied runtime/storage clippy pass.

The executable example
`cargo run --locked --manifest-path runtime/Cargo.toml --example quote -- 25000`
executes a real WIT price hook and returns a 250 EUR minor-unit adjustment without
Core or PostgreSQL. The runtime has its own lockfile and independent Linux CI job.
Both runtime and storage/model/PostgreSQL CI jobs pass on push and PR.
[Component PR and checks](https://github.com/veyndo/apps/pull/11).

## Composed acceptance

A fresh Core build, native adapter clippy and all 74 app unit tests pass. Two native
adapter tests check the canonical verified resource predicate, actual guest calls
and operator namespace handoff. A separate process with the explicit legacy
namespace enabled checks the accepted handoff as well as default rejection.
All 34 bundled packages retain exact pre-extraction canonical fingerprints.

Ten actual PostgreSQL/HTTP modules pass: `app_components`, `business_capability`,
`apps`, `app_studio`, `app_preview`, `staging`, `tenant_isolation`,
`visual_workspace`, `app_generation` and `marketplaces`. They include:

- Actual WIT host snapshots and price/shipping/discount/validation hooks consumed
  by quote/checkout, frozen-example rejection, tenant denial and malicious-loop
  rejection while the Core remains healthy.
- Material/dimension configuration, guest-computed surcharge, B2B approval,
  immutable original orders, saved configuration and a newly approved reorder.
- Native and MCP package import, private previews, versioned data, selective
  release, current rights and separate shop contexts.
- Local-model app generation and existing Marketplace order/stock/invoice/Flow
  and restart/replay composition. No paid model/provider call is needed.

Cargo owner/capability checks pass with 32 bypass controls, including denying
SQL/network/Core/kernel/storage dependencies from the independent runtime.
The allowlist also now records the already-used model cron and storage-test chrono
dependencies. Source snapshot checks reject SDK/runtime WIT byte drift, missing
mirrors and linked mirrors. No alternate ABI copy can silently become active.

The image-context check previously treated the independent Marketplace image as
if its build context were the entire Core. It now checks the documented component
context, its actual binary/source/lock/include inputs and missing-source/lock
negative controls. All six Rust image contexts pass; native images retain complete
workspace checks. This is source-closure acceptance, not a new full container build.

Source/size/ownership, documentation/site, existing extracted Lean kernel and
negative proof controls pass. The Wasmtime bridge, generic host policy, SQL and
runtime remain outside the proved kernel. Full platform coverage keeps its existing
daily cadence; this is affected-path acceptance rather than a repeated full suite.

## Remaining work and publication

MKT-03b remains open for remaining typed domain extension compilation,
identity/credential/lifecycle hosting, supported independent production schema,
standalone API/MCP and SDK service acceptance. Actual reusable execution is now
extracted; a separately authenticated complete Apps service is not yet accepted.

Component/Core source and public handbook publication are checked separately.
A new public commerce-runtime deployment or provider payment acceptance is not
part of this extraction's acceptance.
