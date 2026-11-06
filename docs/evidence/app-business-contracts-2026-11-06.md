# Shared app business contracts: 6 November 2026

## Delivered ownership

Apps [0.13.0](https://github.com/veyndo/apps/releases/tag/v0.13.0) supplies model
0.9.0 and runtime 0.2.0 from exact source
`ea704262560a9b89832b8c3f99cc4cfa668a6d8c`. The source snapshot/file hashes are
verified by `components.lock.json`; provenance records original Core `a37f02e0`.

| Shared owner | Responsibility |
| --- | --- |
| Model `configuration.rs` | Strict configuration/input/case DTOs, field/library/lookup declarations, record selection, exact integer/boolean and legacy text arguments |
| Model `commerce_hooks.rs` | Strict source/hook/read-only-record declarations and required source-kind policy |
| Model `business_capability.rs`, `business_snapshot.rs` | Localized intent, bounded synthetic snapshot/expected decisions and declared hook/record bindings |
| Runtime `business_snapshot.rs`, `business_examples.rs` | Same synthetic snapshot-to-WIT projection and actual bounded guest/expected-decision comparison |
| Runtime `configuration.rs` | Same contribution/fee probe and exact integer result bounds |

The pure model still has no Wasmtime, SQL or network dependency. Runtime now
explicitly consumes the shared pure model and JSON types; it still has no Core,
kernel, SQL, network, identity or environment dependency. Cargo capability checks
permit that reviewed model edge while retaining forbidden-dependency controls.

Native `manifest.rs` reexports the configuration DTO. `configuration_inputs.rs`
supplies canonical field/currency/reference policies, reusing the original
verified reference owner. Native `commerce_hooks.rs` supplies real bounded Wasm
source probing. Native business-capability and runtime adapters call the same
shared rules/evaluator. Full typed package compilation retains its original order.

Exact errors/pointers, required explicit null for expected rejections, serialization
omission defaults, public library/lookup requirements, field types and bounds,
noncoercing integer/boolean arguments, printable text and exact JSON integer range
are preserved. Synthetic snapshots retain original money, quantity, duplicate ID,
record, context and outcome limits. No live records are fetched by these checks.

Selected package/digest and library record ownership, async cached preparation,
current actor rights, currency conversion, applying outcomes, B2B approval and
transactional checkout/release keep their native owners. Validating an example
neither publishes an app nor authorizes an effect. Domain business source remains
inside each original app package; independent fixtures are synthetic test copies.

## Independent acceptance

All 96 model tests pass, including six new business-contract scenarios with
negative mutations. They cover original fixtures, private or undeclared library
selection, invalid fields/arguments/currencies, unknown wire properties, required
expected-null values, host source denial, hook permissions, bounded snapshots and
expected money/context/reason codes. Integer/boolean noncoercion, exact JSON wire
range, legacy Unicode character counts and exact example pointers are retained.

All 19 real runtime guest tests pass, including two new independent business
scenarios. Changed expected values, changed guest calculations and trapping guests
reject the frozen business examples through the actual Wasm runtime. Structured
configuration executes accepted/rejected cases and actual dimension/material
contributions through the same shared executor.

`cargo run --locked --manifest-path runtime/Cargo.toml --example business_preflight`
validates and executes seven configuration and five commerce examples without
Core, SQL or paid inference. Model/runtime/storage format and warnings-denied
clippy pass. The isolated real PostgreSQL contract passes CAS/replay, transaction
rollback, package fences, installation/version/quota and job lease cases. Both
independent Linux CI jobs pass. [Component PR and CI](https://github.com/veyndo/apps/pull/12).

## Composed acceptance

A fresh native build, warnings-denied clippy and all 74 native app unit tests pass.
These include original native configuration/frozen-decision regressions. All 34
bundled packages compile and retain exact pre-extraction canonical fingerprints.

Ten actual PostgreSQL/HTTP modules pass: app components, business capability, apps,
Studio, private preview, staging, tenant isolation, visual workspace, AI app
generation and Marketplace. In particular:

- Invalid frozen expectations and trapped or wrong-ABI guests reject installation
  or bounded execution; the native Core remains healthy.
- Material library, dimensions, pure surcharge, independent B2B approval, immutable
  original order, saved configuration and a newly approved reorder stay connected.
- HTTP/MCP import, private previews, actual native surfaces/data, selected package
  release, current rights and foreign-shop denial retain their original owners.
- Local-model app generation and Marketplace order/stock/invoice/Flow plus
  restart/replay composition still use the existing platform paths.

Tests use synthetic shops and local model/provider fixtures. Cargo capability
checks retain 32 bypass controls; exact component/WIT parity, image build source
contexts, source/size/ownership, documentation/site, existing extracted Lean kernel
and negative mutation controls pass. The shared compiler/runtime, host policies
and SQL remain outside the proved kernel. Full platform coverage keeps its daily
schedule; no new full-platform/browser or provider-payment acceptance is claimed.

## Remaining work and publication

The extracted block is the shared configuration/hook/frozen-business contract and
execution layer. Full remaining native domain compilation, lifecycle and identity/
credential hosting, supported independent schema and standalone Apps API/MCP/SDK
service acceptance remain open under MKT-03b. This does not establish a complete
standalone authenticated Apps server.

Component/Core source and public handbook publication are checked separately.
A new public commerce-runtime deployment is not part of this extraction acceptance.
