# Complete package component acceptance, 6 November 2026

## Delivered boundary

Apps 0.15.0/model 0.11.0 owns the complete strict native `Manifest`, assembled from
all existing domain wire types. Native Core aliases that exact type. The imported
source is `a03c0e28131b407c8d86cd36542658d9e640e45f`, recorded with every file digest
in `components.lock.json`. [Component review](https://github.com/veyndo/apps/pull/14).

`manifest::common_contract` supplies the original common grammar projection.
`value_digest`, `canonical_digest` and `signature_message` preserve the original
canonical package representation. The storage package and native approval share
that implementation. Recursive object ordering also preserves native fingerprints
when a downstream host enables serde_json `preserve_order`; arrays, numbers and
negative zero retain their original semantics. Only the signature itself is
cleared from the signing message.

The shared component also owns strict artwork and payment-provider DTO/grammar,
publisher metadata/dependency rules, installed publisher/version comparison and
bounded graph checks. It rejects dependency cycles, more than 256 reachable apps
and upgrades that break active dependants. A malformed dependency range returns
a validation error instead of the previous unwrap panic.

Distribution admission retains the original metadata → actual signature verifier
→ individual dependency order. The required `SignatureVerifier` has no default
approval. Native Veyndo supplies the original Ed25519 check against the current
operator key registry and preserves native 400/403 error meanings. Unsigned
registered namespaces, service digest pins, current identity, consent, scoped
installed-package queries/locks and deactivation remain native. Payment declarations
never execute payments; artwork URL parsing performs no request.

## Independent example and checks

[The standalone package example](https://github.com/veyndo/apps/blob/main/examples/package_contracts.rs)
decodes all 34 original full packages and checks their previous fingerprints. It
signs/verifies a synthetic provider with actual Ed25519 and rejects altered rights
and a removed operator key. The deliberately public synthetic seed is example-only;
no real credentials, Core process, database or network are used.

```sh
cargo run --locked --example package_contracts
cargo test --locked --manifest-path model/Cargo.toml --tests
cargo test --locked --manifest-path model/Cargo.toml \
  --features ordered-json-compat --test package_domains
```

The independent model has 116 tests. Eight complete-package tests also run with
ordered JSON maps. They cover unchanged fingerprints, strict unknown fields,
optional/default wire behavior, full signature coverage, passive URL constraints,
closed provider identity/runtime/consent/capabilities and multi-capture dependencies.
Publisher tests cover mandatory verifier/error order, namespace and dependency
bounds, installed versions, cycles, reachable budget and active dependant checks.
The existing independent PostgreSQL storage and 19 runtime tests cover composition.

## Native composition

Native adapters retain the exact complete Manifest and compile the original full
before/common/after validator sequence. Provider implementation/financial authority
stay in Payments. The actual HTTP/PostgreSQL fixtures exercise app installation,
immutable upgrade, schema recovery, sandbox release, current rights, tenant denial,
private preview, real native views, model-generated edits and marketplace actions.
Signed publisher fixtures use the native CLI and current registered keys to reject
changed permissions/channel, unsigned namespace occupation, foreign dependencies,
incompatible upgrades, cycles and unsafe deactivation. Generic payment-provider
checks use a fresh isolated database and local synthetic service.

Final measured results:

- 116 independent model tests pass; the eight complete-package tests also pass
  with `ordered-json-compat`. All 34 native fingerprints stay unchanged in both
  configurations and in the actual final Core binary.
- 19 runtime tests, the independent real PostgreSQL contract, standalone actual
  signing example and model/storage/runtime formatting/Clippy pass.
- 74 native app tests, two native provider-contract tests, Core build/Clippy and
  all 15 targeted HTTP/PostgreSQL modules pass: `apps`, `app_studio`, `app_preview`,
  `app_schema`, `staging`, `tenant_isolation`, `app_components`,
  `business_capability`, `native_lifecycles`, `app_distribution`, `app_surfaces`,
  `visual_workspace`, `app_generation`, `marketplaces` and `payment_providers`.
- The provider fixture uses its own fresh database. It checks preserved immutable
  attempts across upgrades, authorization/void, exact capture/refund replay,
  incorrect money/account/job/duplicate receipts, disconnected method discovery
  and API/MCP availability through a local synthetic service. No real PSP is called.
- Exact source/SDK-WIT checks, 32 Cargo bypass controls, image contexts, bounded
  853-module Rust structure, 351 static API route/method pairs and documentation
  hygiene pass. The handbook builds all 398 Markdown sources into 405 pages.
- Independent [component CI](https://github.com/veyndo/apps/actions/runs/42181087745)
  passes. [Apps 0.15.0](https://github.com/veyndo/apps/releases/tag/v0.15.0) is
  published at the exact imported source commit.

These are targeted extraction checks. Complete platform coverage remains on the
existing daily schedule.

## Remaining work

MKT-03b retains final domain-policy composition, identity and the supported
standalone API/MCP host. MKT-03c retains the supported production schema, restricted
roles, durable migration/restore and composed deployment acceptance. Pure decoding,
a valid signature and declared capabilities do not supply current authority. This
acceptance does not claim a public Core runtime rollout, a real PSP transaction or
a proof of the shared compiler, SQL or host effects.
