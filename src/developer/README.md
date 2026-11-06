# src/developer

This folder owns the Rust modules listed below. Each source begins with its responsibility contract. The crate currently shares internal types/imports through a facade; APIs, MCP and UCP delegate to shared domain operations.

- [`archive.rs`](archive.rs): Recoverable App Studio project deletion; installed packages and app records retain their independent lifecycle.
- [`version_storage.rs`](version_storage.rs): Required native current environment/compiler/actor/installer admission for the shared version/staging component.
- [`builds.rs`](builds.rs): Immutable development versions are validated before storage; installation targets only private environments.
- [`generation.rs`](generation.rs): Structured provider output becomes a reviewable immutable manifest; it cannot write files or call shell tools.
- [`mod.rs`](mod.rs): Prompt-generated declarative apps and native coding-agent handoff, never unsandboxed model code.
- [`routes.rs`](routes.rs): Developer HTTP transport and coding-agent task export; explicit staging precedes live release.

The [source inventory](../../docs/module-inventory.md) is checked in CI. [The behavioral map](../../docs/source-map.md) identifies integration suites, and [testing](../../docs/testing.md) describes actual coverage and limits. Every file is limited to 320 lines; `main.rs` to 120.

Generation keeps existing same-identity action access settings; new synthesized native actions default to MCP off. Task exports include the editor reference, choice, automation and scope contracts documented in [guided apps](../../docs/app-assistants.md).

`generation_brief` compiles bounded empty-private-app model/settings/placement descriptions into ordinary native views, bindings and handlers. It does not own an app business model or another executor. `generation_bindings` shares the SDK asset declarations and completes missing canonical data bindings without broadening explicitly restricted surface action lists. All outputs still pass the current native validator and package admission.

Immutable Studio persistence, original serialized digests, bounded history,
recoverable archive and row-locked staging belong to pinned Apps build_versions.
Native routes retain current developer access, live scope, explicit approval and
minimized prompt/evidence projection. version_storage must validate owned private
environment, typed compiler and current actor scopes, then call the actual
installer on the original privileged transaction. No default/no-op production
admission, parallel SQL workflow or commit after failure. Mutable drafts remain
actor-private in drafts.rs; live release retains its selective rights/CAS owner.
