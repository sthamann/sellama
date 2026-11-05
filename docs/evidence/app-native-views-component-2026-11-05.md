# Shared native app views and UI behavior: 5 November 2026

## Delivered ownership

Apps [0.11.0](https://github.com/veyndo/apps/releases/tag/v0.11.0) supplies model
0.8.0 from exact source `e8a064f6035b02ebdaf2321ecc13990a3cf130e7`.
`components.lock.json` verifies the source file set and SHA-256 contents. Provenance
records the original native owners at Core `65d32d3d`.

| Independent owner | Shared responsibility |
| --- | --- |
| `view_types.rs`, `ui_ast.rs` | Strict localized native views/controls and behavior wire types |
| `form_layout.rs` | Twelve-column geometry, presentation and tab-order budgets |
| `view_binding.rs` | Context keys, declared core references and matching editor mounts |
| `ui_logic.rs`, `ui_logic_types.rs` | Bounded UI statements, expression/control types and surface allowlists |
| `views.rs` | Complete native view validation and selected metadata/action/navigation projection |

Native `native_views.rs` now adapts this same compiler with a borrowed projection
of the complete typed package. Original validation order, bad-input/problem kinds,
exact action-binding JSON pointers and serialization are preserved. Native field
validation supplies canonical locale, money/currency scale, rich-content and
relation policies. Public reads retain the direct existing verified
`app_read_admissible` predicate. Required policies have no permissive defaults.

The original renderer/interpreter, current actor/context/digest surface grants,
package authority, pinned UI/CSP, scoped data/reference checks, action gateway,
API/MCP effects and sandbox/release stay connected to their existing owners.
Selected view payloads are projected only after normal surface admission; they
neither read records nor authorize execution. No schema/table/role, token issuer,
second runtime, commerce ledger or user-facing editor replacement is introduced.

## Independent acceptance

All 90 model tests pass. The eleven added native-view cases plus the moved
object-key regression cover strict syntax, unknown properties, geometry overflow
and limits, control/field types, localized literal policy, exact error pointers,
public writes, unlisted actions, mismatched form/save models, container ownership,
editor references/mounts, behavior limits, unknown targets and prototype/path keys.
The original care-studio view contract is retained as a standalone fixture.

The executable Rust example `cargo run --locked --example native_views` compiles a
localized form with graphical layout and validate/save behavior without a Core
binary or database. Component CI runs it alongside the other examples and model
checks. Model/storage format and clippy pass. The actual isolated PostgreSQL
contract passes record scope/CAS/replay, hook/outbox rollback, immutable install
versions, quota contention, package fences and job lease/reconnection cases.
[Component PR and CI](https://github.com/veyndo/apps/pull/10).

## Composed acceptance

A fresh native build, warnings-denied clippy and all 74 native app unit tests pass.
The moved object-key test runs in the component; a new native adapter regression
checks original verified public-read and currency policies and compiles a localized
assignment through the actual complete package compiler. Invalid locale assignment
is rejected there. All 34 bundled app packages validate and retain exact
pre-extraction canonical fingerprints.

Twelve affected PostgreSQL/HTTP modules pass: apps, consent, assets, Studio,
private preview, core extensions, staging, tenant isolation, surfaces, visual
workspace, AI app generation and Marketplace. Existing native surfaces, granted
reads/writes, API/MCP actions, versioned drafts, actor-private previews and selective
release use the extracted model. Studio HTTP import also rejects unknown behavior actions, overflowed geometry and
257-step programs; the accepted staged registry retains the typed save behavior.
Tests retain cross-shop denial, current rights,
private egress restrictions and immutable package checks. Marketplace composition
retains native order/stock/invoice/Flow and restart/replay behavior.

Tests use synthetic shops and local model/provider fixtures without paid calls.
Source snapshot, size/ownership, documentation/site, existing extracted Lean kernel
and negative mutation controls pass. The shared UI compiler and host/SQL/runtime
remain outside the proved kernel. The complete platform suite keeps its existing
daily schedule; this acceptance covers affected paths and makes no new browser
render or live payment claim.

## Remaining scope and publication

MKT-03b remains open for the remaining typed domain extensions, identity/credential
and lifecycle hosting, supported independent production schema, standalone API/MCP
and SDK service examples. These pure contracts are reusable now; a separate
running Apps service is not yet accepted.

The component and Core integration are published separately from the handbook.
This extraction does not change the deployed public commerce runtime. Public
handbook publication is verified after merge.
