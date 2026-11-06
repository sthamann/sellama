# Native lifecycle component acceptance, 6 November 2026

## Delivered boundary

`veyndo/apps` release 0.14.0 supplies model 0.10.0. The Core imports the exact
reviewed source at `3f5f46c70c1f4a489e6c419d9d0054b5f5f208f8` through
`components.lock.json`. [Apps pull request](https://github.com/veyndo/apps/pull/13).

The shared package owns strict native lifecycle declarations and extended graph/
accepted-snapshot wire types, deterministic app namespaces, bounded graph
composition, frozen version/digest policies, required-main-language validation,
current-permission/fact narrowing and label-only customer projections. Native
Core calls that same implementation rather than keeping a second compiler.

Required trusted-host policies supply the original order base, known scope
catalogue and locale grammar. Native adapters compute each digest from the full
canonical admitted Manifest. Native order-base/domain validation remains in
`commerce/order_machine.rs` through `OrderMachineValidation`; the pure commerce
calculation crate gains no dependency on Apps. The native verified final transition
predicate remains directly consumed. Current identity, payment/delivery/buyer
checks, package locks, capture and transactional order/quote effects retain their
existing owners.

## Independent use

[The executable lifecycle example](https://github.com/veyndo/apps/blob/main/examples/native_lifecycles.rs)
compiles an order quality-review step and a quote technical-review step without
Core, SQL, inference or credentials. It checks that revoked current permission
blocks eligibility and that customer projection keeps accepted labels without
policies. Its package and base graph are synthetic fixtures; a production host
must provide its admitted full package and validated native graph.

```sh
cargo run --locked --example native_lifecycles
cargo test --locked --manifest-path model/Cargo.toml --test native_lifecycle
```

Standalone tests cover missing consent, unknown objects/versions/scopes/guards,
state/transition bounds, invalid identifiers, competing native replacements,
stranded/duplicate paths, terminal exits, forbidden payment/buyer replacement,
main-language fallback, explicit empty translations, strict unknown-field
rejection and frozen snapshot revision/object/version behavior. Actual current
permissions are supplied to each eligibility check. Invalid accepted snapshots
fail with `Conflict`; they do not silently adopt a new current graph.

## Composed acceptance

The native HTTP/PostgreSQL/MCP fixture runs actual app installation and consent,
checkout-created orders, delivery transitions, changing role permissions, MCP
completion and transition activity. Existing orders retain their accepted app
version after upgrades; new orders receive the new version. It also exercises
customer/company-bound RFQs, technical review, native offer/acceptance, selected
sandbox publication, foreign-shop denial, stale revisions, fifth-language labels,
atomic language/release rejection and concurrent installation/configuration races.

The affected app/runtime, Studio/private preview, staging, B2B, merchant order,
tenant-isolation, visual workspace, generation and marketplace fixtures are run
against the assembled local binary with PostgreSQL and synthetic provider fixtures.
Exact source and SDK/WIT byte checks, unchanged bundled package fingerprints,
Cargo dependency controls and scoped formal checks accompany that integration.
Measured results:

- 104 independent pure model tests and 19 runtime tests pass; storage, model and
  runtime formatting/Clippy pass. The independent PostgreSQL contract passes.
- 74 native app unit tests and the native order-base test pass; Core Clippy passes.
- All 13 affected HTTP/PostgreSQL modules pass: `native_lifecycles`,
  `merchant_operations`, `b2b`, `app_components`, `business_capability`, `apps`,
  `app_studio`, `app_preview`, `staging`, `tenant_isolation`, `visual_workspace`,
  `app_generation` and `marketplaces`.
- All 34 canonical bundled Manifest digests remain identical. Exact source/WIT
  checks pass; Cargo dependency checks retain 32 bypass negative controls.
- Structure checks cover 846 bounded Rust modules and 351 static API route/method
  pairs. Documentation hygiene and the generated handbook checks pass.
- Independent [storage/runtime CI](https://github.com/veyndo/apps/actions/runs/42178507034)
  passes. [Apps 0.14.0](https://github.com/veyndo/apps/releases/tag/v0.14.0) is
  published at the exact imported source commit.

These are targeted checks for this extraction; the complete platform suite and
coverage keep their existing daily schedule.

## Remaining work

MKT-03b remains open for the complete typed domain-extension/compiler surface,
identity and independent API/MCP host. MKT-03c still requires the supported schema,
restricted roles, restore/migration and durable deployment acceptance. These
library and local integration checks do not constitute a public Core runtime
rollout, a new real provider test, or a proof of the shared compiler/SQL/host code.
