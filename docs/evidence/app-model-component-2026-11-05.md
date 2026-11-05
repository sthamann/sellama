# Pure app model component: 5 November 2026

## Delivered boundary

Apps [0.3.0](https://github.com/veyndo/apps/releases/tag/v0.3.0) adds
`veyndo-app-model` 0.1.0, a pure Rust package inside the Apps component repository.
The complete platform consumes exact source commit
`eed09539b5ae058919367e41367aba419c095155`, recorded with file hashes in
`components.lock.json`. The original native owners and source commit are retained
in component provenance. The storage package reexports the model package for
hosts that need both; the model can also be used independently.

| Shared model owner | Original production behavior |
| --- | --- |
| `types.rs` | Entity, field, choice and core-extension wire types with unchanged serde defaults |
| `declarations.rs` | Model/field identifiers, budgets, choices, relationships and required native reference-policy port |
| `schema.rs`, `schema_contract.rs` | Closed supported schema grammar, bounded recursive action/native validation and escaped JSON pointers |
| `fields.rs` | Exact field types, required/unknown fields, translated values, choices and declared constraints |
| `language.rs` | Enabled-language and required main-language checks without fabricating translations |
| `publication.rs` | Public status/channel/time field declaration admission |
| `lifecycle.rs` | Initial states, permitted transitions and immutable record identity |

Native `manifest`, field/schema/language and lifecycle modules now call these
same types/functions. `model_contract.rs` maps transport-neutral errors back to
the original bad-input, conflict and validation problems with their JSON pointers.
The existing HTTP/MCP/Flow, visual/coding-agent and publication consumers keep
their native paths.

## Authority retained by the host

The pure model package has no SQL, network, Core, storage or identity dependency.
Cargo checks now include 27 negative controls; new cases reject model imports of
SQL, runtime, storage and Core. Its required `ValuePolicy` and `ReferencePolicy`
ports have no permissive defaults. Veyndo implements them with its existing money,
currency scale, rich-content, relation-shape and verified core-reference owners.
App requests cannot select or supply the host policy implementation.

Current user rights, installed-package consent, referenced-object ownership,
configuration price execution, scoped SQL, history and release authority remain
with their original native owners. The complete package compiler still includes
native action, surface, settings, runtime and commerce contracts. Model metadata
is not authorization, and this release is not a separately authenticated app host.
No production schema or role migration is introduced.

## Independent acceptance

Fourteen model tests pass without Veyndo, a database or external provider. They
include the original bounded schema/lifecycle tests and seven independent cases:

- Strict serialization rejects unknown model/field metadata and preserves absent
  legacy fields and their defaults.
- Declaration checks reject unknown types, reserved/duplicate names, invalid
  relationships, public access to private targets and invalid reference policies.
- Typed values reject coercion, invalid dates/decimals, unknown fields and denied
  external-value policies; money and content checks require the host adapter.
- French main language, a fifth enabled language, explicit null inheritance,
  explicit empty text, missing main content and disabled languages are checked.
- Workflow creation, forward/reverse transitions and immutable identity retain
  their checks. Malformed publication contracts are rejected.
- Closed schema grammar rejects external `$ref`; native/app budgets and escaped
  JSON pointers retain their distinct behavior.

Model and storage formatting/clippy pass. The component's required
[CI run](https://github.com/veyndo/apps/actions/runs/42052219519) passes model tests,
model/storage lint and its existing real PostgreSQL storage contract test.

## Integrated acceptance

A fresh native build and clippy pass. All 74 app unit tests pass, including the
native error adapters, money/rich-content ports, installed Manifest fixtures and
configuration behavior. Running the previous and new binaries over every public
app Manifest produces **the same canonical fingerprint for all 34 packages**.
Existing immutable package identities are retained.

The affected native PostgreSQL suites pass: `apps`, `app_shared_storage`,
`app_jobs`, `app_schema`, `app_core_extensions`, `native_lifecycles`,
`tenant_isolation` (43 checks) and `visual_workspace`. These exercise typed
HTTP/MCP operations, CAS, schema recovery, current grants, foreign references,
state changes, private editing, history/restore, selected publication, form
privacy and reviewed model/coding-agent application.

The independent marketplace fixture also passes its HTTP/MCP records/sync,
listing providers, native order import, replay, stock, Flow, localization and
invoice/PDF checks against local Amazon/eBay/Kaufland fixtures.

These are targeted local/component checks, not a new full daily coverage run,
strict-runtime deployment or real-provider purchase acceptance. The native main
fixture uses a local test owner; the app RLS subtest explicitly checks a restricted
role. Public browser/payment acceptance retains its existing dated evidence.

## Remaining work

MKT-03b still needs the full package and identity authority adapter, supported
standalone schema/roles and a separately hosted API/MCP service with SDK examples.
Migration/restore and full composition acceptance remain under MKT-03c. This
release completes the shared pure model boundary within that work.
