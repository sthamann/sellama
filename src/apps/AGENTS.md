# src/apps ownership

Root AGENTS.md also applies. Rules below were moved from the root, not weakened.

## Extension platform v2 ownership

Read `docs/app-platform.md`, `docs/app-security.md` and `docs/app-studio.md` before
changing apps. `src/apps/` owns canonical manifest validation/signing, explicit
consent, scoped callback identities, surface grants, tenant-specific logical schemas and
migrations, secrets, leased jobs and event delivery. Native app assets call the
existing `src/assets/` owner; exports use the same private asset path. Never add
parallel SQL stores, upload owners or direct core-API bypasses.

External credentials must bind to canonical approved package digests; remote UI
bytes need operator hash pins. Publication must not bypass installation consent,
current creator permissions, dependency checks, row/byte quotas or forced RLS.
`crates/apps/src/sandbox_engine.rs` is the shared Wasm engine. Prepare/probe bounded modules
before commerce transactions; WIT hooks consume bounded read-only snapshots and
use the existing native money/tax calculation owner.

Pure model types, declarations, bounded schemas, field/language checks, publication
contracts and record workflows belong to `veyndo/apps` model/. Core consumes its
pinned `veyndo-app-model` package. Native adapters preserve problem kinds/pointers
and call existing currency/content/reference policy owners; actual identity,
package authority, referenced-object ownership and database scope remain native.
Never duplicate validators or introduce permissive policy defaults.
Shared settings declarations, partial updates and secret-safe projections belong
to model/settings; schema change types, compatibility/shape planning and exact
conversion belong to model/evolution. Native settings routes retain personal live
administrator/digest/CAS checks and encrypted secret writes. Native schema_upgrade
and upgrade_review retain selected version paths, scoped locks, bounded recovery,
actual field/reference/language validation and all-or-nothing record/package/events.
Do not treat a pure plan or encoded settings result as storage/authority approval.

Shared event subscription/privacy/filter/delivery declarations and cron/webhook
contracts belong to model/events, subscriptions and triggers. Event Context must
come from the complete admitted package, never request permissions. Native destination
policy remains mandatory; actual DNS/pinned egress, current package/roles, secrets,
signatures, replay receipts, SQL leases and durable ticks keep their original owners.
Filters evaluate projected payloads only. Schedule validation receives host UTC time;
private environments and tenant pauses still block native effects. Never treat
pure eligibility or a declared scope as current dispatch authority.

Shared object-binding declarations and intelligence metadata/mapping/projection
belong to model/object_extensions, intelligence and ontology. Native validators
retain their original order. Graph input must be current authorized app/entity rows
from data or extension_projection, never caller-supplied tenant/role authority.
Current native object/PII checks, immutable reference ownership, MCP/agent opt-in
and the verified configuration-release predicate stay attached. Edges are reference
metadata, not target reads or confirmed product claims; do not add a graph ledger.

Shared Surface/ApiRoute types and placement/route grammar belong to model/surfaces.
Native policies must retain actual native view lookup, auth::SCOPES and the direct
verified read predicate; never replace them with default approvals or readOnly
metadata alone. Preserve complete native view/behavior validation after surfaces,
current actor/context/digest grants, pinned UI/CSP and action input/output admission.
A declaration is neither a running route nor a grant. Native problem kinds and
exact JSON pointers retain their original API/UI meaning.

Shared native view/control/geometry/behavior types and compilation belong to
model/views, ui_ast, form_layout, view_binding and ui_logic/type checks. Native
native_views adapts the exact shared compiler with field_values::Policy and the
direct verified public-read predicate. Preserve native field policies, validation
order, error pointers and canonical package bytes. Project view payload only after
current surface admission; actual rendering/interpreting, actor/context/digest
grants, gateway effects, reference ownership and release keep their native owners.
Never treat validated UI code or a projected payload as execution authority.

The shared `package::compile` grammar requires native before/after domain extension
validators and scope/Wasm-kind/reference policies. Preserve their complete original
order and typed Manifest projection in `manifest_validation.rs`; never approve
provider or extension metadata from a projection presence flag. Full strict decoder,
identity and trust remain native. Do not add a parallel common grammar or default
acceptors for domains a host has not implemented.
Shared action/current-scope and callback grant planning now live in the component
admission module; native adapters must derive their authority from RequestContext,
never app input. Component package locking reuses the original transaction/key;
full typed digest comparison, reserved package trust, credential persistence and
the verified callback predicate remain native. Do not replace them with caller
flags, cached approvals or a second token issuer.
The component installation sequence owns the existing locks/quota/version/event
writes. `package_install.rs` must provide all native compiler/trust, commerce,
dependency, checked migration, model, default and schedule hooks on the original
transaction, with original lock order and error rollback. Do not introduce a
no-op production hook, early commit or caller-selected mutable preview mode.

