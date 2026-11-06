# Complete standard compiler acceptance, 6 November 2026

## Delivered boundary

Apps 0.16.0/model 0.12.0 supplies the complete ordered standard package compiler.
The native Core imports exact source `292020cb9b9b1cd294d1e4ed60bcfc12842672ff`
through `components.lock.json`. Standard package admission now calls
`veyndo_app_model::compiler::compile`; the shared compiler runs the original
standard domain sequence instead of asking host before/after callbacks to remember
which domain validators to invoke.

All 19 stages retain the original order: object bindings, native lifecycles,
settings, configuration, artwork, ontology, schema evolution, distribution,
commerce hooks, business examples, payment declarations, common grammar,
subscriptions, event delivery, schedules, incoming webhooks, surfaces,
intelligence metadata and native views. An exhaustive Manifest pattern forces
an explicit compiler update when new package fields are added.

The required policy ports retain native value/reference/currency/scope/Wasm-kind,
native order base, current publisher signature, unsigned namespace, network
destination, read effect and UTC clock decisions. Native `manifest_policy.rs`
delegates to the original owners, including verified reference/public-read
predicates and actual current operator-key Ed25519 verification. The native error
adapter preserves the first model kind/pointer or actual host error. No policy
method has an approving default and no caller selects which standard stages run.

The low-level `package::compile` API remains compatible for external common-grammar
consumers; it is not the complete standard admission entry point. Native serving
code no longer keeps unused whole-domain validator wrappers. Isolated domain tests
retain their existing helpers.

## Independent example and regression

[The complete compiler example](https://github.com/veyndo/apps/blob/main/runtime/examples/package_compile.rs)
compiles all 34 complete native packages using this same compiler, explicit
synthetic host policies and the actual bounded Wasm kind parser. It requires no
Core process, database, network or credentials. All fingerprints match the original
native fixtures. Its host rejects unsupported money/richtext/relations and every
unregistered publisher signature; it is not a production policy implementation.

```sh
cargo run --locked --manifest-path runtime/Cargo.toml --example package_compile
cargo test --locked --manifest-path runtime/Cargo.toml --test complete_compiler
```

Five independent regressions cover all packages, malformed metadata in every one
of the 19 stages, first-error and host-callback order, denied native policies and
actual native view lookup. Host signature or destination rejection cannot be
replaced by successful later metadata. Standard domain validation is performed by
the shared implementation, not test-supplied callbacks.

## Composed acceptance

The final assembled Core binary passed 17 targeted HTTP/PostgreSQL modules:
`apps`, `app_studio`, `app_preview`, `app_schema`, `staging`, `tenant_isolation`,
`app_components`, `business_capability`, `native_lifecycles`, `app_distribution`,
`app_surfaces`, `app_assistants`, `app_events`, `visual_workspace`, `app_generation`,
`marketplaces` and `payment_providers`. These exercise installation/immutable
updates, schema recovery, private preview/publication, cross-tenant denial,
order/RFQ lifecycles, leased event delivery, real schedule/webhook paths,
AI editing and local synthetic provider contracts.

Additional acceptance:

- Independent model: 116 tests; the CI ordered-JSON compatibility run adds eight
  cases against the same wire contract. Independent runtime: 24 tests, including
  the five complete-compiler regressions and all 19 invalid-domain controls.
- Native units: 74 app tests and two payment-provider contract tests.
- All 34 native package fingerprints match their pre-extraction values.
- Native and independent Clippy checks pass with warnings denied. Structure
  checks cover 858 Rust modules and 351 static API routes; workspace boundary
  checks retain 32 rejection controls. Source pins and WIT remain consistent.
- Unchanged extracted Lean policies pass their existing checks; mutation checks
  reject 187 broken policies, 14 unsupported syntax forms, three stale bindings,
  nine proof shortcuts and ten proof/module layout bypasses. This does not prove
  the compiler, adapters or SQL.

[Apps PR 15](https://github.com/veyndo/apps/pull/15) records the independent Linux
runtime and PostgreSQL CI runs. [Apps 0.16.0](https://github.com/veyndo/apps/releases/tag/v0.16.0) retains exact source
`292020cb9b9b1cd294d1e4ed60bcfc12842672ff`; the composed tests above use that source.
Only affected tests ran locally; the complete Core suite retains its daily cadence.

## Remaining boundary

APP-01 is complete for distributable standard package validation and bounded Wasm
execution. MKT-03b/c and APP-02..05 still track independent identity, supported
schema/API/MCP hosting and full durable standalone operation. Actual source
preparation/ABI verification, installation consent, live identity, referenced-object
ownership, signed database scope and transactional effects retain their existing
owners. These library/local integration checks do not establish a new public Core
runtime rollout or a proof of shared compiler/SQL/host code.
