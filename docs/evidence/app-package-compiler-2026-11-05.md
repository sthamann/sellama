# Shared common app package compiler: 5 November 2026

## Delivered boundary

Apps [0.6.0](https://github.com/veyndo/apps/releases/tag/v0.6.0) adds the model
0.3.0 common package compiler. Veyndo imports exact component source commit
`33ec599f889db83ffe1e5c7fc1108b3a6fcdae09`, with per-file hashes in
`components.lock.json` and original native ownership in component provenance.

The component owns the original common rules for:

- Identity, API/runtime/version, category, package sizes and declared capabilities.
- Model/field declaration validation and the aggregate declared-index budget.
- Configuration model/price/input bindings, source size and required capabilities.
- Action input/output schemas, identifiers, names and host-known scope declarations.
- Private/public reads, append-only form submission, leased jobs and their own
  declared completion events, payment actions, asset reads/uploads, configuration
  and Flow/effect restrictions.
- Strict legacy Slot wire types and permitted slot/component combinations.
- Event name syntax and service-runtime requirements.

`package::compile` requires explicit scope, Wasm-kind and reference policies, plus
ordered host extension validators. There are no default acceptors. The native
adapter uses its original `auth::SCOPES`, `Sandbox::component_source` and verified
core-reference guard. It invokes the complete original extension validators:

| Before common grammar | After common grammar |
| --- | --- |
| Core extensions, native lifecycles, settings, configuration inputs, presentation, ontology, schema migrations, distribution/signing, commerce hooks, business capability examples and payment contracts | Event projection/contracts, schedules, webhooks, surfaces and native views |

`manifest_validation.rs` now delegates to this same compiler. Its callers remain
native installation, review, Studio/agent editing, private preview and staging
release. The original strict full Manifest decoder remains in `manifest.rs`.
The removed contract-only native schema wrapper had no remaining production
consumer; schema tests now call that same shared contract validator directly,
while native input/output error adapters retain their consumers.

## Independent acceptance

All 34 model tests pass without Core, SQL, network or Wasm execution. Twelve new
scenario tests cover required extension failure/order, package budgets and unknown
grammar, aggregate index limits, configuration capabilities/bindings and Wasm
policy, strict Slot serialization, schema closure, private/public reads, append-only
forms, jobs, payment actions, assets and configuration/event Flow restrictions.
The policy/extension fixtures are explicit test hosts, not a production decoder,
identity implementation or real provider approval.

Formatting and model/storage clippy pass. Actual independent PostgreSQL storage
and installation tests pass, including rollback, scopes, leases, concurrent quota,
immutable package versions and package writer fencing. Required component
[CI](https://github.com/veyndo/apps/actions/runs/42070589872) passes. Its redundant
model `--lib` invocation is removed: the remaining `--tests` invocation includes
all original library tests and all model integration tests.

## Composed acceptance

A fresh native build and clippy pass. All 74 native app unit tests pass. Actual
PostgreSQL/HTTP fixtures pass for apps, consent/callbacks, app assets, shared data,
schema evolution, jobs, Studio, private preview, core extensions, native lifecycles,
staging/release, signed distribution and tenant isolation. Surface and visual
workspace fixtures run their own Core/local-model processes, without paid calls.
The Marketplace fixture retains HTTP/MCP, sync, native order/stock/Flow/invoice and
restart/replay composition.

The provider-neutral payment fixture also passes against its local service:
onboarding, native POS and checkout, embedded session binding, capture/reconciliation,
exact refunds, signed callback admission/replay, upgrade of existing attempts and
provider command/MCP/Flow integration. This fixture uses synthetic local authority
and provider configuration, not real PayPal or Shopware Payments accounts.

All 34 bundled packages also pass the full native compiler; the existing bundled
package unit case now covers all 34 instead of 16. Their fingerprints are unchanged
after extracting Slot. Source
inventory and responsibility/size checks pass. Existing extracted kernel proofs
and negative controls remain separate from the unproved compiler/host/SQL paths.
Full coverage retains its daily schedule rather than running for each commit.

## Remaining independent host work

The borrowed `Contract` is a projection of a host's complete typed manifest. In
particular, a provider-presence flag validates action grammar; it does not approve
provider metadata or grant access. A host must validate all complete extension
data through the required before/after ports. Untrusted packages, requests and
model output cannot choose the policy implementations.

MKT-03b remains open for the remaining typed domain extension compiler, identity
and credential/lifecycle hosting, supported independent production schema and
standalone API/MCP/SDK service. This release completes the shared common compiler
and keeps every native extension check connected; it does not claim the full
standalone Apps host is complete or already deployed in public commerce runtimes.