Visual edits and coding-agent output share the same Manifest/AST. F5 is actor-private
and expires; it cannot call services, change live core data or release packages.
Draft CAS conflicts remain visible and do not overwrite another editor. Interface
text uses existing typed vocabularies; dynamic content uses one selected language.
New runtime routes/fields must remain aligned across API/MCP/Flow/Studio and get
real own/foreign-tenant regression checks. Never describe iframe CSP as total
hostile-code containment or local worker limits as fleet-wide admission.

### App ontology ownership

Optional `intelligence.ontology` belongs to the canonical native app manifest.
`src/apps/ontology.rs` adapts the shared model graph projector using fields/current
revisions from the existing permission- and tenant-scoped native list. API, MCP and planner context
consume this same view; App Studio and coding agents edit the same schema.
Namespace app-owned node/edge types. Keep graph labels in `LocalizedField` and the
shared content-language inheritance system; ship UI vocabulary in EN/DE/FR/ES.
Never create another app knowledge database/ledger, bypass native reference FKs,
or treat these records as confirmed product claims. Source admission and merchant
fact confirmation still belong to the existing product claim compiler.

### App patterns belong to plugins

First-party domain app patterns live in `extensions/apps/<app>/manifest.json`,
including `returns-workspace`, `product-advisor` and `erp-handoff`.
The App Studio recipe picker only clones these canonical packages and uses the
existing Manifest compiler. Keep app-owned models, UI, AST and event declarations
in their package; never reimplement returns business logic in `src/` or the picker.
The Rust core owns shared admission, tenant storage, reference validation and the
bounded runtime. Install/review patterns in an actor-private preview or staging
before an explicit release. Returns records are private, order-bound app data;
they do not authorize refunds, change order/payment states or bypass Payments.

### All plugin/app files remain under their package owner

Every plugin keeps its implementation, native Manifest/AST, UI, styles, translations,
assets, templates and app-local tests in `extensions/apps/<app>/` (or its independent
private repository). Installation/release registers immutable packages and app data;
it never copies source into `src/`, `frontend/src/`, shared system folders or core
migrations. The same rule applies to AI-generated apps. Database schema belongs to
the existing app migration contract, not a second manually installed core schema.

Host routing/registration, generic runtime/rendering, authorization, callbacks and
shared SDKs may reference app-owned packages; they must not own app business logic.
Shared connector hosting belongs to `extensions/services/connectors/src/`; Email,
Google Analytics, Gmail and Slack implementations stay in their app roots. The
connector entry binary is separate from the commerce library. Plugin frontend modules
receive the same architecture, localization and coverage gates as the host frontend.
`scripts/testing/plugin_ownership.py` rejects known leakage paths and unsafe pattern
access. Folder containment does not itself prove runtime isolation: declarative
apps use the bounded host/F5 runtime, network apps use the existing service gateway.
The legacy PayPal compatibility adapter remains host-native for old configured
payment attempts; it is app-owned and must never be called sandboxed. New external
providers use the generic remote contract. Removing that compatibility path requires
an explicit existing-attempt/provider migration, not a cosmetic file move.


## Structured configuration ownership

Read `docs/furniture-configurator.md` before extending configuration. App packages
own library schema, dimension rules and frozen cases. Generic configuration modules
reuse field validation, no-import bounded guests, native currencies, cart/channel
admission and exact B2B approval. Saved lists store inputs only; completed orders
retain accepted package/material snapshots. Never trust a caller-authored fee or
restore an old list price. HTTP/UI and declared MCP configure actions share the
same owner; MCP opt-out does not disable HTTP. Configure is not a Flow action.
Minimized `app.configuration.changed` events use the existing atomic outbox and
Flow consumer without cart tokens or free input text. Purchase projections require
current orders.read independently of Manifest metadata and filter by app before
pagination. No furniture rule, second pricing store or app-specific SQL table in Core.
