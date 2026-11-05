# Shared app placement and HTTP contracts: 5 November 2026

## Delivered ownership

Apps [0.10.0](https://github.com/veyndo/apps/releases/tag/v0.10.0) supplies model
0.7.0 from exact source `1b474bac520a5c209a7b59adb6cc1872e06dcb5b`.
`components.lock.json` verifies the full source snapshot and hashes; component
provenance records the original native owners at Core `f779dae3`.

`model/src/surfaces.rs` owns strict Surface/ApiRoute wire types and the original
placement/action/path/scope/method grammar, resource limits and problem pointers.
Native `manifest.rs` reexports the types and `surfaces.rs` adapts that same validator.
The remaining AI metadata and complete native view/behavior validators still run
in their original order; this projection does not replace the full Manifest.

| Required shared host policy | Native implementation |
| --- | --- |
| Existing native view | Original `native_views::is_native` using the complete package |
| Known private team scope | Original `auth::SCOPES` catalog |
| Read-only action effects | Original native `readonly` and direct verified `app_read_admissible` predicate |

There are no default policy approvals. Private/public action and slot permissions,
recognized placements, safe relative UI paths, known private scope names, route
method/name/scope uniqueness and limits retain the native rules. Service-hosted
UI retains its path contract; storefront blocks still require a native view.
GET uses the host effect check; `readOnly` cannot override the native mutation
exclusion for save/emit/submit. Trusted service read-only declarations retain their
existing host/package contract; arbitrary external behavior is not proved here.

Actual actor/context-bound expiring grants, current installed digest/permissions,
pinned UI bytes/CSP, HTTP dispatch, action input/output checks, MCP exposure and
current tenant/entity rights retain their existing owners. A declaration neither
starts a server nor grants access. No production table/schema/role, credential,
provider configuration, render implementation or second registry is introduced.

## Independent acceptance

All 78 model tests pass, including seven new placement/route scenarios. They cover
strict wire defaults/unknown fields, public exclusion of private actions, exact
problem pointers, required view/scope/effect policy denial, service/native path
behavior, all supported placements, path traversal/IDs/counts and route ambiguity,
public private-write denial and host rejection despite a forged read-only flag.

The executable Rust example `cargo run --locked --example surface_routes` checks
two placements/two named routes and rejects a write GET using explicit view/scope/
named read policies. It serves no app, resolves no identity and does not implement
the separate view/behavior compiler. Model/storage clippy and format pass, as does
the actual independent PostgreSQL storage/installation contract. The latter retains
CAS, atomic rollback, immutable versions, quota/replay and package/lease fencing.
[Component PR and CI](https://github.com/veyndo/apps/pull/9) pass. README contracts
are grouped into a table rather than accumulated release-note paragraphs.

## Composed acceptance

A fresh native build, clippy and all 74 native app unit tests pass. The new adapter
case checks that the real native policy rejects save/emit/submit marked read-only
while retaining native read classifications. All 34 bundled packages pass complete
native validation and retain exact pre-extraction fingerprints after the type move.

Twelve affected PostgreSQL/HTTP modules pass: apps, consent, assets, Studio,
private preview, core extensions, staging, tenant isolation, surfaces, visual
workspace, AI app generation and Marketplace. In particular:

- Actual actor/context-bound pinned UI admits the proper private/public surface;
  changed bytes, foreign actors and unavailable actions remain rejected.
- Namespaced HTTP and MCP actions return the same result and preserve current
  merchant rights. Unsafe paths, private actions on public surfaces and mutation
  GET declarations reject at installation, including a forged `readOnly: true`.
- Native/granted app data, uploads, CAS/replay, current actor rights and independent
  shop contexts keep their original admission. Deactivation removes surfaces and
  blocks routes without losing versioned data.
- Actual visual-workspace and local-model generation paths validate immutable
  drafts, open private previews and selectively release accepted packages through
  the existing owner. Private environments continue to block live service egress.
- Marketplace HTTP/MCP, sync, native order/stock/invoice/Flow and restart/replay
  composition remains green.

Tests use local synthetic model/provider services and selected Node 22 with no
paid calls. Snapshot/source structure, documentation/site, existing extracted
Lean kernel and negative mutation controls pass. Shared grammar and host/SQL/UI
paths remain outside the proved kernel. Full coverage retains its daily schedule;
this is affected acceptance rather than a new full-platform or browser render audit.

## Remaining extraction and publication scope

MKT-03b remains open for full typed native views/behavior and other domain extension
validators, identity/credential/lifecycle hosting, independent supported production
schema and standalone API/MCP/SDK service. A trusted host must connect all remaining
compiler/runtime owners; no caller may supply policy approvals through package JSON.

The component release and Core source integration do not establish a new public
commerce-runtime deployment or payment acceptance. Public handbook publication is
checked separately after the merge.
