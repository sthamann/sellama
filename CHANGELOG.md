# Changelog

## PayPal Sandbox through independent Checkout

- Let enabled test shops route new PayPal Sandbox purchases through Checkout
  and reuse the native payment attempt, reconciliation and refund paths.
- Verify the payment account environment inside the Commerce transaction and
  exercise lost-response recovery and refunds with local provider fixtures.

## App-owned MCP views in conversations

- Let installed apps attach read-only tables and cards to merchant and shopper
  responses. The same resource works through MCP Apps discovery and reads.
- Filter those results in either conversation using choices declared by the
  installed app. Keep the original product and other filters in each follow-up.
- Keep resource reads and pagination scoped to the active app revision and
  current actor. Provide a Product Guide package with public and private views.

## Assistant answer formatting

- Render tables, lists and emphasis in the storefront assistant and Studio.
  Product links and checkout actions remain in their native controls.
- Document the one-page PayPal checkout and the separate SDK reference.

## Orders and shipping in agentic workspaces

- Show current shipping policy alongside native order work in Studio and
  provide a read-only example for independent Commerce and Knowledge hosts.
- Compare shortlisted catalog products in the storefront assistant and open
  their native product pages for variant selection and purchase.

## Commerce host ports for Checkout

- Core supplies scoped quote, simulated confirmation and receipt operations for
  an independent Checkout client. Native and embedded purchases share the
  same Commerce transaction.
- Split preparation, lock and replay admission, pricing, and commit into Rust
  stages. Receipt recovery reads the original purchase without a cart token.

## Native and embedded checkout compatibility, 9 November 2026

- Verify equivalent native and transferred carts in one shop. Both reject
  a changed total and replay the original order with one stock decrement
  and one order event per purchase.
- Record simulated public purchases, cart clearance and the shared payment
  and recovery contract in the component handbook.

## Shared Flow draft validation

- Check the same draft in Studio, over HTTP or from an MCP client before saving.
  The check uses current shop rights, dependencies and revisions. A dedicated
  endpoint and MCP tool keep validation safe if a client reaches an older Core.

## App worker queue diagnostics, 9 November 2026

- Report due Flow and app delivery ages in private worker logs. The read uses
  existing database indexes and leaves checkout independent.

## App worker handoff, 8 November 2026

- Allow Core to hand Flow execution, app scheduling and app deliveries to a
  separate worker while it continues to accept orders and record events.
- On shutdown, app tasks stop taking new work and get up to 15 seconds to
  finish current operations. Durable job state supports restart and rollback.

## Portable Flow directives, 8 November 2026

- Resolve validated Flow steps as typed Rust directives for conditions,
  actions, delays and stops. Core uses the same targets to validate and run
  the graph, and borrows them when continuing from a saved cursor.
- Test a delayed order Flow across a separate app worker restart while the
  HTTP shop continues to serve traffic and replays the original order.

## Flow job storage, 8 November 2026

- Claim a ready Flow and load its checkpoint together. Scope progress,
  deferral and completion to that execution attempt.
- Return a deferred job to the queue without also attempting to finish it.
  Retain saved step receipts and current permission checks on resume.

## Embedded checkout recovery, 8 November 2026

- Reopen the exact Veyndo order from its embedded checkout receipt. A resumed
  order stays bound to its cart and preserves the regular storefront cart.
- Recover a hosted checkout even if its window closes before sending the order
  notification. An explicit reopen uses the original order or transfers the same
  open cart with a fresh ticket.


## Service workspace composition, 6 November 2026

- Released SDK 0.3.0 with separately authenticated service discovery, trusted read
  view bindings and a bounded versioned agent layout contract.
- Native reviewed Products/Orders/Customers OpenUI workspaces consume the same
  layout admission. Current domain/PII/criteria and intake rights remain enforced.
- Context and discovery changes cancel reads and discard late results; failed
  services retain explicit availability without disabling healthy independent views.
- Added executable two-service example, hostile-input/race/wire tests and updated
  the component plan to prioritize cross-service delivery, checkout and knowledge.


## Independent App job supervision, 6 November 2026

Apps 0.29.0 / Data service 0.5.0 supplies bounded job history/detail and approved
cancel/retry/resolve/archive through HTTP, MCP and the unchanged SDK, without Core.
Native Veyndo uses the same current-package/current-rights result redaction and
queued-event selector. The explicit schema-5 nonowner profile cannot enqueue or
forge worker input/results. Personal live authority, exact approval, original
leases/CAS and atomic events remain enforced. Actual worker execution, producer
provisioning and callback evidence retain their separate owners.
[Setup and SDK](docs/app-job-supervision-service.md),
[acceptance](docs/evidence/app-job-supervision-component-2026-11-06.md).

## Documentation delivery timeout, 6 November 2026

The GitHub Pages deployment action now waits up to twenty minutes for file
synchronization, inside a bounded twenty-five-minute job. Two observed deployments
were canceled by its default ten-minute action timeout while still reporting
`syncing_files` without a provider error. Build/link checks and deployment
permissions are unchanged.

## Independent App package installation, 6 November 2026

Apps 0.28.0 / Data service 0.4.0 lets developers review and install a private data
App, configure its encrypted settings and use its records without Core, through
HTTP, MCP and the existing SDK. It uses the complete shared compiler, original
atomic installer and extracted native model installer. The explicit schema-4
profile adds immutable versions and protected usage accounting in fixed shared
tables. Current personal live administrator authority, exact digest/permission/
revision approval and original per-App row/byte budgets remain enforced.
Native Veyndo delegates model installation with its actual compatibility policy
on the original transaction. Native resource resolvers, jobs, restore and release
hosting remain open. [Setup and example](docs/app-package-installation-service.md),
[acceptance](docs/evidence/app-package-installer-component-2026-11-06.md).

## Independent encrypted App settings, 6 November 2026

Apps 0.27.0 / Data service 0.3.0 adds an explicitly enabled settings profile.
HTTP, MCP and the existing JavaScript SDK use the same declared partial-update,
encrypted CAS/package binding and secret-safe projection as native Veyndo. The
fixed identity owner must confirm a personal live administrator with current
apps.read, apps.manage and team.manage; machine keys and delegated agents cannot
supply these claims. A separate operator encryption key and explicit schema-3
migration grant only settings storage. Native package installation, private
stage restrictions and current verified administrator admission retain their
owners. [Setup and example](docs/app-settings-service.md).


## Managed App Data writes, 6 November 2026

Apps 0.26.0 / Data service 0.2.0 adds explicit portable record writes and retained
history to the independent host. Current merchant/action rights, confirmation,
package digest, record CAS, typed fields, states, immutable identity and minimized
atomic outbox share one transaction. The deliberate schema-2 upgrade grants only
managed changes; package/model/schema mutation and native policy fallbacks remain
unavailable. Veyndo consumes the same original lifecycle/history hooks with its
full native admission. [Guide](docs/app-data-writes.md),
[acceptance](docs/evidence/app-data-managed-writes-component-2026-11-06.md).

## Independent App Data reader, 6 November 2026

Apps 0.25.1 adds a standalone read-only Rust HTTP/OpenAPI/MCP host with existing
SDK/Fetch examples, fixed reader schema and current merchant/action admission.
One restricted PostgreSQL login and signed forced RLS isolate shops; the serving
process has neither schema-install nor data-write authority. Veyndo shares actual
page/filter preparation, declared-field projection and original role-bound scope
tickets with this component. Existing runtime introspection moves to the same
feature-scoped authority library. Core retains task context, pools, provisioning
and complete installer/privacy/write policies. [Guide](docs/app-data-service.md),
[acceptance](docs/evidence/app-data-reader-component-2026-11-06.md).

## Independent App Runtime service, 6 November 2026

Apps 0.24.0 adds a standalone Rust HTTP/OpenAPI/stateless MCP server over the
existing bounded WIT engine. Typed synthetic input and explicit no-effect results,
fixed fresh OAuth introspection, source/input fingerprints and disconnect-safe
global/tenant/subject limits keep the operation independently usable. Fetch and
the existing SDK use the same operation without Core or PostgreSQL. Model 0.13.0
exposes original frozen-value bounds while preserving full native contextual
validation. Independent process tests, non-root container and affected native
flows retain distinct evidence. [Guide](docs/app-runtime-service.md),
[acceptance](docs/evidence/app-runtime-service-component-2026-11-06.md).

## Schema recovery component, 6 November 2026

Apps 0.23.0 extracts actual bounded field migration and recovery capture into the
independent storage crate. Required native field/language validation stays on the
original installer transaction; tenant/package fences and final reference admission
remain attached. Original old-field projection, row/byte limits and atomic event
are retained. Exhausted record revisions return a conflict after validation.
Independent PostgreSQL and native API regressions cover scoped snapshots, rollback,
limits, disabled languages and exhausted revisions.
[Evidence](docs/evidence/app-schema-recovery-component-2026-11-06.md).

## Package state component, 6 November 2026

Apps 0.22.0 owns original activation/deactivation ordering, lifecycle fences,
active-dependant query and revision CAS. Required native hooks keep actual current
configuration/actor/trust/commerce/lifecycle and connected frontend admission.
Data, version, credential and job lifecycles remain separate; original error and
same-state revision semantics remain. Real PostgreSQL tests exercise both orders
of shared install/deactivation contention, writer exclusion, host denial, CAS,
rollback and revision exhaustion. [Evidence](docs/evidence/app-activation-component-2026-11-06.md).

## App record history component, 6 November 2026

Apps 0.21.0 owns original immutable record capture, retained historical read
scopes/actor/source, bounded listing and restore orchestration. Required host
current rights and actual normal writer preserve entity/field projection, review,
package/reference/lifecycle/CAS and atomic history/outbox. Restoration creates a
new revision; original 20-revision/16 MiB scoped retention remains. Independent
PostgreSQL checks exercise actual retention, stale/denied/concurrent restores and
history/audit failure rollback. [Evidence](docs/evidence/app-record-history-component-2026-11-06.md).

## Private Studio draft component, 6 November 2026

Apps 0.20.0 owns the original mutable private autosave/list/delete workflow.
Strict shared Manifest decoding and raw submitted fields, 64 KiB budget, actor
advisory/row CAS fences, 20-draft quota and mandatory same-connection environment
ownership remain connected. Core retains current actor/developer/signed-scope
admission and caller commit/rollback. Drafts do not install, publish or alter
immutable versions. Independent PostgreSQL regressions cover actor/tenant scope,
concurrent create/update/quota, rollback/reconnect and byte/revision boundaries.
[Evidence](docs/evidence/app-private-drafts-component-2026-11-06.md).

## Agentic service UI and checkout architecture, 6 November 2026

Recorded the checked operation/view/SDK foundations and missing output semantics,
cross-service UI host and common generation contracts. Added a component-wide UI
coverage matrix, standalone/embedded/agent-host delivery and planned OpenUI/A2UI/
MCP Apps adapters. Checkout is an explicit independent Rust service/API/MCP/SDK/UI
target with one transactional commerce commit owner and full standalone/native/
Storyfront return/cart/refund acceptance. These are designs and open implementation
tasks. [UI direction](docs/agentic-component-ui.md), [Checkout](docs/checkout-component.md).

## App Studio version component, 6 November 2026

Apps 0.19.0 owns immutable development snapshots and original serialized-byte
digests, bounded active/archive history, recoverable project archival and the
actual row-locked private-stage workflow. Required native environment/compiler/
current-actor/installer admission retains the original transaction and authority.
Installed packages/data remain independent of Studio archival; failures roll back
install and stage state together. Independent PostgreSQL cases cover concurrency,
immutable archived versions and admission/install/state failures. [Evidence](docs/evidence/app-studio-versions-component-2026-11-06.md).

## Encrypted app configuration component, 6 November 2026

Apps 0.18.0 owns existing encrypted settings/transport metadata, internal resolution
and rotation through mandatory host crypto. Native keys, current administrator
admission, consent, declared kinds, sandbox exclusion and safe projection retain
their owners. Original AEAD binding, scoped locks, CAS/current-package checks,
webhook read fencing and atomic outbox are shared. Exhausted revisions reject
instead of overflowing. Independent PostgreSQL and executable ephemeral-key example
cover real AEAD, concurrency and rollback. [Evidence](docs/evidence/app-encrypted-configuration-component-2026-11-06.md).

## Durable app job workflows, 6 November 2026

Apps 0.17.0 owns bounded scoped job history/detail and the original merchant
cancel/retry/resolve/archive transaction. Core reuses that implementation through
a mandatory current-action/right/input retry hook; identity/package admission and
response redaction remain native. CAS, explicit outcome review, cancellation leases,
retry actor/package reset and atomic outbox preserve their original behavior.
Independent PostgreSQL cases cover concurrency, foreign cursors and rollback; a
standalone example runs then rolls back. [Evidence](docs/evidence/app-job-workflows-component-2026-11-06.md).

## Complete standard app compiler, 6 November 2026

Apps 0.16.0/model 0.12.0 owns all 19 standard validation stages in their original
native order. Core calls that same full compiler with mandatory original native
policies; whole-domain before/after host callbacks and unused serving wrappers are
removed. Native errors, verified policy owners, current identity/consent, source
preparation, locks and effects remain attached. The independent example compiles
all 34 native packages; regressions cover every domain, first-error/callback order
and denied policies. APP-01 is complete; independent identity/service work remains.
[Implementation and acceptance](docs/evidence/app-complete-compiler-component-2026-11-06.md).


## Complete portable app package contracts, 6 November 2026

Apps 0.15.0/model 0.11.0 shares the complete strict Manifest, original package
fingerprint/signing message, passive artwork and payment-provider grammar plus
publisher/dependency graph rules. Core aliases that exact wire model; native
operator Ed25519 verification, reserved namespaces/service pins, current identity,
scoped locks and actual financial effects remain attached. Thirty-four complete
package fixtures retain their fingerprints; the standalone example checks actual
Ed25519 with synthetic keys and rejection of tampering/revocation.
[Implementation and acceptance](docs/evidence/app-complete-package-component-2026-11-06.md).


## Shared native app lifecycle compiler, 6 November 2026

Apps 0.14.0/model 0.10.0 shares exact native order/quote graph and accepted snapshot
contracts, bounded compilation, locale/fact narrowing and label-only projection.
Native adapters retain complete package digests, base-domain validation, current
identity/permissions, locks and the direct verified final transition check. Existing
orders and RFQs keep their accepted policy across upgrades and selected release.
An independent Rust example compiles both graphs without Core or PostgreSQL.
[Implementation and acceptance](docs/evidence/app-native-lifecycle-component-2026-11-06.md).


## Shared executable app business contracts, 6 November 2026

Apps 0.13.0/model 0.9.0 shares configuration/library/argument and typed-hook/frozen
business contracts. Runtime 0.2.0 consumes those pure types for the same WIT
projection, actual guest comparison and bounded contribution execution used by
native installation and checkout. Canonical host policies, compiler order,
source/current-package/library fences and release remain attached. Independent
preflight validates and executes seven configuration and five commerce cases.
[Implementation and acceptance](docs/evidence/app-business-contracts-2026-11-06.md).

## Independent app Wasm and WIT runtime, 5 November 2026

Apps 0.12.0 supplies `veyndo-app-runtime` 0.1.0 with the actual bounded executor,
required resource admission and explicit namespace configuration. Native adapters
keep the direct verified resource predicate, original preparation/cache, current
package authority, snapshots and checkout/release consumers. Independent guest and
quote examples, SDK/WIT byte parity and native composition checks cover the move.
[Implementation and acceptance](docs/evidence/app-wasm-runtime-component-2026-11-05.md).

## Shared native app editors and behavior, 5 November 2026

Apps 0.11.0/model 0.8.0 shares strict localized view/control/geometry types,
context bindings, bounded UI behavior and static type checks. The Core adapter
uses the same compiler with existing field policies and the direct verified
public-read predicate. Rendering, execution, current grants, data and release
retain their existing owners. Independent Rust editor example and rejection
cases accompany unchanged native package digests.
[Implementation and acceptance](docs/evidence/app-native-views-component-2026-11-05.md).

## Shared app placement and route contracts, 5 November 2026

Apps 0.10.0/model 0.7.0 shares strict Surface/ApiRoute wire types and the original
placement/action/path/scope/method grammar through required native-view, known-team-
scope and read-only effect policies. Native current grants, pinned UI/dispatch and
complete view compilation retain their owners. Error pointers and legacy package
serialization remain unchanged; native regressions check forged readOnly metadata.
[Implementation and acceptance](docs/evidence/app-surface-contracts-2026-11-05.md).

## Shared object and intelligence graph contracts, 5 November 2026

Apps 0.9.0/model 0.6.0 shares private native object-binding declarations, strict
AI tool/entity metadata and bounded namespaced graph mapping/projection. Native
package, app-list and native-object consumers reuse those rules. Current actor/PII
rights, immutable references, MCP/agent admission, scoped SQL and verified release
retain their original owners; no duplicate graph or commerce store is introduced.
[Implementation and acceptance](docs/evidence/app-object-graph-contracts-2026-11-05.md).

## Shared app event and trigger contracts, 5 November 2026

Apps 0.8.0/model 0.5.0 shares strict event delivery/filter types, declared
subscription and privacy projections, clock-injected UTC schedule parsing and
private webhook declarations. Native consumers reuse these rules; current
package authority, pinned network egress, signatures, leased processing/replay
and transactional ticks remain connected. Independent model CI now uses its own
lockfile and rejects tracked build artifacts.
[Implementation and acceptance](docs/evidence/app-event-contracts-2026-11-05.md).

## Shared app settings and schema evolution, 5 November 2026

Apps 0.7.0/model 0.4.0 extracts strict setting declarations, bounded updates and
secret-safe projections plus explicit schema evolution planning and exact
conversions. Native settings and upgrade review/install reuse those same rules;
current authority, encrypted storage, recovery snapshots and actual checked
transactional writes retain their original owners. Existing shared tables remain
unchanged. [Implementation and acceptance](docs/evidence/app-evolution-settings-2026-11-05.md).

## Shared common app package compiler, 5 November 2026

Apps 0.6.0/model 0.3.0 shares the original common package limits, capabilities,
models/configuration, action schema/privacy/Flow/job/payment/asset contracts,
strict legacy Slot wire type and event names. Required native domain validators
and scope/reference/Wasm-kind policies remain attached in their original order.
Independent model and integrated native/Marketplace/local payment-provider tests
pass; the native package unit case now validates all 34 bundles, and their
fingerprints remain unchanged. Component CI removes the
redundant model-lib command while --tests retains unit and integration coverage.
[Evidence and remaining host boundary](docs/evidence/app-package-compiler-2026-11-05.md).

## Restored component documentation and hosting source links, 5 November 2026

Northflank now links exactly the three authorized organization repositories.
Existing Core build, Experience and Payments source mappings use their transferred
addresses. The tested organization-aware website proxy is deployed; current
component docs, their actual assets and streamed video ranges work on veyndo.ai.
[Acceptance and remaining rollout scope](docs/evidence/component-hosting-2026-11-05.md).

## Shared atomic app installation, 5 November 2026

Apps 0.5.0 extracts the existing installer behind required native host hooks.
Tenant/package locks, quota, immutable versions and package/version/outbox writes
now use one component implementation. Native compiler/trust, commerce admission,
checked schema migration, models, defaults and schedules remain attached to the
same transaction. Independent rollback/concurrency and native Studio, preview,
release, schema, distribution and composed Marketplace fixtures pass.
[Evidence](docs/evidence/app-installation-component-2026-11-05.md).

## Shared app authority and package fence, 5 November 2026

Apps 0.4.0 shares Action DTOs, current-authority admission, compound permissions,
callback scope mappings and key-scope consent planning. Native authentication,
verified callback policy, credential issuance/revocation and package trust retain
their owners. Canonical fingerprinting and the original scoped active-package
lock/read now live in the component; typed digest comparison remains native.
Independent model/PostgreSQL and integrated consent/callback/surface/job tests
pass; all 34 public package fingerprints are unchanged. The slow-service fixture
now uses explicit release coordination instead of a timing assumption.
[Evidence and remaining host work](docs/evidence/app-admission-component-2026-11-05.md).

## Independent app model contracts, 5 November 2026

Apps 0.3.0 introduces the pure `veyndo-app-model` crate. Core now reuses its exact
entity/field types, declaration grammar, bounded action schemas, typed field and
language validation, publication declarations and record workflows. Required host
policy ports retain native money/content/relation checks and the verified reference
guard; native errors preserve their kind and escaped JSON pointer. Fourteen
independent model tests, 74 native app units and affected integrated suites pass.
All 34 existing public app package fingerprints are unchanged.
[Evidence and remaining standalone authority](docs/evidence/app-model-component-2026-11-05.md).

## Shared app record operations, 5 November 2026

Apps 0.2.0 extracts record CAS, exact import replay, write/event sequencing and
bounded page/filter/publication queries. Core uses that shared owner through
native lifecycle/history hooks without splitting its transaction or bypassing
current package, model, reference and language admission. Publication field names
and channel values are bound parameters. Independent PostgreSQL and native
storage/jobs/schema/extensions/isolation/visual-workspace/marketplace fixtures
pass. The visual workspace test now expects unsafe local reference URLs to fail
before model invocation, matching the existing server protection.
[Evidence and remaining host extraction](docs/evidence/app-record-operations-2026-11-05.md).

## Shared app persistence component, 5 November 2026

Extracted the native app record and job SQL to `veyndo/apps` as the independently
buildable Rust package `veyndo-app-storage`. Core now uses its exact pinned source
in the original scoped transactions. Current rights, package checks, record CAS,
validation, history and signed database scope retain their owners. Standalone
PostgreSQL tests and native storage, job, isolation and marketplace fixtures pass,
including atomic outbox failure, concurrent replay, expired leases and native
order/stock/Flow/document effects. MKT-03a is checked; a standalone authenticated
app host and its production schema/restore acceptance remain open.
[Evidence](docs/evidence/app-storage-component-2026-11-05.md).

## Versioned component host API, 5 November 2026

SDK 0.2.0 adds generated host input DTOs and a server client for record, channel,
paid-order and durable-job exchanges. Marketplace HTTP/MCP now expose record
actions and synchronization through an explicit native idempotency key. Fixed
per-tenant host paths support independent commerce hosts. The native job callback
reuses current compound permissions, package admission and the original queue
and outbox. Independent and actual PostgreSQL fixtures cover replay, conflict,
revocation, isolation and the existing order/stock/document effects.
[Contract and evidence](docs/evidence/marketplace-host-2026-11-05.md).

## Independent Marketplace component, 5 November 2026

Extracted the original provider, Studio and test history into `veyndo/marketplaces`.
The gateway builds without Core source, shares authorized HTTP/MCP dispatch and
supplies a tested JavaScript SDK example. Veyndo consumes an exact source snapshot
with drift and owner checks. Cargo enforces that the provider package cannot import
Core or SQL storage. Standalone tests and the native PostgreSQL fixture verify
listing synchronization, paid order replay, stock, documents and Flow effects.
[Ownership and evidence](docs/evidence/marketplace-component-2026-11-05.md).

## AI Commerce Components foundation, 5 November 2026

Moved the complete product to `veyndo/veyndo` and the private Experience and
Shopware Payments repositories into the same organization without changing their
visibility. Added the [complete extraction task list](docs/commerce-components.md),
including transactional commerce domains, marketplaces, additional channels,
standalone API/MCP/SDK use and assembled-product acceptance. The independent
[JavaScript/TypeScript SDK](https://github.com/veyndo/sdk) exports the current
native input contracts, guest bridge and bounded HTTP/stateless MCP client.
Wire/type tests and Node 22/24 CI pass. Component extraction remains in progress.

## Clear Canvas editing context, 5 November 2026

Shop design distinguishes page design from product and category data. Native data
views keep their own save and return controls; unrelated page tools stay hidden.
Embedded product navigation responds to available space. Shop properties can be
resized with the same control as App Studio. Selected element fields appear first
and reset their scroll position when selection changes. Read-only media controls
respect catalogue write access. Designer colors follow the active Studio theme. [Illustrated workflow](docs/visual-workspace-canvas.md) and
[public acceptance](docs/evidence/canvas-editing-2026-11-05.md).

## Clear payment activation diagnostics, 4 November 2026

The shared payment history and command feedback now explain missing provider
activation in all four Studio languages. Core forwards only exact public
diagnostic codes; provider text stays private and financial state is unchanged.
Targeted actual Core/private/PostgreSQL and responsive component checks cover
missing grants, zero capture, foreign-shop denial and the existing saved-method
lifecycle. [Provider diagnostics](docs/payment-provider-api.md#safe-operational-diagnostics).

## Native PayPal SDK and invoice follow-up, 4 November 2026

The native direct SDK purchase completed with automatic return, basket zero after
reload and exact partial/full refunds. Private invoice disclosures, checkout risk
correlation, safe provider rejection handling and consumer wallet save fields
were completed. Targeted local invoice PDFs, Email Delivery/Flow, recovery, vault
reuse/revocation and restricted access tests pass. The actual hosted save attempt
identified a missing PayPal app feature; provider vault and invoice acceptance
remain tracked separately. [Current evidence](docs/shopware-payments-acceptance.md).

## Actual PayPal Sandbox browser acceptance, 4 November 2026

Native and original Storyfront purchases now have actual PayPal Sandbox capture,
return, empty-basket and partial/full-refund evidence. Studio shows provider
transactions and capture fees. The private 1.6.4 runtime, migrations and restricted
access are deployed. [Observed journeys and screenshots](docs/shopware-payments-acceptance.md#actual-paypal-sandbox-purchases-and-refunds-4-november-2026).

## Provider return navigation, 4 November 2026

Provider-added fragment fields no longer become part of the payment attempt ID.
The return view selects only a bounded reference with an existing local cart token
and asks the server to reconcile. Provider token/payer/return flags never prove
payment. Merchant summaries show no remaining authorization for an expired or
uncompleted payment.

## Stable embedded payment loading and account selection, 4 November 2026

The provider document stays visible while loading and receives repeated scoped
handshakes until ready. A loading failure offers the existing approved provider
approval link without creating another order. Saved channel payment environments
are selected on opening the account panel. Status and disconnect commands can
update only the matching active account and environment; an explicit approved
start is required to replace that configuration.

## Private app package import, 4 November 2026

The Apps library now imports bounded JSON manifests through the existing server
review and consent flow. Upgrades show version, digest, permissions and migration
readiness. Current app management rights apply, and changing a manifest invalidates
previous approval. No provider credentials or private service source are bundled.

## Saved customer payment methods, 3 November 2026

Explicit unchecked consent, account-bound reuse and customer revocation now share
the native checkout, HTTP/MCP registry and durable payment worker. Provider tokens
remain authenticated and encrypted in the private Rust service. Fixed shared
storage, current sessions, immutable account/environment/consent, redacted UI and
minimized Flow events preserve existing boundaries. Local actual-service tests
cover second purchase, guest/foreign denial, idempotent revocation, delayed
confirmation and restart without duplicate capture. Hosted rollout and actual
provider acceptance remain pending; automatic recurring debits remain separate.
See [saved payment methods](docs/payment-saved-methods.md).

## Invoice PDFs and email, 3 November 2026

Validated invoice instructions now freeze in native invoice PDFs and emit one
scoped availability event without marking an invoice paid. Email Delivery 1.3.0
adds editable localized recipient templates, an explicit automatic-send opt-in,
HTTP/MCP actions and existing graphical Flow integration. App consent and current
compound rights guard disclosure; Flow definitions omit bank data. Actual local
Rust/Core/PostgreSQL acceptance covers pending conflicts, immutable PDF content,
one encrypted automatic mail, Flow mail, recovery and exact refunds. Hosted rollout
and external account acceptance remain separate.

## Invoice checkout 1.5.0, 3 November 2026

Feature branch: deferred private invoice-source creation, immutable recipient instructions, durable pending review, stable native references, same-key and verified-webhook recovery, and conservative cancellation. Typed customer/compound merchant HTTP/MCP reads and a four-language responsive checkout display reuse the existing payment ledger and worker. Local Rust/Core/PostgreSQL and 17-method simulation acceptance; hosted migration/rollout and external account tests remain separate. See [the invoice guide](docs/payment-invoice-checkout.md).

## Payment transaction details, 3 November 2026

- Added owned read-only provider transactions and exact fees/net amounts with contract 1.4.0.
- Shared order/payment disclosure, current `payments.read`, HTTP/MCP and durable payment-only history.
- Excluded full order/customer/card/bank data, retained frozen identities and native snapshot consistency.
- Restored exact refund entry for historical orders without the new capture summary.
- Local Rust/Core/PG, 17-method simulation and targeted UI checks; external provider tests deferred.

## 3 November 2026: partial and multiple payment capture

- Original invoices now retain distinct confirmed capture balances, optional
  final capture, per-capture refunds and safe void of the unused authorization.
- Shop/channel capture timing uses the existing revisioned settings. Orders and
  payment management share exact amount input, balance displays and observed jobs.
- HTTP, MCP, app/Flow commands and generated TS/OpenAPI/WIT input contracts share
  the same admission. Pending captures reserve balance; verified recovery binds
  the original job after a lost response. Customer commands cannot choose amounts.
- Shopware Payments contract 1.3.0 preserves historical adapter versions. Local
  native and adversarial provider checks pass; external account tests are deferred.
- The generated Rust/Lean conformance dispatcher is split by existing policy
  domains to preserve source size limits as capture budget proofs are added.

## 3 November 2026: external payment refund reconciliation

- Provider-observed completed refunds now update the original native payment and
  order through existing receipt admission. Duplicate callbacks, changed receipt
  amounts, unknown native jobs and failed holds cannot double-count refunded money.
- This is implemented and tested with native services and local provider fixtures.
  External provider account acceptance and full Shopware feature parity remain open.

## 3 November 2026: persistent contextual assistant

- Ask Veyndo is a scoped right sidebar across Studio, with one shared conversation,
  compact source tools and preserved native editor drafts when collapsed.
- Current view and selected entity/app accompany each turn. Versioned planner v5
  can suggest registered native destinations with explicit opening and current
  permission/tenant-reference validation.
- OpenUI presents typed native working-view compositions. Native directories,
  record editors, catalogue review, approval and publication keep their owners.
- Follow-up public acceptance found a product answer carrying an order view. A
  single explicit view discriminator and native navigation/view consistency now
  reject that mismatch; saved mismatched views cannot open from the client.
- Targeted UI, actual HTTP/provider and invalid-target tests accompany the change;
  the daily full-suite schedule remains unchanged.


## 3 November 2026: configurable merchant reports

- Share native reports between Shop today and each personal workspace area, with period, grouping, currency, timezone and channel filters.
- Add and arrange charts, tables and purchase-journey cards; save private revisioned preferences and export authorized aggregates as CSV.
- Aggregate exact native order money and refund totals, rank products and channels, and reuse current consent eligible traffic and conversion observations.
- Expose the same bounded Rust operation through HTTP and MCP with current rights, tenant isolation, stale response fences and four interface languages.
- Accept the public native simulated EUR 169.00 purchase against its reports, saved independent views, actual CSV export and private stage separation.

## 3 November 2026: native 3D product models and variant materials

- Upload bounded self-contained GLB 2 assets through native product media; preview inactive products through current merchant permissions.
- Bind product SKUs to separate geometry or actual embedded material variants; rotate and zoom in the standard storefront gallery.
- Preserve native revisions, multilingual metadata, parent asset ownership, tenant/channel admission, history and selected sandbox publication.
- Keep GLB files out of image-only catalogue, POS, cart and order thumbnails; load the self-hosted viewer only on demand.

## 3 November 2026: consistent Studio actions and account setup

- Keep component button styling independent of lazy stylesheet order; restore visible list filters and controls through a low-specificity Studio reset.
- Promote Shop creation and New app to clear primary actions; group account and security controls, suggest editable shop identifiers and preserve native validation and error recovery.
- Default invitations to the active Viewer role after asynchronous loading; require an explicit selection if it is unavailable.
- Reuse the same integration-key manager from Team and Developer, including current grants, expiry, agent budgets and confirmed revocation.

## 3 November 2026: reliable native editing from the Canvas

- Make Canvas editing visible above each preview, with blue actions and an unscaled view picker shared by Shop design and App Studio. Preserve native callbacks and disabled admission.
- Load catalogue base and responsive styles with the reusable product and category editors, so direct Shop design entry works before opening the catalogue.
- Give the shared Canvas commerce wrapper its own stylesheet instead of depending on App Studio navigation history.
- Keep the compact product section selector authoritative on narrow screens when lazy catalogue styles load later; preserve native revisions, permissions and private save behavior.

## 3 November 2026: hosted payment setup and public Storyfront acceptance

- Allow shop and channel settings up to 1 MiB so the full 17-method payment catalogue can be saved. Preserve the 64 KiB default for other routes and return a structured JSON error for oversized settings.
- Provision the private Rust payment service in simulation with a separate database and restricted non-owner runtime login.
- Accept the actual public original Storyfront card purchase, nested provider form, confirmed EUR 59.90 payment, return, empty original bag after reload, one-cent partial refund and exact remainder through native Studio; publish observed evidence and screenshots.

## 2 November 2026: current films, gallery and status

Refresh the four English silent product films with actual 2 November Studio captures, shared Canvas and current Shop knowledge/App Studio. Publish captions, editable sources and encoding metadata. Replace two incomplete loading-state screenshots, align status and app-system documentation, and separate archived films from the current gallery. The actual homepage and bilingual Team hub use the same source media.

## 2 November 2026 · Current interface media

- Refresh the feature guide and shared workspace guides with actual current Studio, storefront, app, knowledge, settings, permissions, register and operator screenshots.
- Replace twelve earlier GIF embeddings with ten current edited UI sequences and two accurate still views; publish their static frames and capture manifest.
- Preserve exact historical worked examples as dated source links and update image captions, media indexes and current status together.

## 2 November 2026 · Repository entry

- Present the platform as Veyndo Commerce with direct shop, film, app tutorial and documentation links.
- Use the current product films in the first tour and a shallow clone for that introductory path.
- Align contribution guidance with targeted checks and the daily full verification workflow; route questions to Discussions.

## 2 November 2026 · Shared payment service

- Replace the Shopware Payments placeholder with its 17-method versioned provider contract.
- Add an explicit hosted simulation environment to native account, API and MCP admission while retaining HTTPS and immutable financial bindings.
- Show configured environments and existing connections in the shared account panel without automation rights.
- Keep provider execution in its private Rust service; test concurrent methods, cancellation, refunds and restart recovery through the existing ledger.

## 2 November 2026 · Shared visual canvas

- Keep expanded coding-agent task exports inside the native right dock, including long schema tokens and phone layouts.

- Share bounded pan/zoom scene navigation across shop pages and app placements;
  reuse native renderers, product/category editors and existing undo/draft owners.
- Collapse palettes/properties around the preview, add direct duplicate/move/delete
  actions and preserve the visible drop boundary when dropping on canvas chrome.
- Keep the App Studio agent in a right dock with selected view/block/language,
  screenshot/URL evidence, coding-agent task export and candidate preview before adoption.
- Validate selected context before inference, use native vision transport and retain
  redacted reference provenance in immutable versions. Extend canonical MCP inputs
  and regenerate TS/WIT/OpenAPI contracts without adding a storage or execution owner.
- Connect element behavior to the existing graphical logic and Flow tools; retain
  current rights, private preview, version save and selected sandbox publication.

## 2 November 2026 · Merchant assistant layout

- Align welcome, source tools, working context and message input in one column
  shared with the contextual assistant drawer. Keep narrow and short views scrollable.
- Remove empty product sidebars and the duplicate CSV control. Retain direct file
  intake, scoped dialogs, current permissions and reviewed catalogue changes.
- Replace visible stock/visitor prompt instructions with concise EN/DE/FR/ES
  action labels; the native requests retain their full original boundaries.
- Add actual desktop, drawer and mobile screenshots to the workspace guide.

## 2 November 2026 · Payment form recovery

- Embedded payment forms expose loading, exact-origin/nonce readiness, a 20-second
  timeout and a presentation-only reload in EN/DE/FR/ES. Legacy providers keep
  their existing frame-load behavior. Readiness never authorizes payment.
- Explicitly approved loopback provider frames work only in `contract-fixture`;
  Sandbox and Live retain HTTPS and the operator origin allowlist.
- Document the private Shopware Payments connector's current acceptance and the
  remaining account, deployment, browser and original-feature parity work.


## Shared multilingual image captions (2 November 2026)

- Add one caption editor to product media, site-builder image/hero properties and
  native App Studio image controls. Keep accessibility alt text separate and render
  captions through the existing storefront/app/rich-content renderers.
- Add `merchant.media.caption` through canonical HTTP/MCP dispatch and generated
  input contracts. Central inference prepares a reviewable proposal; no model call
  saves or publishes content. Fence stale proposals after editor context changes.
- Preserve product/page history, enabled language validation, explicit empty values
  and selective sandbox publication. Decode bounded owned/public images, deny
  private-network image URLs and label context-only proposals explicitly.
- Document local provider-fixture, native storage and UI evidence alongside a
  concrete Canvas direction for the shop and app workspaces.

## Guided personal shop setup (2 November 2026, source and local acceptance)

- Add an optional welcome and six explicit review areas for basics, products,
  design, checkout, legal information and a test, with EN/DE/FR/ES controls.
- Save company details inline through existing native settings. Open existing
  catalogue, design, sandbox, legal and order tools; use the existing assistant
  with bounded current setup context.
- Save personal progress alongside the existing workspace with revision checks,
  row security and history. Detect changed setup progress in a second tab before
  merging, retain another tab's reviewed areas and recover by reloading; preserve
  unrelated fresh workspace layout. Pause/reopen through the sidebar and return
  through an active live shop banner.
- Document 17 targeted UI tests, four native model/context tests, real storage/API
  checks and an actual local browser save/progression/pause/reopen. Completion
  records review; public deployment and real provider/purchase acceptance remain
  separate.

## Native product preview in the design overview (30 October 2026)

- Compare a selected channel product alongside home/content pages. Share the native
  gallery and price/variant presentation, inherited home design and responsive preview.
- Read through the private editor scope and selected language. Discard late results
  after scope changes; retry failed reads without shopper sessions or cart writes.
- Keep purchase/app actions inactive in the preview and retain normal live behavior.
  Avoid displaying missing delivery bounds when no delivery choice is returned.
- Update the guide, status, checklist and local screenshots; hosted delivery remains
  separate from local component acceptance.

## Reloadable customer tests and hosted preview acceptance (30 October 2026)

- Saved customer tests retain the current result in the Studio URL after creation
  and selection. Reload opens that result without resetting edited inputs when
  the parent reads back the URL. Late responses from previous sandboxes stay fenced.
- Customer-test selectors in the lab and publication review share localized dates
  and short run IDs, making repeated briefs distinguishable.
- Document the hosted native release-preview purchase, return and empty basket
  from 30 October, with current public screenshots.

## Native shop preview in publication review (30 October 2026)

- Open the current native sandbox storefront beside a saved customer test, using its selected profile’s channel and language. Recheck report access and configuration freshness before loading.
- Switch between desktop and mobile widths, follow real product links, close/reload the preview and keep the normal selective-publication path. Discard pending previews after closing or switching profiles, reports or request scope.
- Keep saved API observations distinct from the current rendering. No historical screenshot, automated layout verdict or customer impersonation is implied. Update the guide, checklist and screenshots with actual native browser evidence.

## Proposal-linked customer tests and configuration freshness (30 October 2026, development)

- Open customer tests from an applied private agent proposal, retaining its channel and an actor-checked source revision/digest through the native worker. Changed or inaccessible sources stop subsequent actions.
- Compare the existing publishable configuration at test start, finish and result review. Show current, changed-during-run, stale and legacy-unverified evidence without treating test orders or inventory changes as configuration edits.
- Show saved private customer tests and configuration freshness beside native release diffs, with channel-preserving return to the test. Clear stale selections/results immediately across sandbox or actor scope changes and keep failed reads/navigation retryable.
- Extend native acceptance through selected publication of the tested proposal: retain orders/stock and unrelated changes, reject stale/replayed requests and revoked rights, and record exactly one release/event.
- Add the dedicated 13-area connected-commerce checklist, native source-admission/regression cases and generated operation contracts.
- Add a bounded home/content page overview using the shared shop renderer, inherited appearance and unsaved drafts. Returning to the current page retains dirty state, selection, undo and the agent prompt.
- Add the missing WebMCP first-product operation through the shared native cart command, preserving concurrent additions and cancellation. Retain ordinary shopping without browser support and suppress tools in private previews.

## Current product films and public screenshots (30 October 2026)

- Refresh four English, silent product films with current product editing, App Studio, contextual AI and saved customer scenario views. Provide captions, editable projects and source provenance.
- Update README and the film guide, show current screenshots and consolidate the recommendation release evidence in the status page.

## Ordered product recommendations and native storefront cards (30 October 2026)

- Retain selected product names, images and order across catalogue searches; add accessible movement/removal controls, cursor pagination, retry and the native 20-product selection limit.
- Use the selected enabled content language for merchant search/detail requests, and allow read-only searching with disabled write controls.
- Replace manual cross-selling ID links with existing product cards hydrated through the native detail owner, current cart identity, prices and channel/company admission. Bound reads to four concurrent requests and clear old-context results immediately.
- Document actual native save/reload, storefront links and deactivate/reactivate checks, plus desktop/mobile captures.

## Product specifications and safe property editing (30 October 2026)

- Group visible localized product details, shared technical properties and unit-labelled weight/dimensions, with an effective product-page preview and responsive row layout.
- Resolve specification language keys independently of plain product text and share native field-level fallback with the storefront. Retain explicit empty values and inherited fields.
- Create map rows explicitly and rename on blur without overwriting duplicate names. Enforce native byte/count limits before accepting a row, and retain existing native aggregate saves and stock omission.
- Update the product guide, module responsibilities and scoped native browser evidence.

## Product SEO editing and storefront metadata (30 October 2026)

- Add a translated single-language SEO workspace with multiline description, encoded product-path preview, automatic product-text defaults and per-field inheritance controls.
- Share regional/main-language SEO resolution with storefront URLs and metadata; preserve explicit blanks and clear stale tags when navigating between products.
- Explain invalid URL characters and native UTF-8 field limits before saving, retaining the existing native revisioned aggregate and untouched-stock omission.
- Validate 41 affected tests and an actual native save/reload/product-page journey, plus desktop and narrow-screen rendering.

## Product content editing and translation preservation (30 October 2026)

- Product basics and full content use a compact workspace with optional identifiers and shipping flags in one disclosure. All controls and guidance support EN/DE/FR/ES.
- The shared rich editor exposes Preview next to visual and Markdown modes, preserves unapplied source buffers and hides editing controls during preview.
- Own rich translations preserve displayed legacy content, resolve regional keys independently from plain text, and identify short-description starting points. Explicit empty rich content stays empty on the product page.
- Scoped tests and native browser/API checks cover preservation, read-only rendering, regional/fifth languages, stock-safe aggregate saving and desktop/mobile layout.

## Product category and channel assignments (30 October 2026)

- Replace flat category checkboxes with searchable translated paths, retained
  selections, selected-only filtering and bounded result batches. Keep hidden
  selections when searching; reuse the native aggregate save and stock-safe CAS.
- Separate sales channels from categories. Resolve their names through the actual
  enabled content locale/main-language fallback, and show inactive/private state
  and explicit per-channel catalogue exclusion. Preserve explicit empty selection.
- Allow read-only category searches while assignment mutations remain disabled.
  Keep current server-side admission, revision history, events and publication.

## Product gallery and variant usability (29 October 2026)

- Add gallery drag reordering with a visible destination, stable selection,
  translated position feedback and the existing keyboard/touch movement buttons.
  Retain multilingual metadata, current write access and revisioned product saves.
- Compact the upload area when images exist. Replace decorative text symbols with
  shared icons and make the first-image cover rule explicit.
- Show existing variants before the optional creation form; add loading and empty
  states, clearer option examples and separated number, price, stock and edit action.
  Preserve bounded generation, existing-combination detection and partial-failure retry.

## Product price and availability workflow (29 October 2026)

- Group selling price, tax rate and native tax-class selection together, followed
  by stock and delivery. Move comparison prices, purchasing quantities, reference
  units, currency prices and rule-based tiers into named expandable sections;
  existing configured values open immediately.
- Keep revisioned aggregate saves, current rights, stock omission and existing
  currency/price owners. Accept fractional cents-step input for the lowest
  30-day comparison price. Ship guidance in EN/DE/FR/ES.

## Daily full verification (29 October 2026)

- Run complete frontend, Rust, formal, differential, native database and coverage
  checks daily at 02:17 UTC or on manual dispatch, instead of repeating them for
  every PR update and main push. Preserve every full-run coverage floor.
- Keep the required `verify` check as short source/ownership/localization and
  governance checks on ordinary changes. Explicitly label quick results and
  reject partial scheduled/manual runs; never reuse stale coverage as current.
- Publish and validate documentation from main or manual dispatch without a
  duplicate PR build. Retain artifact-specific image smoke checks when publishing.

## Product editing workspace (29 October 2026)

- Reorganized product editing around a compact identity and save bar, one shared
  content-language selector and grouped product/app sections. Narrow screens use
  a compact section selector; keyboard navigation keeps manual activation.
- Aligned name and product number, removed nested review/attachment card styling,
  added a clear empty review state and moved history into the current editing panel.
- Creation defaults no longer mark an untouched draft as edited or overwrite input
  typed while shop settings load.
- Kept native revisions, stock-safe saves, inherited content, unsaved-edit guards
  and installed app permissions on the existing paths.

## Embedded app table controls — 29 October 2026

- Keep shared grid tools at the inline end when a native app omits search. The right-aligned column chooser then opens within its narrow table card instead of clipping its labels outside the embedded view. Data, permissions and saved layout contracts remain unchanged.

## Stage app review with strict database scope — 29 October 2026

- Check selected-stage ownership through the existing system metadata owner inside the rollback-only installation review. Preserve current app/developer rights, exact parent identity and exclusion of foreign or actor-private stages.
- Reproduce the public `Environment unavailable` failure with actual separate restricted logins. Cover first installation, existing-stage data, unchanged package/outbox state and denied contexts; repeat the same app-schema suite through transaction poolers.
- Isolate the app-generation provider fixture in its own disposable database so durable work intentionally retained by earlier suites cannot call its model. Preserve real worker execution, all protocol assertions and owned cleanup.

## Typed first-app field constraints — 29 October 2026

- Replace the open-ended field-validation object in guided new-app generation with typed native length, number and item constraints. Keep required flags and status choices in their existing fields; retain native rejection of malformed model output.
- Register immutable `app-brief@2`, preserving the previous prompt. Verify actual OpenAI/Ollama protocol requests, native draft validation and private upload/save through the existing registered app generation suite.

## Isolated recovery and Apple redirect correction — 29 October 2026

- Record actual PostgreSQL dump/restore, exact content comparison of 150 tables and a preserved original database. Recheck restored shops, apps, orders, tenant denial and strict signed-scope runtime connections.
- Exercise simulated provider capture/refund, actual local SMTP through the existing Rust connector and order Flow, native invoice and separate idempotent cancellation. Keep local wire fixtures, external settlement and hosted snapshot recovery distinct.
- Save the two current Veyndo domains and callback URLs in the existing Apple Service ID after explicit approval, retaining old domains. Both public entries now pass Apple redirect admission; authenticated account sign-in is not inferred.

## Actual WooCommerce migration and native rich content — 29 October 2026

- Preserve authored product HTML as a plain summary plus editable native rich document using the migration app’s existing bounded page parser. Reject executable/unsupported content; retain generic native validation and language ownership.
- Include source-owned rich product content in current-field reconciliation. Keep immutable prior imports and explicit changed-snapshot review.
- Add the disposable actual WooCommerce source recipe and record eight-area import, process interruption/recovery, stable replay, selected catalogue release and simulated browser purchase/return/empty basket.

## Contextual design and real reference acceptance — 29 October 2026

- Default the shop agent to the selected section while preserving an explicit whole-page choice until selection changes. Verify the same target in prepared coding-agent tasks.
- Preserve exact native content for style-only reference proposals instead of requiring model duplication. Register the app-owned immutable `site-design@1` prompt and its ordinary inference evidence; extend prompt governance to app-owned manifests.
- Record actual shop/app drag operations, movement, deletion, undo and a real image-derived three-variant proposal through desktop/mobile review and private revision save. Keep public release separate.

## Private browser customer acceptance — 29 October 2026

- Accept the same saved English/German customer profiles before and after a native private stock repair using the actual local model. Record separate rendered product, German simulated checkout, localized confirmation, return and empty-basket screenshots.
- Keep sandbox and channel-preview journeys out of Google Analytics configuration discovery in the existing app-owned bridge. Retain native server admission and ordinary live consent. Verify cancellation, restart/recovery, foreign scopes and emergency stop in the registered native scenario suite.

## App upgrade preflight — 29 October 2026

- Add rollback-only native installation checks to package consent and App Studio, showing record counts, explicit migration requirements and blocking diagnostics without returning record contents.
- Check stored data, deferred constraints, saved examples and existing package dependencies through the actual installer. Preserve complete digest consent and repeat admission when installing.
- Protect active Flow actions and saved argument fields on all installation transports and selected releases. Restore previous presentation only as a new immutable version; retain operational data and settings.
- Recheck saved Flow actors against current primary/additional rights, require explicit migrations for changed field validation and protect enabled provider methods from removal or country/currency narrowing, including channel overrides.

## Description-led native apps — 29 October 2026

- Add a merchant description entry with an editable consultation example and shared contextual agent. Prepare a first private sandbox when needed; fence account and environment changes.
- Compile bounded private data, settings and placements into the existing native views, context bindings and save handlers. Keep full native validation, explicit package consent and selected release. Existing-app edits retain their current contract.
- Share canonical SDK asset actions between the visual compiler and generated builds, default new tools to MCP off, and preserve explicitly narrowed surface action lists.
- Return structured binding locations with translated guidance and precise repair context. Record real local model, upload, private record, central setting, package release and interface restoration evidence separately from hosted delivery.

## Composed native Studio workspaces — 29 October 2026

- Extend reviewed agent views with a bounded selection of native records, details and product intake. Open real server-paged directories and original editors directly from the assistant; retain full-page navigation.
- Pin component layouts through the existing actor-private, revisioned workspace preferences. Reload current data under current rights; exclude personal searches, records, credentials and executable content from saved layouts.
- Fence stale shop/sandbox rights immediately. Preserve unsaved native editor drafts across Back, Close and Escape, and keep nested confirmation controls inside the active dialog.
- Version the central merchant prompt as `merchant-planner@4`. Cover composition admission, malformed/injected output, role revocation, private persistence and native navigation through existing Rust, frontend and HTTP suites. Record actual local model and browser journeys separately from hosted rollout.

## Isolated native CI partitions — 29 October 2026

- Split the registered native integration checks across independent core, signed-scope and transaction-pooler runners. Preserve every nested restricted-role repetition and each existing coverage floor.
- Validate same-source raw measurement bundles before the official LLVM and Python coverage collectors combine them. Missing, modified, foreign-run and incompatible-toolchain inputs reject the final check.
- Retain sequential local runs and existing subprocess cleanup checks. Accepted Linux run `40840531599` shortens the native critical chain from 37m13s to 31m18s, with all required jobs and unchanged coverage floors passing. This is one observed comparison across separate runners.

## 29 October 2026

- Move original Shopware execution and native plugin translation to `experiment/shopware-compatibility`; remove the compatibility app, binary, runtime recipes and original-runtime checks from the main platform. Preserve generic pinned app documents, operational-record isolation, inward migration and native PHP comparison fixtures. Add the connected architecture/app/AI overview and update the main product scope.

## Original Shopware environments — 25 October 2026

- Add an optional app-owned Rust controller and localized workspace for original Shopware extension inventory, reviewed lifecycle changes and durable native jobs. API and MCP retain current roles, package consent and approved UI digests.
- Package an isolated original Shopware 6.7.14.2 runtime with its Composer lock, separate MariaDB/files, workers and an unprivileged ingress. Plugin PHP and its migrations remain outside the Veyndo core.
- Persist per-environment mutation locks and receipts through shared app storage. Keep unfinished operations fenced after a controller restart, and exclude operational entities from sandbox cloning and selected publication.
- Add real original-runtime plugin/App Script fixtures, guest checkout, stock/cart checks and a disposable-container suite to native CI. The operational-record release exclusion extends the existing extracted Lean policy.
- Reject shared cell/core hostnames even on different ports to prevent original Shopware login cookie collisions. Verify unchanged FroshTools 3.15.3 installation/activation through Veyndo and its original cache interface and theme compilation in Chrome.
- Repair embedded external app UI by serving pinned code in a response-enforced opaque sandbox, retaining the Studio script policy and per-action grants.
- Add the setup guide and actual Studio screenshot. Automatic commerce synchronization, arbitrary extension certification and public service deployment are not claimed.

## AI commerce film and Safari media compatibility — 24 October 2026

- Add a 1:56 English, silent film explaining contextual AI, catalogue and design assistance, visual/coding-agent apps, flows, fictional customer scenarios and native commerce. Publish captions, source provenance and an editable project with the video guide and README.
- Re-encode current product films and the earlier knowledge recording to H.264 High Level 4.1 with fast-start MP4. Retain the original capture dates and update file manifests.
- Coordinate with the Experience player repair: native Safari controls receive a source immediately, and failed starts retain a retry control.


## Concurrent isolated pooler verification — 24 October 2026

- Run the unchanged authenticated two-pooler suite beside the main native integration registry, with its own database, restricted logins, Qdrant service and logs. Join its required result at its original registry position.
- Keep all existing suites, assertions, coverage profiles and required final checks. Reject failed or unjoined background work and stop its process group on foreground failure; retain separate reports in native and combined artifacts.
- Add real subprocess controls for overlap, failure, cleanup and isolation. Record durations inside the repeated signed-runtime suites to expose the remaining expensive paths.

## Independent main verification queues — 24 October 2026

- Start admission, documentation and frontend checks for each main push independently of an earlier native test run. Serialize only the long native job, preserving its running database tests.
- Keep PR cancellation, scheduled/manual workflow serialization, conservative scope selection, full test coverage and the final required verification unchanged. Documentation-only commits do not enter or replace the pending native queue.

## Skip unrelated documentation image builds — 24 October 2026

- Classify complete Git changes before preview and migration container builds. Public documentation changes keep handbook publication and required checks while leaving runtime images and tags unchanged.
- Keep packaged Markdown, licenses, frontend, dependencies, runtime/configuration changes and unknown inputs on the existing build and smoke-test path. Missing history and explicit manual runs also build.
- Allow a tested preview image to advance past newer documentation-only commits; keep newer runtime changes, rewritten history and missing comparisons fenced out.
- Test image admission changes in PRs without publication, add manual rebuilds, and retain actual packaged signup/sandbox/restart and non-root migration checks. Cover real Git renames, mixed multi-commit changes and the Docker COPY boundary in the registered scope regression.

## Parallel frontend verification — 23 October 2026

- Run complete frontend checks independently of Rust, Lean and real database/provider integration after cheap source admission. Preserve the existing conservative docs/frontend/full scopes and required `verify` check.
- Reject failed, cancelled, missing or unexpectedly skipped required jobs. Download each job's exact immutable coverage artifact and validate its source, workflow run and report contents before enforcing the unchanged combined policy.
- Keep native unit/integration profiles and disposable databases together; build local frontend assets for their HTTP fixtures. Retain full coverage HTML, integration logs, formal evidence and all restricted-role/pooler regressions.
- Add registered negative controls for final job outcomes and coverage transfers, including safe reuse of a successful job when retrying a failed job in the same run.

## Bounded marketplace order localization — 23 October 2026

- Resolve imported order names in one tenant-scoped query and index the already locked products by ID. Orders with 1, 20 and 24 lines now require one translation read each, compared with 1, 20 and 24 before the change.
- Preserve requested/short/main-language precedence, variant inheritance, blank-name fallback and frozen order snapshots. Keep the existing 24-line limit, current app permissions, stock locks and exact external payment amounts.
- Extend the registered marketplace integration suite with fifth-language and foreign-shop fixtures, replay after catalogue edits, atomic failure on the last line and concurrent orders competing for the final unit. Provider code and tests remain inside the marketplace app.

## Overflow-safe shared discount allocation — 23 October 2026

- Fix signed basket-sum overflow in the shared integer discount allocator. Carry the rounding remainder between lines using bounded wide integers, preserving the existing cumulative half-up result and line-order tie breaks without multiplying an entire basket by its discount.
- Keep promotions and app adjustments on the same calculation. Reject overflowing app price increases before modifying the quote.
- Add extreme-value and 4,096-line conservation tests, an independent small-basket rounding oracle and persisted checkout allocation assertions. Preserve the existing extracted discount-cap proof; the allocation loop itself remains tested Rust.

## Modular provider regression tests — 23 October 2026

- Split the large connected app and mail suites into documented protocol fixtures, process lifetime and scenario modules. Preserve suite registration, scenario order and every existing test assertion.
- Let the Rust connector regression reuse the mail server fixture directly. Keep the archived comparison connector explicit and separate from production services.
- Verify the affected native mail, connector and connected app paths before and after extraction; update test ownership, the source inventory and the existing module audit.
- Narrow the forced role-demotion test barrier so background foreign-key checks can use a one-connection pooler. Match the exact blocking backend, retain all three HTTP denials and verify that denied invitations remain absent or unredeemed. Release a failed test's lock before joining its request.

## Modular public-site styles — 23 October 2026

- Split the 1,037-line shared stylesheet into nine documented modules, each below 320 lines. Keep the original rules and cascade unchanged.
- Publish one flattened asset at the existing marketing and handbook URLs, preserving cache paths and avoiding additional browser stylesheet requests. Validate ownership, module registration and exact published bundle contents in the existing website checks.
- Record the successful complete Linux CI and the healthy 23 October Core rollout, preserving the distinct dates and scope of earlier public purchase acceptance.

## Sequential formal guarantees and domain boundaries — 23 October 2026

- Extend Lean coverage from 61 policies / 131 properties to 63 / 149. Bind private agent continuation and planning-only request admission to the existing native guards; prove sequential stock, refund and budget bounds plus discount stability.
- Split the 320-line policy facade and 515-line proof file into seven corresponding domain owners. Preserve all 61 previous typed policy bodies and public Rust names. Enforce complete registered proofs, closed imports/reexports and a 320-line handwritten proof limit.
- Add independent wide-integer Rust boundary/sequence tests, ten extraction/proof-layout negative controls and 17 Cargo dependency/ownership controls. Keep existing native PostgreSQL/HTTP regression paths and full required CI.
- Synchronize the delayed-flow revocation regression with its committed continuation cursor before advancing the timer. Require the exact access-denial result and unchanged order; report persisted job diagnostics on failure instead of racing initial queue admission.
- Refresh formal coverage, source responsibilities, test guidance and the current-status entry with [dated evidence](docs/evidence/formal-modularity-2026-10-23.md), separating local source checks from hosted acceptance.

## New connected product films — 23 October 2026

- Add three silent English product films explaining the AI-first concept, connected merchant/customer workflows and extensible app platform, using actual dated UI captures and architecture illustrations.
- Include 1080p MP4s, readable burned-in subtitles, VTT/SRT files, posters, exact encoded metadata/hashes and editable pinned composition projects. Verify complete media decode, actual frame inspection and runtime/layout/contrast checks.
- Place the new players and downloads first in the documentation video guide and refresh README/media provenance links; preserve the earlier 13 October recordings as dated material. No runtime, provider acceptance or latency claim changes.

## Catalogue-based fictional customer drafts — 22 October 2026

- Preview three editable customer profiles from a bounded native channel catalogue: exact-budget refusal, product-information review and a second available destination/language.
- Keep the merchant brief, saved runs and explicit start separate from profile adoption. Sample only visible channel products with positive projections, native currency conversion and enabled-language fallback; no customer data or extra inference.
- Reuse the existing private scenario HTTP/MCP contract and durable shopper tasks. Retain current rights, tenant/channel isolation, cancellation, replay and simulated checkout owners.
- Separate protected channel configuration reads from shopper-language admission: a German Studio can prepare a French-only channel, while actual native shopper requests still require an enabled language.
- Accept the public configured-model journey with a one-cent-under-budget refusal and two native private purchases for Germany/Austria. Preserve reload/reuse, French stored names, mobile screenshots and exact runtime provenance in the published guide.

## Current documentation entry points — 22 October 2026

- Align the README, feature/app/knowledge/workspace guides and machine-readable index with the publicly accepted customer simulator, catalogue preparation, app diagnostics and visual shopping.
- Use the 22 October public comparison as the README's current screenshot; retain older capture dates and link their provenance. Place customer scenarios beside shop knowledge in the handbook navigation.
- Route current-status links to the single public status page and label the older release record as historical. Preserve remaining implementation and provider acceptance boundaries.

## Connected catalogue, apps and visual shopping — 22 October 2026

- Add one paged catalogue-preparation view with explicit language coverage and durable image-job state, native repair links, actionable app-reference diagnostics and shared private simulator entry points.
- Turn catalogue-grounded recommendations into native product cards with images, prices, availability and reversible selection controls. Detail navigation preserves the edited shortlist and retains native variants, app configuration and checkout.
- Bind saved advice to the current buyer/shop/channel/language/country/currency context and discard late provider results and errors after context changes. Add localized responsive controls and regression coverage.

## Private customer scenarios — 22 October 2026

- Use localized language/country names and the shared searchable destination picker for fictional profiles. Retain exact native codes and the channel's allowed destinations.

- Add one to six editable fictional customer profiles on existing durable tasks, with two concurrent native shopper journeys, exact budgets, observed catalogue, locale/country and simulated checkout. Reuse shared HTTP/MCP capability rights, model accounting and private sandbox isolation.
- Save each action, prompt provenance and private order result; support explicit resume, cancellation, lost-response recovery and before/after comparison. Add compact localized Studio controls and entry points from shop design, installed sandbox apps and migration targets.
- Fence native cart, selection, legal and checkout commits against cancellation, revoked authority and lease expiry after database lock waits. Remove nested pool acquisition from checkout selection while preserving revision checks.
- Verify native private purchase/repair, two concurrent customers on a minimal pool, cold restart, revoked roles, injection denial and stop/lease races. Correct UI polling and late-response selection races. Document API coverage separately from visual browser testing and conversion estimates.

## Merchant catalogue handoff and privacy continuation — 2026-10-22

- Attach or drop an actual product CSV directly into the merchant composer; carry a description or HTTPS URL into the existing private intake. Keep current rights, scope cleanup, editable preview, explicit save and native image/translation/inventory owners.
- Show source/review/private progress, hand saved products to their real editor and open the exact sandbox publication review. Display localized product names in release selection, with main-language inheritance and technical details available separately.
- Retain the current privacy choice after purchase through a capability-bound reference to one shared server receipt. Preserve expiry, denials and revocation across subsequent carts; erase related preferences and observations on withdrawal. Never carry terms, basket contents or company approval forward.
- Add migration 108 on the existing scoped receipt table; old runtimes fail closed on references. Verify actual native purchases, same-buyer company continuation, foreign/session-only denial, expiry, repeated purchase and concurrent withdrawal. Ignore late browser reads/writes from prior carts.
- Deploy the runtime from PR #193 after full CI, a fresh snapshot and successful migration 108. Public Chrome acceptance covers CSV/edit/private-save/image/selected publication, description/URL handoff and simulated order `RAC-65c8482b` with an empty cart and retained privacy choice after return/reload. Retain screenshots and exact source/image provenance. Apple callback Save and actual sign-in remain open.
- Correct two test defects exposed by full CI: give the decided privacy fixture its required expiry and await enabled app-review controls. Keep production admission unchanged; all 789 frontend tests pass.

## Current-status documentation — 2026-10-21

- Condense the current status into one public capability/evidence table and an explicit remaining-work list. Preserve dated deployment notes in a linked history instead of leaving contradictory old open items in the main status.
- Record the measured full-CI breakdown and mobile configured-order proof without reducing verification coverage or treating local checks as public acceptance.
- Record a fresh private-browser Storyfront first-load purchase on unchanged public code: no retry, simulated order `RAC-9a338bb0`, receipt return and empty original bag after reload. Preserve earlier extension-controlled loading failures as separate evidence.
- Repeat the complete embedded purchase on the final public runtime `7f0d4266`: first-open checkout, simulated lamp order `RAC-4a94c770` for EUR 59.90, German confirmation and an empty original bag after return/reload. Preserve the preceding explicit out-of-stock rejection of the exhausted cup fixture. [Final-release screenshots](docs/evidence/storyfront-checkout-2026-10-21.md#final-combined-release-first-load-purchase-and-empty-cart-reload).

## Configured B2B approval and reopened order details — 2026-10-21

- Display accepted app material, dimensions and surcharge in the existing company approval inbox and customer/company order detail. Reuse the native frozen snapshot renderer without fetching current app labels or recalculating historical prices.
- Complete the local saved-list → updated configuration price → independent account approval → simulated purchase → empty cart journey. Preserve the original order's older material and surcharge after package/material changes. Add rendered regressions and [browser evidence](docs/evidence/furniture-browser-2026-10-21.md#saved-list-reorder-and-separate-approval-local-browser-21-october); keep local and hosted acceptance distinct.
- Complete the public configured desk purchase and saved-list reorder on `ef093e7a`: EUR 427 then EUR 447 after a native material update, separate approvals, denied buyer self-approval and empty carts after return/reload. Record browser purchases, native API approval and preserved original frozen values separately from the pending public inbox presentation check. [Public screenshots](docs/evidence/furniture-browser-2026-10-21.md#public-configured-company-purchase-and-saved-list-reorder).
- Complete the subsequent two-account public browser acceptance on merged main `7f0d4266`: frozen configuration visible before independent approval, simulated order `RAC-34c09fc1`, empty cart after return/reload, reopened buyer details and unchanged original company order. The same release passed full CI, a fresh snapshot, migration and healthy startup. [Final public browser evidence](docs/evidence/furniture-browser-2026-10-21.md#public-two-account-browser-acceptance-after-the-combined-release).

## Public recorded-rule comparison — 2026-10-21

- Compare a revision-bound saved rule with an unsaved visual draft on up to 50 recorded `order.placed` Flow cases. Reuse the native interpreter and frozen references; never create orders, execute actions, call providers or substitute current data.
- Share one Rust handler across Studio, HTTP, MCP and authorized read agents, with generated input contracts, current compound data/PII rights, tenant isolation, bounded snapshots/references and explicit unavailable cases.
- Show reviewed comparison counts and saved/draft outcomes in EN/DE/FR/ES. Clear stale results when the draft, rule, revision or shop changes. Keep full historical checkout repricing and revenue claims outside this condition-only comparison.
- Deliver `6a71d072` / `jubilant-plane-2874` and compare an existing EUR 49.90 public test order: the saved EUR 100 threshold is false and the unsaved EUR 1 threshold true. Verify cleared stale results, empty history, retained saved revision and unchanged order count. [Usage and browser evidence](docs/rule-history-comparison.md).
- Keep the shared language card in normal page flow below 600 px so it cannot cover editor controls. Deliver `ef093e7a` / `brave-produce-7557`, complete the 390 × 844 public browser comparison and preserve its screenshot.
- Repeat the original Storyfront iframe purchase on `ef093e7a`: simulated order `RAC-14a61722`, German item label, EUR 24.90, receipt return and empty original bag after reload. Retain the initial controlled-browser loading failures separately from the successful recovery journey. [Exact observations and screenshots](docs/evidence/storyfront-checkout-2026-10-21.md#regression-after-reusable-work-and-rule-comparison).

## Public reusable-work Flow acceptance — 2026-10-21

- Add an inactive Flow draft from completed native work, with explicit event-field mappings and per-Flow/workspace daily review limits. Preparation reuses actual reviewed operations without another model call; personal approval and the existing durable worker still own every write.
- Keep original task inputs actor-private. Configuration/history store only a source-task reference; current original scopes, workspace, actor, native revision and app checks apply again. Source tasks cannot be published to another workspace.
- Connect the original Flow Builder and personal workspace with EN/DE/FR/ES controls, protected-source reload and scope-change cleanup. Verify native outbox execution, replay, foreign/source-right denial, stop, absent event fields and competing workers.
- Deliver `650529c7` / `aromatic-voyage-2152` and complete the public inactive-draft → real product event → fresh review → personal approval → one native category journey. Retain completion after reload and verify absence from the parent live shop; deactivate the test Flow and restore the trigger text. Keep screenshots and exact scope in the [public evidence](docs/evidence/flow-native-work-2026-10-21.md#reusing-completed-work-public-acceptance).

## Unreleased — shared progress in direct Flow review

- Connect catalogue preparation to native saved products, explicit language progress,
  durable image failures and direct text/media repair; reconcile image creation
  after a language refresh without repeating provider work.
- Add actionable app connection hints for missing views/models/actions, API/agent
  references and commerce decision examples, linked to the existing editors.


- Connect the direct Flow-history proposal to the existing native task progress, explicit resume/cancel and translation editor. A completed proposal job no longer hides pending approved work; reload observes the original execution without a second approval.
- Reuse one shared task hook across Flow history and the personal workspace. Preserve current controls, task identity, tenant scope, revision fences and immediate legacy proposals; changing environments remounts the Flow editor.
- Cover the actual rendered Flow history, permission withdrawal, explicit continuation and legacy approval; actual PostgreSQL checks confirm queued/completed history and parent-shop isolation.

## Public Flow-to-workspace acceptance — 2026-10-21

- Deliver `09b1aa35` / `giving-insect-7440` and complete the original configured-provider Flow proposal through the selected private workspace. Observe one native category at revision one, restored completion after browser reload and no category in the parent live shop. Retain screenshots and exact scope in the public evidence page.
- Separate execution state from permission labels: accepted/completed proposals no longer show a misleading read-only warning, and accepted work cannot offer a second approval button. Real read-only proposals remain blocked.
- Make the site-builder onboarding test await the actual package-review response before clicking its enabled installation button; retain the complete consent assertion.

## Unreleased — retain approved workspace tasks after reload

- Load and approve personal-workspace tasks in the currently selected sandbox. Personal layouts continue to use the parent shop; switching environments discards late proposal responses.
- Keep queued, running and interrupted approved work in the original actor's task list. A read-only execution marker reconnects the shared progress card after reload, without another approval or a second worker.
- Preserve tenant, actor and current-scope filtering. Actual PostgreSQL tests cover queued/completed, cancelled and interrupted work after a killed worker, plus another actor's empty task list.

## Unreleased — actual execution progress in the personal workspace

- Keep approved native work pending until the existing worker confirms completion. The workspace reuses the assistant's progress card for saved steps, interruptions, explicit continuation/cancellation and translation review.
- Stop polling at terminal states, show status failures with an explicit refresh, prevent repeated approval and discard late responses after changing task, shop or private request context. Immediate legacy approvals keep their existing behavior.

## Unreleased — review and execute work prepared by Flows

- Save direct and graphical Flow AI proposals as actor-owned ready tasks, so the existing work area can open, review and approve their native steps. Personal approval supplies the execution credential; preparation never queues writes automatically.
- Recheck current Flow rights, private workspace admission and shop emergency stop before inference and before saving its result. Preserve the original permission ceiling and reject late results after withdrawal. Use the actual event kind for non-order events.
- Verify the real product-event/outbox/Flow/task/approval path, one private category write, repeated approval, unchanged live data, graphical pipelines and stop/revocation during inference with isolated PostgreSQL and a synthetic model.
- Bind prepared tasks to their originating Flow job and reject late model results transactionally after lease expiry or recovery. Test direct proposals and graphical steps with two actual Rust workers; an uncertain job cannot create an executable task later.

## Public provider recovery and checkout repetition — 2026-10-21

- Record Experience `cbb4d283` / `alert-light-1076`, the original typed-Date reconciliation repair and an observed three-receipt recovery cycle with no technical failures. External results remain pending.
- Repeat the actual embedded simulated purchase as `RAC-386cdc4c`, receipt return and persistent empty Storyfront bag after reload. Include screenshots and retain the separate initial iframe retry limitation.

## Public original Storyfront purchase acceptance — 2026-10-21

- Record the original scrollable Purchase scene, pointer add-to-bag, embedded simulated order `RAC-3bce945b`, receipt return and empty original bag after full reload on public Experience `56ae7b8` and Core `fb8d54e0`. Include actual screenshots and retain the separate first-load retry limitation.
- Replace the stale PR #182 verification-in-progress notice with the successful full required run and merged state.

## Unreleased — continuation after purchase and Studio reload

- Restore accepted app configuration inputs after reloading even before a product is added to the cart. The existing cart response exposes only app/product-scoped input fields; native fees, rules and order snapshots remain authoritative. Another cart receives no saved inputs.
- Preserve app configuration fields while a fresh cart replaces a completed purchase and native prices refresh. A changed buyer, country, currency or company still resets those inputs. Label individual translation application as an action rather than an already-completed state in EN/DE/FR/ES.
- Route app product configuration through the same serialized native cart owner as add/quantity actions. A completed purchase creates a fresh cart before the next configuration; conflicts are shown without silent retries, and abandoned shop scopes cannot adopt late results.
- Remember the selected Studio sandbox separately for each live shop and browser tab. Reload revalidates its current rights; failed access stays closed with an explicit return-to-live action instead of silently switching the destination.

## Unreleased — truthful saved-work progress

- Render published page headings, rich text and SEO in the selected shop content language, independently of the language of interface controls. Keep the configured shop-main-language fallback and scope page/product refreshes to the same content language.

- Publish selected native settings and channels before dependent app records in the same transaction. Newly enabled languages and new page channels can accompany their translated pages in one release. Missing dependencies, stale digests and repeated releases remain rejected atomically; Studio explains missing page languages/channels in all four interface languages.
- Keep translation-review navigation in its current private Studio session. Require the form-receiver package only when the selected page contains a form; ordinary landing pages and design assistance use the site-builder package alone.
- Distinguish accepted background work from completed changes in Studio. Show native execution interruptions separately from model failures, retain saved step progress and explicit continuation, and suppress late approval notices after a shop or conversation switch.

## Unreleased — connected material library and completed reorder

- Add native AI-context/graph metadata to furniture pattern `1.0.1`, keeping material names, EUR-cent surcharge and exact package/record provenance consistent across authorized API/MCP/public lists. Preserve reviewed material writes and private order-read rights.
- Retain the immutable `1.0.0` package inside its plugin and test upgrade without losing records. Keep the executable purchasing workflow with the app; the registered host test only invokes it.
- Complete a second purchase from saved inputs after material/rule changes, require new independent approval, reject replayed stock/order effects and preserve the original accepted order. Public B2B/browser acceptance remains a separate delivery step.
- Reuse the existing transaction and locked commerce settings when saving roles, avoiding a nested database acquisition while retaining current delegation, language validation and revision checks. Keep role, core-extension, material and UCP purchasing journeys in the required one-backend pooler suite.

## Unreleased — managed app proposal correction

- Product category-only changes retain native revisions, metadata, translations, prices, stock and channel selection; reviewed agent work validates product shapes before approval.

- Describe the complete native page-block format, including stable identifiers,
  translated content and product selection; return exact field paths for invalid
  blocks without echoing their content. Preserve the existing admission rules and
  verify correction through the actual collection task before approval.
- Give merchant planning the current authorized app field contracts and shared,
  app-owned page content format. Unknown fields identify their model and names.
- Correct an invalid proposal once through the existing durable model checkpoint;
  preserve original evidence, current rights, full native validation and personal
  approval. Reuse completed calls on explicit continuation after a provider failure.


## Unreleased — strict provider selection schema

- Omit unsupported `uniqueItems` only from the OpenAI strict wire schema and reject duplicate selections when restoring the model result; preserve the original domain schema and product/tenant validation.
- Make the existing real HTTP provider fixture reject that keyword for Responses and Chat Completions, covering the actual merchant planner final request rather than only a synthetic schema.
- Record the 21 October collection rollout separately from the still-open configured-model acceptance. The saved public task stopped before approval with HTTP 400; this repair must be verified on that task after deployment.

## Unreleased — connected collection preparation

- Freeze explicit product selections in existing durable translation jobs; reject empty, duplicate, malformed and unavailable IDs instead of silently expanding scope.
- Connect scoped translation preparation to reviewed private native/app work, with durable child links, worker yielding, explicit failed-task continuation and current-authority/cancellation fences.
- Expose actual translation-job links in work progress and exact product scope in translation proposals; preserve separate draft review and selected publication.
- Resolve translation provider availability through central configuration before taking transaction-pool backends, and include the platform selection in the native API/MCP schema.
- Keep publication diffs, reviewed app staging and reactivation usable with one backend per database login; reuse the same locked snapshot/transaction, preserve domain/PII rights and align activation with the native tenant/app package fence. Retain these actual flows in required transaction-pool acceptance.
- Add real PostgreSQL/HTTP collection, process-restart and selective-publication regressions. This section describes development; it is not a public deployment receipt.

## Public connected workspace acceptance — 2026-10-20

- Record actual configured-model context/guidance recall, native editable-grid handoff, current-stock work cards, one approval completing two private category steps and saved progress after reload.
- Accept generated care-note app composition, private installation, ordinary English/German record persistence, selected package-only publication and central region configuration after reload. Keep test records/categories private and capture the real Studio views.
- Update the concise README, website feature description, connected-workspace guide and canonical status with current public evidence. Preserve the earlier checkout, provider and broader migration acceptance boundaries.
- Add a bounded Qdrant startup health check to the existing deployment maintenance job after reproducing two initial-network failures; retain all native database/namespace checks and fail closed on unavailable dependencies.

## Native optional record titles — 2026-10-20

- Keep native App Studio forms usable when a saved record has no optional translated title. Fall back to its record ID, preserve the original revision and save only explicitly entered translations. Reproduce the public preview crash and cover record selection, editing and persistence in the shared renderer.

## Validated agent plans and recoverable app proposals — 2026-10-20

- Describe category create/save with the canonical native DTO and validate reviewed category inputs against current shop configuration before queuing. Preserve nested revision checks and stable create IDs; malformed model output cannot become an approved task.
- Follow the current scoped saved task after approval and fence historical or late poll responses when conversations, tasks or accounts change.
- Repair a rejected app-generation proposal once with its native validation error under the same provider, schema, original manifest and authority; preserve all native validation and conflict checks. Register immutable `app-generation@3` provenance and test actual private record persistence after a repaired proposal.

## Strict-provider optional fields — 2026-10-20

- Restore strict OpenAI wire placeholders for omitted optional, non-null fields to absence before native validation. Real public model replies exposed `operations: null` and `lifecycles: null`; required values, explicit nullable fields and intentional dynamic JSON remain unchanged.
- Add failing-first schema coverage and actual local OpenAI HTTP regressions for merchant planning and complete app composition/private record persistence. Preserve domain authorization, review and publication contracts.

## Connected agentic workspace — 2026-10-20

- Preserve bounded editor/selection context across merchant conversations and retries; discover relevant installed apps with cursor search and safe native reads rather than alphabetical sampling.
- Approve bounded private configuration work through the existing Rust task worker, with current authority, exact argument/CAS review, durable action progress and transactional managed-app receipts.
- Keep work approval and native command execution usable through a one-backend transaction pool; preserve stable category IDs and token-bound completion receipts after cancellation or lease expiry without reviving stopped work.
- Compose complete native app extensions (models, settings and views), preserve accepted contracts and try the proposed version in the actual actor-private runtime before adoption.
- Open reviewed natural-language criteria in the existing editable native grids. Show bounded current-right work suggestions and save explicit private, versioned merchant preferences through Shop knowledge.
- Update the handbook, website navigation, README and operation-generated contracts. Local fixtures and current public activation remain distinct in the status/evidence guide.

## Bounded service integrations — 2026-10-20

- Add app-owned Vercel, Klaviyo, HubSpot, Contentful and Algolia protocol adapters to the existing Rust connector, encrypted settings and durable queue, with explicit current permissions and honest asynchronous receipts.
- Add localized connection/operation controls and ten integration routes through existing Apps consent. Keep Nexus as a documented HTTP-action recipe and preserve inward Shopify/WooCommerce migrations.
- Add Shopware 6 OAuth/currency/language/product intake and native reviewed private import; retain explicit domain, translation, tax/channel, stock and cutover limits.
- Provide a stateless Vercel Store API/native checkout handoff client and public-route rewrite example; no public Vercel deployment or Nexus marketplace approval is claimed.

## Guided design setup and current product comparison — 2026-10-20

- Guide first-time shop design through existing private workspaces and actual per-package consent, then resume the chosen tool/home section. Explain missing rights and support cancellation/retry without implicit publication.
- Show original, natively mapped and currently stored product fields through an explicit bounded read-only inspection; preserve role/tenant checks, exact native money formatting and values-free default evidence.
- Keep comparison results transient and discard stale target/source/access responses. Explain separate image, stock and publication checks; retain the existing native importer, app storage and selected release path.
- Add connected UI and real PostgreSQL/HTTP/MCP regressions. These changes are locally verified development; the separately prepared hosted migration service remains stopped pending its user-owned gateway-key entry.

## Current migration target checks and durable continuation — 2026-10-19

- Merge PR #168 after full green verification and deploy the identical Core/Studio source after a successful snapshot and additive migration 106. Publish the independent source-pinned Rust image. Keep hosted migration-service configuration and public end-to-end acceptance explicitly open in the status/evidence; a healthy Core is not a completed migration journey.

- Support explicitly public frozen exports without forwarding source/export credentials; protected exports stay authenticated by default. The public synthetic GitHub sample now passes an actual pinned HTTPS read through Rust.

- Atomically store successful native job completion and authenticated private evidence under current creator, package, lease, cancellation and CAS fences. Ordinary saved success flags and edited seals cannot advance migration progress. Preserve evidence across job archival and actual service restart.
- Share native CRM address creation planning with reconciliation, preserving identical address rows and first-address defaults; enforce PII permission on full commerce-settings order projections.
- Build and smoke-test a separate non-root Rust migration image with immutable source tags; public deployment remains a distinct acceptance step.

- Compare actual native mapped target fields across all eight supported import domains. A successful replay no longer establishes parity: edited prices/text, missing records and disconnected image associations remain visible. Explicit reconciliation jobs are read-only and retain current creator, package, lease, digest, target and paired read/PII checks.
- Save exact reviewed page intents and bounded results in existing private app records. Continue plans in dependency/cursor order after reload, technical job archival or service restart; preserve deliberate per-page approvals, conflicts and app quotas.
- Close an older settings projection that returned full historical orders to settings/order readers without the separate PII right. Add actual restricted-role, changed-target, readonly-write denial, eight-domain archival/restart and delayed UI-rights regressions. [Scope and current deployment status](docs/agentic-migration.md).

## Saved migration work plans — 2026-10-19

- Connect a named source/domain/private-preview work plan to existing leased jobs through a non-authoritative group label. Plans use native logical records, revisions and current app rights; they never approve a source page or authorize cutover.
- Page native job history beyond its previous latest-100 window, retaining tenant/app scope and current action/PII redaction. An archived page anchor now reports an explicit restart conflict instead of silently hiding older jobs.
- Validate planned domains on the native save action and defensively in Studio. Keep current role/shop/plan changes fenced against stale asynchronous UI replies. [Workflow and remaining limits](docs/agentic-migration.md).

## Frozen source-export intake — 2026-10-18

- Add independent Rust streaming export packages with original source context, immutable page hashes and exact counts. Protect export files, reject duplicates/shallow references, and preserve original identities across export hosting.
- Add separately encrypted export credentials and pinned HTTPS intake to the existing migration settings, review UI and saved native jobs. No source API secret is forwarded to an export server and no parallel queue/table is introduced.
- Verify actual two-page 52-product private native import, stable replay, tampered-page failure before writes and retained result evidence. Full-shop orchestration/reconciliation/final delta/cutover and hosted acceptance remain open. [Guide](docs/agentic-migration.md).

## Source pagination completeness — 2026-10-18

- Stop on malformed or contradictory source totals, short nonterminal offset pages and missing Shopify root/nested completeness metadata. Preserve the cursor rather than silently skip source records.
- Four actual HTTP counterexamples now reject; complete native migration and five-provider CRM/history fixtures continue to pass. Whole-shop reconciliation/cutover remains open.

## Original CRM and historical source fidelity — 2026-10-18

- Carry billing, shipping and additional original addresses through one native CRM transaction, including source subdivisions/contact fields, exact replay and rollback on an invalid address. Historical intake suppresses ordinary address-change events; manual editing retains them.
- Resolve Shopware 5 detail records and PrestaShop customer/address/country/state/currency dependencies through fixed, owned and bounded source reads. Preserve Magento shipping assignments and current Shopify address/email fields; require actual all-order access for full Shopify history.
- Show original CRM/address/order-item evidence before approval. Actual five-provider HTTP fixtures reach native CRM/history; this is not real-source admission, hosted deployment or whole-shop final cutover. [Coverage](docs/agentic-migration.md).

## Reviewed source tax basis and five-provider native intake — 2026-10-18

- Preserve original source amount/basis and convert declared net prices with the existing native tax calculator and currency precision. Known-basis mismatch/missing confirmation is rejected; legacy undeclared requests retain gross compatibility. Studio makes unknown basis explicit and clears approval on change.
- Confirm the resolved source-tax warning while keeping unrelated gaps blocked. The frozen native job narrows a reviewed warning union to exact per-record warnings, preserving the ordinary native validation and replay identity.
- Exercise all five actual local provider HTTP protocols through saved inspection, reviewed jobs and native private product creation; include zero-/three-decimal price controls. [Coverage and limits](docs/agentic-migration.md).


## Complete concrete variants and durable source inspection — 2026-10-18

- Preserve original WooCommerce variable parent/child identities, complete declared axes/options, child images and explicit private visibility through native selected publication and simulated checkout. Missing/foreign/duplicate/wildcard families and unsupported visibility stop explicitly.
- Move source inspection onto existing permission-fenced native jobs/outbox. Slow sources no longer wait in the five-second app gateway request. Saved evidence can reopen after reload; inspection remains separate from import approval. Current PII revocation, cancellation during source reads and byte-bounded rich-document results have actual HTTP controls.
- Preserve explicit source publication/active status across Shopify, PrestaShop, Magento and Shopware 5. Shopify requests online-store publication separately from ACTIVE; unsupported direct/search/catalogue visibility stops before import.
- Keep both original per-action job events and an opt-in generic queued event; callback metadata/checkpoints retain their original limits. No new runtime, queue, provider role or per-shop table. [Coverage and remaining work](docs/agentic-migration.md).


## Reviewed inward migration foundation — 2026-10-18

- Add an independent Rust migration application with Shopify, WooCommerce, PrestaShop, Magento 2 and Shopware 5 source profiles, exact canonical money, explicit locale/timezone mapping and bounded variant slices.
- Add generic native intake for private products, credential-free CRM profiles and immutable historical orders without payment, stock, ordinary-purchase or new-invoice effects.
- Reuse native app jobs, encrypted installed settings, package/creator/lease fences and exact reviewed record hashes. Persist coarse checkpoints, retain private targets across source pages and protect small connection pools. Add an app-owned EN/DE/FR/ES Studio workflow and contextual shared agent drawer.
- Copy bounded original source images through exact reviewed byte digests into the native asset store, preserve source order/manual slots and recover partial association failures without duplicate files. Native selected publication now orders parents/products before image assets, rejects missing attachments/protected downloads atomically and captures exact persisted live baselines for later releases.
- Import historical reviews through native moderation with explicit source labels and current product/PII read checks; never forge verified purchases. Import supported WooCommerce coupons as inactive native promotions with exact remaining-use limits, immutable currency/provenance and explicit activation review. Reject malformed limits and unsupported restrictions; source-currency checkout and role-revocation controls cover the independent review findings.
- [Current coverage](docs/agentic-migration.md) explicitly excludes private/provider-specific media mappings, complete complex-variant mapping, target migration of additional domains and automatic final cutover. Local implementation is not public whole-shop acceptance.

## Inward agentic commerce — 2026-10-18

- Add UCP Cart Transfer through the native expiring single-use checkout handoff and independent optional buyer-consent negotiation. Native cart, consent and currency changes commit together; current privacy policy, revocation, required contact data and immutable order snapshots remain shared across transports.
- Add app-owned Shopify CSV and read-only Shop MCP catalogue adapters. Review drafts in the existing private catalogue intake, start stock at zero, retain provenance and explicitly publish selected changes. No outward Shopify checkout or automatic supplier stock/order sync.
- Add permission-scoped AI channels/imports controls, shared storefront UI/WebMCP cart commands, lifecycle cleanup and stale-shop protection. Browser agents can open buyer checkout review but cannot silently place orders.
- Show structural design comparisons with desktop/mobile preview and actionable app declaration diagnostics using the existing editor and assistant. [Integration and acceptance boundaries](docs/agentic-commerce.md).

## Render Mermaid throughout the public handbook — 2026-10-18

- Load a pinned, self-hosted Mermaid renderer only on diagram pages, with strict SVG rendering, contained scrolling, fit-to-width and an expandable source fallback. Diagram controls share the existing four-language handbook vocabulary. Keep package integrity, bundle digest and upstream MIT attribution with the unchanged browser distribution; build checks reject missing assets or a disconnected loader.
- Repair invalid semicolons in B2B/UCP and shipping sequence labels. Verify all 33 actual handbook diagrams in the browser, including the visitor-behavior guide; ordinary code examples retain their code formatting.

## Original embedded checkout accepted on current public images — 2026-10-18

- [Complete controlled-Chrome purchase](docs/evidence/storyfront-checkout-hosted-2026-10-18.md): native iframe review, German simulated order RAC-3b2e5dfc, verified original-bag clearing, same-Experience return and empty bag after reload passed without a manual user test. Confirm current Core/Experience delivery and retain earlier paused-document observations as historical evidence. No additional runtime patch, security bypass or redundant service rollout was needed; real-provider acceptance remains separate.

## Native receipt PDF punctuation — 2026-10-17

- [Public release and original-invoice comparison](docs/evidence/receipt-pdf-hosted-2026-10-17.md): full required CI, fresh snapshot, healthy new Core and actual parsed PDF preserve the existing invoice/order while correcting the lost dashes.
- Encode the declared WinAnsi font correctly: typographic quotes, en/em dashes, bullets, ellipses and Windows-1252 letters now survive PDF text extraction alongside euro signs and Latin-1 accents. PDF string escaping and pagination remain shared by merchant, customer and B2B document downloads.
- Add an actual renderer regression and extend the registered HTTP/PostgreSQL receipt journey to parse the issued PDF through the native bounded extractor. This preserves authorization, invoice identity and duplicate protection; it does not add arbitrary Unicode fonts or fiscal printer certification.

## Actionable receipt setup guidance — 2026-10-17

- [Public delivery and acceptance](docs/evidence/buyer-pos-hosted-2026-10-17.md): complete required CI, preserved own-account/cart entry, German simulated purchase, POS invoice retry without duplicate, actual parsed PDF and version-bound guarded completion. Known PDF punctuation and embedded-browser limitations remain explicit.
- Explain the native missing-seller refusal in EN/DE/FR/ES: complete and save Company details, then retry only the receipt. The recorded POS sale must not be submitted again. Native receipt validation, permissions and idempotency remain unchanged.
- Check the exact generated source inventory before expensive CI work. Include the previously omitted native-workflow caption module; keep the full structure and coverage gates.

## Business-account entry uses the buyer's own identity — 2026-10-17

- Remove the shared demo-credential login from the storefront header. Business account opens the existing customer workspace, prompts unsigned buyers to sign in explicitly and retains the company-purchasing destination after authentication. Already signed-in buyers use their own current session.
- Ordinary My account still opens the overview. Merely opening or cancelling either entry does not submit credentials, rotate a cart or select a purchasing unit. Company access, quotes, approvals and pricing remain under the native current-membership checks.

## Native workflow captions and hosted model acceptance — 2026-10-17

- Reuse native B2B state captions in the visual lifecycle editor and AI proposal review instead of raw requested/rejected IDs; merchant content and stored IDs remain unchanged.
- Record actual configured-model acceptance: unchanged natural-language request, HTTP 200, exact preservation of existing package sections, explicit private install and selected publication of 0.1.3, with the old native order unchanged. Earlier failed attempts retain their own evidence.

## Native workflow context and visible assistant failures — 2026-10-17

- Reproduce a public configured-model refusal on the workflow-proposal release. Feed the actual native graph, per-domain guard/replacement restrictions and registered team scopes into the shared generation schema, which is also used by app editing and coding-agent task exports. The versioned `app-edit@3` prompt consumes that context; earlier templates remain immutable, and rendered-system provenance binds the actual context.
- Distinguish invalid action labels/IDs, unknown rights, unsupported guards and forbidden native transitions. Show the localized failure inside the open assistant dialog while preserving the unfinished prompt.
- Extend the versioned adversarial corpus with quote replacement and oversized-action failures; keep the prior corpus unchanged. No new route, storage table or native financial permission.

## Review native workflow proposals from the App Studio assistant — 2026-10-17

- Let ordinary bounded AI edits add a missing native order or quote workflow. Preserve existing domains and reject changes to their states, edges or guards atomically; explicit capability consent, current rights, immutable versions and selected sandbox publication remain mandatory.
- Show translated action paths, fixed guards and additional permission scopes in the proposal review; explain protected-workflow failures in EN/DE/FR/ES. Version the prompt as `app-edit@2` without changing its predecessor.
- Exercise the actual model HTTP → private install → selected release → native simulated order path. A versioned six-case adversarial provider-output corpus rejects weakened or executable contracts without saved partial builds. Local fixture evidence is separate from hosted model quality and real payment acceptance.

## Native app lifecycles — 2026-10-17

- App-owned order and RFQ review states, fixed native guards and current extra scopes share native transitions, API/MCP/Flow, history and the existing outbox.
- New native objects pin their accepted app version and digest; package upgrades and selected sandbox releases preserve running work.
- App Studio edits the same translated lifecycle contract. Native grids and customer accounts show accepted labels, while public customer projections exclude private policies.
- Require native labels in the configured main language on build, install, settings edits and selected release. Serialize native base edits with app installation; forced database races reject incompatible pairs. Order and RFQ action-authority denials consistently return 403.
- Reproduced and fixed a native B2B customer/unit deadlock: the non-financial last-payment preference no longer updates while checkout holds purchasing locks. A deterministic real-database interleaving preserves the failure and regression.
- Migration 105 admits bounded namespaced RFQ preparation states; offer pricing, buyer acceptance, stock and financial invariants remain native. [Hosted acceptance](docs/evidence/native-app-workflows-hosted-2026-10-17.md) records private installation, selected publication, two guarded native purchases and old/new workflow retention across the version upgrade. Payments remain simulated.

## Hosted native product-app lifecycle — 2026-10-17

- Deliver the verified native-field and POS/startup repairs after a fresh database snapshot, successful migration and healthy restart. Publicly accept visual app creation, native product writes, compatible upgrade with retained data, exact grid filters and selected package/record publication. Repeat the original Storyfront embedded simulated purchase, return and cleared bag; add source-bound screenshots and current status. Real-provider acceptance remains separate.

## Native app object fields — implementation, 2026-10-17

- Preserve actual model labels on generated native anchors; newly bound visual apps now pass full immutable-build validation. Repeat real frontend templates for all four object bindings through server admission/private previews, and illustrate actual browser creation, private installation and native-product writes.

- Fix a reproduced POS status race: payment, latest job and native order are read from one database snapshot, after existing cashier/cart admission. A forced provider-commit interleaving checks coherence and preserves one completion event. Retry transient initial database connections for at most 90 seconds; malformed configuration and authority checks still fail closed.
- Add versioned private product/customer/order/company bindings over the existing four shared app tables; keep native foreign keys, uniqueness, current native/PII/custom scopes, CAS, history and outbox. Preserve legacy package serialization and reject incompatible installed bindings.
- Connect native detail forms, optional existing-grid columns and exact indexed product/customer/order filters before pagination. Reuse HTTP/MCP owners, generate request contracts from the registry, and give reviewed grid plans scoped field metadata plus versioned prompt provenance. Project namespaced graph context without claiming public buyer facts.
- Clone and selectively publish product/company extension configuration; exclude operational customer/order data. Reuse the extracted release predicate, existing schema migration and sandbox publication owners. Add an app-owned four-object example and real PostgreSQL/current-role/native-MCP/sandbox regressions. Hosted acceptance remains distinct in status.md.

## Distinguish an empty product preview from sign-in — 2026-10-16

- A connected merchant with no selected product now receives a product-selection explanation in EN/DE/FR/ES. Only a disconnected session receives sign-in guidance. Preserve native request authorization and pricing; cover both session states in the actual preview component.

## Hosted planning-agent controls and repeated public journeys — 2026-10-16

- Record snapshot-backed migration 104, strict Core readiness, personal stop/re-enable and an actual simulated purchase while merchant agents were stopped. Repeat fresh SaaS AI-product/image creation, Studio handoff, password-session lifecycle and original embedded Storyfront purchase/return/bag clearing. Keep conservative allocations, synthetic payments and unfinished programme boundaries explicit in the canonical status and source-bound receipt.

## Actionable agent admission messages — 2026-10-16

- Explain an administrator's agent stop, revoked access, an unbudgeted integration key, model mismatch and stale stop revisions in EN/DE/FR/ES. Distinguish the persistent token/USD allowance from a transient HTTP 429; waiting cannot replenish it. Keep the structured backend admission and permissions unchanged.
- Show the existing localized Studio error directly, rather than hiding the next step under “Technical details”. Regress actual Studio transport and structured allowance metadata in every interface language.

## Bounded planning-agent delegation and live-shop stop — 2026-10-16

- Reuse existing integration identities for personal, planning-only agent delegation: exact provider/model, explicit lifetime token and integer USD allocation limits, current-role intersection and revocation with retained counters. Generic integration credentials no longer start unbudgeted native AI work.
- Reserve full text-model envelopes durably before egress across replicas/restarts, retain uncertain allocations, and skip query embeddings/reranking for budgeted agents. Allocations are not provider invoices. Typed exhaustion is non-retryable; no short retry hint.
- Bound authority-scope futures before polling so the new context does not multiply large native HTTP/POS frames; test context cleanup and a large child, retain full instrumented HTTP/POS acceptance and export the provider fixture’s server log with CI evidence.
- Use non-key live-root locks for allocations/admission/stop, preserving serialization while allowing commerce foreign-key references; retain a real held-reference regression that fails with the conflicting lock.
- Isolate tasks, request replay and conversations between distinct agent keys sharing one human creator. Add personal revision-bound live/sandbox stop, durable worker cancellation and late-result fences, matching HTTP/MCP/Flow events and generated request contracts. Operational controls never enter sandbox publication or rollback.
- Add explicit four-language controls and fence late key/status responses when changing shops. Exercise actual two-replica allocation races, restricted signed SQL logins, revocation, foreign-shop denial and in-flight worker stop with local synthetic providers. Deployment and real-provider acceptance remain separate in the current status.

## Hosted configuration details and embedded checkout repeat — 2026-10-16

- Record the deployed shared configuration summary in native checkout, confirmation and merchant orders, including public simulated order RAC-75415aa4. Repeat original embedded Storyfront checkout, return and original-bag clearing in native Chrome and Safari; preserve tab-debug-controlled loading failures separately. Refresh current status and reviewed module counts without changing the historical published proof report.

## Clear recovery for an open tab across releases — 2026-10-16

- Distinguish a missing/interrupted lazy module from an API failure in the shared workspace boundary. Explain the version/connection boundary in EN/DE/FR/ES and offer an explicit full-version reload; never silently reload unsaved work, leak the failed URL or loop a rejected cached import. Existing ordinary render retry and permission-aware shell remain unchanged.
- Regress the actual rejected React lazy import for Chrome, Firefox, Safari and chunk errors, plus a normal network-error counterexample.

## Frozen configuration details throughout purchase — 2026-10-16

- Show accepted material, dimensions and localized choices consistently in checkout, confirmation, native order details and app purchase history. Freeze only declared public labels and values with the accepted configuration, preserving the shop main-language fallback and explicit source currency. Later package or material edits do not rewrite completed orders. Existing snapshots remain readable without a current package lookup.
- Extend the actual B2B/material/order-list/reorder integration to verify changed field labels and material names against immutable original receipts. Cover false/zero, a fifth content language, private-library exclusion, escaped text and zero-decimal currency in the shared display.

## Hosted hardening and app workflow acceptance — 2026-10-16

- Record the actual snapshot-backed migration 103, healthy strict Core restart, new SaaS AI catalogue/images, Studio handoff, original embedded Storyfront purchase/bag clear and privately tested/published app with a configured public purchase. Keep simulated payment, local B2B approval/reorder and the newly found purchase-summary gap distinct. Refresh the canonical status instead of adding PR notes to README.

- CI integration now owns a uniquely named disposable database, including the
  rollback-only outbox migration rehearsal. Its production-database refusal stays
  intact. Subscriber migration/lock checks run before the slower provider fleet;
  a regression check prevents the workflow from reusing its named bootstrap DB.

## Workspace-wide coverage accounting — 2026-10-16

- Include all workspace packages when collecting Rust reports after the crate extraction. Report unmeasured Rust files in extracted libraries and app packages alongside the root, retaining the existing coverage floors and the distinction between unmeasured files and covered behavior.

## Stable customer lookup regression — 2026-10-16

- Search for the fixture customer’s complete name in the role/B2B acceptance test. A seeded random customer number can legitimately contain the short substring `Ada`; this must not be mistaken for a tenant/privacy or filtering failure. Keep exact identity and minimized-field assertions.

## Checkout and subscriber lock ordering — 2026-10-16

- Reproduce a two-replica checkout deadlock between product locks and an event producer touching a locked subscriber schedule. Create the four schedules with the tenant instead of on every commerce event. A held-scheduler regression fails before the repair and commits the event afterwards; existing delayed/quarantined migration state and late commits remain covered.

## Compiler boundaries, native tools and independent subscribers — 2026-10-16

- Extract real kernel, runtime, commerce, app sandbox and cognition-provider crates into a Cargo workspace. Keep existing native handlers as composition owners; dependency checks reject reverse domain imports. This is an initial compiler boundary, not a complete rewrite of every root handler.
- Use native OpenAI Responses/Chat, Claude and Ollama read tool calls with exact tool aliases, correlation IDs, bounded private continuation and current authorization. Preserve durable native task checkpoints and proposal review.
- Version four central prompts and record template/rendered digests in model usage. Generate request OpenAPI, TypeScript and WIT from the compiled operation registry; output DTO completion remains open.
- Add independent cognition/apps/flows/audit outbox checkpoints, isolated retry/quarantine and fresh-snapshot aggregate acknowledgement. Correlate native requests, SQL transactions, tasks, model calls and deliveries without logging bodies or capabilities. Migration 103 is not publicly applied by this documentation update.
- Remove binary multiplication from the final decimal-to-minor-unit currency boundary and test signed halfway/overflow cases. The broader floating-point pricing migration remains open.
- Replace the oversized README with a concise entry point, add the canonical status page and documentation hygiene checks, and move detailed instructions into scoped AGENTS files.
- Renew public original Storyfront iframe acceptance with simulated order RAC-b359e75d, German product labels, verified completion and a cleared original bag. Record the controlled-tab document pause separately; no real payment/mail/refund claim. Public Google sign-in/reload/logout passed; Apple's new callback remains rejected by its provider configuration.


## Connected furniture configuration — local implementation, 16 October 2026

- Connect an app-owned material library and dimensional surcharge to native company approval, checkout, private/shared saved-input lists, current-price reorder and selected package release. Preserve original accepted material snapshots and explicit source-currency fees on completed orders.
- Execute frozen positive/negative configuration examples before immutable save or installation. Share form/HTTP/MCP cart admission, enforce current channel and order-read authority, and publish minimized changes through the existing outbox/Flow consumer.
- Add the editable App Studio pattern, paginated material choices, localized expectation/purchase cards and native order navigation. Fix seeded-record staging clones and filter configured purchases before pagination.
- Preserve configuration controls and confirmation during repricing; refresh catalogue stock/prices after cart changes and purchase. Product detail and listing share the active configuration quote; completed-cart choices do not change prices for a new purchase.
- Use the common content-language selector and translation fields in installed app data: regional language codes, non-English main-language inheritance and untouched translations are preserved. Failed purchase-history pagination retains its current page.
- Local Chrome completed a German walnut/special-dimension simulated purchase for EUR 517 and showed an empty cart. Automated and local browser tests are separate from pending hosted and real-provider acceptance. Generalized entity/lifecycle extension, replay, source hosting, Crater, Shopware porting and Enterprise-cell gates remain open.
## Proportionate prototype verification — 16 October 2026

- Run PR verification once, cancel superseded revisions of the same PR, and distinguish documentation, ordinary presentation and full-system changes through a conservative complete Git diff. Retain full verification for backend, authentication/checkout, CI-policy, unknown or unavailable changes; renamed/deleted backend paths cannot hide in a documentation change.
- Keep the required check, unchanged frontend coverage floors and full-module gates. Nightly/manual runs retain the complete suite; fast paths do not claim new Rust/Python coverage. Add real-Git routing regressions and visible per-suite timing/unbuffered integration output.

## Public Studio and Experience acceptance — 16 October 2026

- Deploy Core PR 141 and private Experience PR 73; verify current public Shop Knowledge, illustrated app creation and native preview controls. No design test changes were saved or published.
- Complete a fresh Safari simulated purchase inside original Storyfront's native checkout: RAC-c10e5d2f, 24.90 EUR, German product name, confirmation and original bag clearing. Record controlled Chrome's paused iframe and visible timeout/retry separately; no real payment or external delivery is claimed.
- Make the embedding-contention fixture acquire its real lease atomically with bounded waiting instead of asserting after a racy idle snapshot; leave production admission and other owners' leases untouched.

## App documentation reconciliation — 16 October 2026

- Add one delivered/partial/open app-system map, with source owners and dated acceptance; connect it from README, handbook navigation, website and machine-readable discovery.
- Correct obsolete per-app-table and migration instructions to the fixed shared storage contract. Update durable-agent and enforced-database status without declaring the full business-capability concept complete.
- Put the latest recorded 16 October hosted acceptance before older release history; preserve earlier receipts and distinguish embedded simulated purchase acceptance from real settlement, restore or capacity evidence.
- Keep isolated source compilation, complete B2B configurator, generalized entity/lifecycle extensions, historical replay, managed runtime, fleet compatibility, Shopware porting and Enterprise-cell operation explicitly open until their actual acceptance succeeds.

## Connected merchant price boundaries — 2026-10-16

- Replace the clipped knowledge tab strip with grouped navigation and a labelled mobile selector.
- Rebuild AI price boundaries around approval modes, searchable native products, ordinary money/percentage units, progressive margin/cost controls and clear sandbox/revision feedback. Preserve native price-only limits and explicit per-product boundaries.
- Connect saved policy to product editing, the shared assistant, Rules & flows, settings and staging; respect current permissions and guard pending edits within knowledge navigation.
- Add a bounded, cursor-paged policy projection to the existing authorized commerce read operation. The merchant planner can read exact saved boundaries without an oversized whole-settings response. No new policy database, pricing engine or worker.
- Verify money scales, invalid inputs, stale revisions, read-only admission and connected actions in frontend tests; exact native pagination in Rust; policy read/model transcript and current guardrail execution in provider fixtures.


## Merchant-context assistant and reviewed catalogue intake

- Remove shopper/hard-coded-SKU welcome prompts from merchant Studio. Give the existing planner explicit merchant, current workspace, sandbox, main-language and current-rights context; offer source-driven catalogue setup rather than generic buyer advice.
- Add actual CSV upload, accessible product/shop URL extraction and described fictional products with editable previews, selected sandbox-only creation and optional existing media jobs. CSV remains deterministic; model output and sources are untrusted.
- Reuse Rust native creation/history/knowledge/outbox, shared inference quotas and the canonical API/MCP contract. Add bounded input, line-specific localized CSV errors, public DNS-pinned egress, stable creation IDs, exact retry reconciliation and locked settings-revision admission. No new tables, runtime or queues.
- Correct direct product navigation across an explicitly chosen sandbox without retaining a target on another shop. Add native CSV/release, model/image, durable-worker and browser/component regressions. Local synthetic verification is distinct from real-model quality and public deployment.


## Understandable app ideas and explicit agent handoff

- Replace the technical-first business-goal screen with a plain-language idea brief, example starting points, optional requirements, visible agent/design next steps and a three-step private-preview guide. Keep inherited fields visibly editable.
- Reuse the existing agent drawer and composer for an explicit editable handoff. Bind pending requests to the current app/sandbox, consume once, and do not automatically invoke inference, export a task or change a Manifest. Codex/Claude retain the existing task and reviewed-import path.
- Collapse optional pure-rule checks, distinguish frozen expectations from actual execution results, and explain an empty set without implying that the whole app failed. Existing rights, frozen cases, private versions and native runtime stay authoritative.

## Guided app creation

- Put app name and compact content-language context first. Group native placements by shop, purchase/account, administration, POS and B2B; illustrate each with a location sketch and specific icon. Keep a removable selected-area summary and explicit zero/six-selection guidance.
- Collapse generated identifiers and explicit agent access into technical options; open invalid identifiers for correction. Reuse normal Manifest compilation, private editing and immutable sandbox versions. Correct missing borders and dark appearance by using Studio theme tokens.

## Direct shop-design interactions

- Insert illustrated built-in and installed-app elements at visible preview boundaries; reorder via captured mouse/touch drag or native drag fallback, section arrows, and page-tree controls. Remove sections with in-canvas bin controls and undo/redo using the same private draft. Published storefronts receive no editor controls.
- Make reference URLs and design/screenshot upload visible in the existing agent rail. Bound and reduce large images locally, preserve earlier references on failure, keep source-copying opt-in, and fence delayed proposals against newer edits and workspace changes. Existing Rust inference, revision-bound tasks, rights, app storage and selective sandbox publication remain authoritative.

## Browser continuation follow-up

- Add explicit same-account browser continuation for interrupted Studio editors. Recheck the native session, current shop membership, candidate proof and editor generation before accepting; retain private drafts and never replay failed writes.
- Ignore delayed 401 responses from older accepted browser proofs and fence pending initial profile reads against explicit sign-in. Preserve refusal of cross-account browser adoption.

## Hosted acceptance follow-up

- Complete the coordinated hosted shared-app-storage cutover after a fresh backup and stopped old Core. Retire eight verified legacy tables; confirm four fixed forced-RLS tables after new installations, private page publication and three public simulated checkout flows. Record results and explicit acceptance boundaries separately from local verification.
- Show the supplied shop name in an unconfigured standard storefront instead of its technical address. Reuse the existing tenant-scoped public company projection; preserve explicit brand translations, legal identity, settings revisions and receipt issuer snapshots.

## Shared managed app storage

- Replace per-shop/app/model SQL tables and indexes with four fixed shared tables, logical model versions, typed JSONB records, bounded lookup/unique projections and real tenant-aware references.
- Preserve existing API/MCP/Flow/UI, CAS/history, native hook/configuration pricing, public pages/forms and selected sandbox publication. F5 resets only scoped private rows.
- Add verified maintenance migration of populated existing models/relations with original IDs/revisions, quota/document retention and safe abort controls; old Core writers must be drained. Production cutover is not implied by local verification.
- Keep existing package/model/field/index/row/byte caps; table count does not prove unlimited throughput.
- Correct a reproduced planner conflict exposed by the full CI run: checkpoint validation re-admits the exact supplied document evidence rather than re-running an availability-dependent search. Real embedding-admission changes no longer stop unchanged work; archiving a supplied private source still stops before an executable proposal.

## Durable merchant planning — published, 15 October 2026

- Extend native tasks/conversations with private context and completed inference checkpoints, actor/scopes/credential-kind ceilings, fenced leases, uncertainty, cancellation and explicit revision-bound continuation. Do not store bearer credentials or introduce a second queue, planner or approval path.
- Recheck current membership, session/key, shop/stage and previously read evidence before continuation. Kill/restart a real Rust worker during a synthetic provider call; completed steps are reused and revoked/withdrawn inputs stop late results. Only native approval changes the product.
- Submit Studio chat in the background and restore run progress on reload. Fence late responses by account/shop/stage/conversation; show localized progress and explicit uncertain-call controls. Accepted sends are not restored as retries after a separate refresh failure.
- Share HTTP/MCP run operations through the native capability registry. Deduplicate same-actor request IDs, including parallel retries at the final daily quota; preserve synchronous planning errors. Keep read-only metadata conservative and private checkpoints out of API/events.
- Add the Rust `agent-worker` role, bounded per-tenant admission and migration 100 on existing operational tables. PR 135 passed both exact-head verification runs and is publicly deployed. A real read-only task finished after a browser reload and returned the current stock. Arbitrary app effects are not resumable.
- Keep new/resumed run quota admission and task persistence in one transaction; verify the full durable worker flow through a real one-backend transaction pooler. Propagate tenant scope into native collector children and recheck live shop status before service egress. The connector no longer reads Core tables directly.

## Browser session boundary — published, 15 October 2026

- Adapt existing merchant/platform and separate tenant customer ledgers to host-only HttpOnly cookies, exact origins and per-tab anti-CSRF/session fences. Explicit API/MCP bearer contracts remain compatible; browser authentication JSON contains no opaque bearer.
- Keep passive session/profile responses free of cookie mutations and pin customer response handling to the originating tenant and session generation. Late successes/errors cannot overwrite or clear a newly accepted identity. Legacy credentials leave browser storage and remain memory-only until the next explicit sign-in/handoff.
- Use the shared transport for platform administration, private previews, native MCP, binary documents, refunds and final checkout. Failed sign-out stays visible instead of faking success.
- Restrict scripts on every response from the merchant credential origin to build-owned assets; preserve the existing renderer framing policy and separate-shop autocomplete. Shared checkout retains manual address entry. Add real HTTP/MFA/customer/negative cases and delayed-response frontend regressions.


## Authenticated database authority — production enforced, 15 October 2026

- Separate restricted tenant/system connection pools within the existing process and fleet budget. Ordinary serving no longer requires the migration credential.
- Bind transaction-local tenant, actor and personal-session context to the actual SQL login through short-lived signed tickets; keep tickets out of SQL query text. Add restrictive policies alongside existing row/actor checks, narrowly admitted identity reads and canonical language registration.
- Keep app model changes in the native system owner; tenant SQL cannot own tables, disable RLS or create schema objects. HTTP and MCP developer staging share trusted native admission. The subsequent migrations 101–102 replace the earlier per-model tables with the fixed shared store; see the shared-storage release above.
- Add migration-only configure/activate/status/rotate commands, staged rollout, startup role/policy audits, minute refresh and retiring-key overlap. No production credential is created by migration or application startup.
- Repeat actual two-replica runtime, restart, current-rights, inventory, documents, app and selective release flows with separate logins. Add actual tenant-connection attacks, private actor substitution and signing-key rotation tests. SQL/cryptographic integration remains tested, outside the selected pure Lean proofs.
- Complete the approved hosted cutover: restricted distinct logins, effective PUBLIC TEMP removal, signed pools, connector upgrade and removal of its obsolete Core-table grant. Activate database enforcement and restart without the staged exception. Native status reports `enforced=true`; the temporary maintenance administrator reference is removed. A new simulated checkout, Studio session reload/order read and saved agent task passed. The new embedded-browser checkout check remains blocked in Browser Use and is not counted as a pass; the prior release's embedded check remains historical evidence.

## Product content and inventory concurrency — published, 15 October 2026

- Preserve aggregate product revisions and add a content clock through additive migration 098. Existing replicas advance it during rolling releases; stock-only purchases/releases leave it stable.
- Native HTTP/MCP content-only saves preserve current stock under the existing row lock. Explicit quantities and legacy clients still require the current aggregate revision; stale content reports the appropriate revision pointer.
- The Studio omits untouched quantities and refreshes current stock after saving. History restoration and selected sandbox publication retain live inventory and exclude operational clocks from configuration digests.
- Exercise actual two-replica purchase/content-save/cancellation/MCP and stale-write rejection, existing catalogue/history/staging/currency/translation paths and the real product editor. This does not add a second inventory ledger or change checkout money representations.

## Business goals and executable app examples — merged, 15 October 2026

- Extend the existing Manifest with optional versioned, localized intent/assumptions and bounded frozen pure-commerce cases. Keep legacy serialization unchanged.
- Run declared examples in the actual isolated WIT component before development save and native installation; traps/mismatches block mutation with a precise case pointer. Preserve cases across AI presentation edits, staging and selected release.
- Bind Studio connection presentation to the current shop/sandbox during render, avoiding premature failure messages and the preceding scope’s connected view before replacement requests start.
- Add a compact Business goal tab to App Studio, keeping the contextual agent drawer and the same visual/coding definition. Cards distinguish expected outcomes from verification claims; content inherits the configured shop language.
- Version the snapshot-pricing example package as 1.1.0 with five deterministic cases, including JPY and validation. Actual checkout, tenant isolation and publication regressions retain their native consumers. Human confirmation provenance, historical replay, managed source builds and fleet compatibility remain open.

## Shared operations and reliability — released, 15 October 2026

- Move native input schemas, discovery and bounded agent-read policy into one immutable operation registry; retain boxed domain dispatch and current domain/object/PII rights. Reject duplicate native names and remove duplicate B2B registrations.
- Share native/app tool metadata; support optional bounded declared app result contracts without changing legacy package digests. Reject invalid results without exposing payloads or suggesting automatic replay of ambiguous writes.
- Add typed safe error kinds, explicit scope/JSON Pointer/current app-record revision and distinct JSON-RPC request/method/parameter/server errors. Enforce native MCP schemas including nullable values.
- Escape quoted SQL field names in release builds. Add durable per-tenant outbox scheduling fairness while preserving existing events, retries, poison-event isolation, Flow/app consumers and forced RLS.
- Record remaining security, money, storage, agent-run and compatibility work explicitly. Adopt the connected business-capability direction without claiming managed microVM/build hosting or fleet-wide replay has already shipped.

## 15 October 2026 — connected App Studio workbench

- Multi-select assistant placements create ordinary editable surfaces in one app; native checkout mounts join global header, homepage, product, cart, account and page elements.
- Illustrated toolbox, stack/grid drag/drop, bounded resizable panels, directly editable form-field captions and a contextual AI drawer reduce hidden designer behavior. The drawer retains unfinished prompts; advanced schema/import tools stay collapsed.
- UI behavior reuses the existing Flow topology over the bounded AST; the existing Flow Builder remains the server automation owner.
- Versioned setting declarations configure installed apps through the existing encrypted digest/CAS-bound secret store. Credentials remain live-only, redacted on reads and absent from agent exports/public payloads.
- Searchable, grouped permissions and properly spaced key forms support explicit non-expiring keys for current personal administrators. Creator membership intersection and immediate revocation remain in force; integrations cannot create permanent children.
- New package IDs and declared indexes have bounded schema admission. The new permanent-credential decision is extracted to Lean; SQL, cryptography, remote providers and UI behavior remain outside that proof.


## Visual elements and one agent workspace — 15 October 2026

- Replace the sprawling inspector with Edit / Elements / Agent / History, a compact page-and-section tree and graphical page templates. Shared Tiptap controls now have small icon buttons and a single extra-formatting menu in every host.
- Add searchable illustrated component cards. Installed apps declare `storefront.block` native surfaces; pages store stable `{app,surface}` references and reuse existing public registry, localization, action grants and native renderer. No app source is copied into host directories.
- Use shared agent controls in App Studio and Shop design. Native AI retains the centrally configured inference service; Codex/Claude Code use credential-free task export and returned-result review, not background execution. New HTTP/MCP task/propose contracts share current sandbox, rights, revision checks, proposal/apply and publication owners.
- Server-narrowed read-only preview grants reject writes. Real PostgreSQL tests cover app-owned elements, own/foreign/private/inactive admission, selected release, explicit review and stale revisions. Browser acceptance includes inserting/saving a real Care knowledge app element and preparing a Codex task; native AI inference uses synthetic model fixtures.
- Public native app elements follow the editor’s selected content language instead of the browser preference; a fifth-language regression preserves the independent interface setting.
- Align all-source coverage accounting with app-owned test directories; retain runtime coverage floors and negative architecture controls.

## Preview-first shop design — 15 October 2026

- Show the existing native storefront immediately and select saved home pages automatically; remove the blank new-page prerequisite and oversized introductory layout.
- Use shared native header/hero/product/footer views in an isolated responsive canvas, with contextual properties, on-demand page navigation and persistent save controls. The design preview starts no cart, checkout, tracking or AI session.
- Open publication review in the actual editor sandbox; keep native app saves/history/release, fork inherited home pages only on edit, preserve actual locale text and product-media selection, and correct the rich editor's language-code-as-prose fallback.
- Keep session-bound merchant previews on their shared origin instead of redirecting away from the host-bound cookie. Add app-owned UI regressions and channel/locale transport checks.

## Hosted runtime separation — 15 October 2026

- Switch hosted Core `5e4c18b` to a restricted, non-owner PostgreSQL login with mandatory RLS, separate runtime/listener connections, migration-only owner access and disabled bootstrap authentication.
- Preserve the existing platform encryption key when splitting secret groups; remove the temporary diagnostic job from the new Core-only secrets.
- Verify actual runtime flags and database identity, direct SQL tenant denials, personal sign-in, native shop provisioning, simulated checkout, stock/cart effects, Admin order/customer projection and completed default order Flow. Paid provider settlement and exhaustive security/failover checks remain separate.
- Document managed database administrator/table-owner separation and the hosted transition checklist.

## Personal workspace and visual standard-shop design — 15 October 2026

- Personal, revisioned work areas with role-aware presets, movable cards, safe pinned grid filters, goals and existing proposal review. Goal-to-Flow creates an inactive native draft.
- App-owned standard storefront editor with one preview/published renderer, localized Tiptap sections, products, theme inheritance, pages, articles and forms; original private Storyfront stays original.
- Public app publication projections enforce channel, status and start time. Private append-only form intake validates the published definition and native cart, then uses existing outbox/Flows; responses require customer PII rights and never become release units.
- Shared bounded app-record history with original read scopes, actor/source, CAS restore and current-field projection. Package-before-record fences protect concurrent saves/releases.
- Central inference prepares source-aware design alternatives as existing review tasks; explicit sandbox approval, revision checks, reference egress/image bounds and enforced style/content/structure selections.
- Native PostgreSQL, synthetic-model, browser and frontend regression evidence and illustrated tutorial added. Real providers, production settlement and whole-business autonomous goal completion are not certified by these fixtures.

## Channel and Storyfront setup — 15 October 2026

- Type-first responsive channel cards, relevant visibility fields, inline validation,
  readable review and an explicit post-save next step; shared localized content fields.
- Marketplace Studio opens inside the current workspace, uses native app consent and
  preselects the originating channel. Installed-app deep links no longer open the library.
- Storyfront self-service connects an existing Core shop/channel through the private
  Experience service and original Studio; current rights, enabled languages, revisions,
  durable retries and publication admission remain explicit. No duplicate commerce shop.
- Illustrated setup guide and local browser/HTTP/queue regression boundaries documented.


## 14 October 2026 — coherent settings and native Admin creation

- Group and search shop settings by foundations, markets/pricing, checkout/fulfillment and customers/business; keep domain-specific shortcuts permission-aware.
- Repair currency card padding, scope/language toolbar, responsive navigation and catalogue-job permission visibility. Load translated-field and language-picker styles from their shared owners so direct editor entry looks the same as navigation through settings. Give shared B2B customer pickers the complete form width, separate name/email and remove default fieldset frames.
- Create CRM profiles and default billing/shipping addresses atomically through native Rust owners, with history/outbox and idempotent retries; no customer credentials are issued. Keep auto-filled address company names complete while preserving explicitly different recipient data.
- Build actor-private manual-order quotes from bounded customer/product lookup, addresses, channel language/currency and native coupon/method pricing. Explicit review binds the exact total and revision before shared checkout.
- Enforce final manual/simulated payment mode under native locks, preserve original customer binding, block stolen private tokens from checkout/logout/downloads and serialize settings/channel/customer/cart changes and same-customer orders.
- Document configuration gaps and the financial/operational sandbox boundary; add real API/MCP/PostgreSQL and UI regressions plus an extracted small admin-payment admission proof.

## 14 October 2026 — hosted AI/source catalogue onboarding

The separately deployed hosted SaaS wizard now offers a reviewed initial AI or
URL-imported catalogue alongside empty and sample shops. Shared preview/approval,
translation, native import and optional media jobs keep commerce data in Rust;
ordinary creation does not initialize Storyfront. Document limits, ownership,
retry checkpoints, explicit native money/stock and actual fixture proof boundaries.


## AI-first website and connected handbook — 14 October 2026

- Add seven ordered handbook paths, chapter/outline navigation and ranked search over every published Markdown source.
- Keep Markdown and the existing verified Pages publisher authoritative; the website consumes that public publication through its isolated apex-only facade.
- Localize handbook interface and reading-path descriptions in English, German, French and Spanish; retain and label original English technical articles.
- Refresh README screenshots from the actual blue Veyndo UI and explain the synthetic/local-model capture boundary.

## Unreleased — EDI identity and hosted RLS evidence

- EDI exports fingerprint the actual serialized document and native source identifiers; operational notes no longer change an identical export's identity. The regression uses the existing native order-note API, and the implementation stays app-owned.
- The 14 October read-only audit found no mandatory RLS switch or separate hosted runtime credential. The authorized 15 October hosted transition closes that dated gap; see the entry above for its targeted live verification and limits.

## First visitor and contributor entry — 14 October 2026

- Add one connected first tour, an agent workshop and a scoped public roadmap.
- Add an isolated loopback-only container tour without a local Rust/Node toolchain.
- Publish the existing Rust image from protected main after the required PR verification and an actual container/HTTP smoke check; preserve immutable source tags.
- Make actual recordings and first contribution tasks visible from the README and docs homepage.
- Add first-tour feedback and a private local GitHub traffic snapshot tool.

## Historical customer ownership — 14 October 2026

- Remove email-only account ownership for old guest orders. Account history,
  issued PDFs and paid download consumers share the native immutable customer-ID
  predicate; a newly registered email cannot claim historical guest purchases.
- Preserve admitted CRM lookup and exact original cart-token paid downloads.
  Do not guess legacy identities or rewrite old financial snapshots.
- Add real failing-before/passing-after registration/order cases and actual
  historical paid-file/PDF denial, guest-capability and merchant-access regressions
  in the existing isolated suite registry. Keep SQL safety and partial proof limits.
- Prevent a typed guest email from forging verified-purchase badges or reserving
  another buyer's review identity. Review-count rules consume stable account
  submissions; append-only migration 093 withdraws unverifiable historical
  email-derived badges while retaining text, rating and moderation.

## Repeated cross-component audit and history discovery — 14 October 2026

- Align advertised MCP history tools with the native entity read/write/PII
  conjunctions. Write-only roles no longer see unusable restore commands and
  PII-denied customer/order/B2B readers no longer see private history operations.
  Actual snapshot access remains guarded by its existing native owner.
- Share the canonical history entity registry and PII classification with the
  schema and invocation. Add failing-before/passing-after narrow-role HTTP/MCP
  counterexamples without another identity, history or release subsystem.
- Refresh the complete component and version/sandbox status matrix, 49 isolated
  suite checks, private Experience's 230-test check and explicit open boundaries.
- Correct the documented integration registry to 85 suites; distinguish provider
  fixtures, build warnings, selected proofs and source tests from hosted acceptance.
- Give the anonymous hosting verifier bounded diagnostics for non-JSON/wrong-status
  replies. Preserve failure rather than claiming an edge denial proves native
  application admission; add actual failure-preservation tooling regressions.
- Correct the registration probe to reach the native closed-signup policy with
  the proper DTO shape but deliberately invalid email/empty password, preserving
  its inability to create a shop. The public anonymous smoke check passes.

## Shared agentic Studio grids — 14 October 2026

- Replace fixed order/product/customer lists with one configurable grid: draggable
  and keyboard-orderable columns, visibility, density, server search/filter/sort
  and stable cursor pages. Preserve criteria through native detail navigation.
- Add reviewed natural-language filter planning via the central model and the same
  HTTP/MCP contract, with current domain/PII rights and replica-wide admission.
- Reuse the visual shell in declarative app tables, preserving native write forms.
- Add real isolated Store API/PostgreSQL/model wire regressions and translated controls.
- Support strict OpenAI nullable optional fields through the same validated planner;
  preserve false-valued filters and reject unknown null identity fields. Verify
  real HTTP/MCP provider response handling across a native restart.
- Add illustrated usage/ownership documentation, touch-safe popovers, false-valued
  filter chips and an always-accessible details action when the main column is hidden.

## System consistency and narrow-role boundaries — 14 October 2026

- Use knowledge scopes for source-document stage diffs/publication, protecting
  private source changes from catalog-only readers and enabling knowledge-only editors.
- Align automation import HTTP rights and MCP discovery with native scopes;
  write-only roles need no unrelated reads and channel roles cannot invoke rule writes.
- Add real HTTP/MCP/PostgreSQL regressions and an audit separating connected
  foundations from incomplete history, Storyfront, AI and release scope.
- Correct outdated group, event, scope, SKU/SEO and shipping documentation.
## Shopware-blue Veyndo identity — 14 October 2026

- Replace the lime logo/favicon/README artwork with #189EFF and share one blue UI palette.
- Apply readable blue actions and cool neutral light/dark themes across Studio, customer account, storefront and operator console; remove duplicated Studio palette overrides.
- Keep canonical vector copies synchronized and document the central token owner.
- Make the order workflow card use those theme tokens too, preserving readable
  status, cancellation and action text in dark Studio.

## Partial packages and provider-neutral shipping apps — 14 October 2026

- Split open physical packages through one native HTTP/MCP operation with current
  rights, tenant scope, order revision, stable replay and a shared fulfillment guard.
  Conserve line quantities, immutable price/taxes and stock; order completion waits
  for all packages. Delivery notes print only the selected package.
- Reuse private order receipts for immutable carrier PDFs, aggregate app quotas,
  customer-owned return downloads, tracking, activity and document/split Flow events.
- Freeze native package intent before an external effect. Unknown outcomes block
  allocation, dispatch and cross-provider substitution across process restart.
- Add specific delivery/document callback consent and own-job status reads without
  leaking inputs or leases. Manager lists redact results after action-right loss.
- Connect order-bound Flow actions to current personal identity and stable job keys;
  update the shipping App Studio assistant/example to this same generic contract.
- Keep provider protocols, credentials and UI in their app packages. This release
  deliberately ships no carrier adapter. Local fixtures verify the actual native
  job/PDF/tracking/Flow path without paid bookings or external credentials.
  [Usage, ownership, configuration and limits](docs/shipping-workflows.md).

## Personal account security — 14 October 2026

- Add native authenticator enrollment, expiring bounded challenges, replay-safe TOTP,
  one-use recovery codes and immediate personal-session/handoff revocation.
- Keep verified email recovery, credential revisions, private Experience continuations,
  operator/merchant sign-in and new-shop creation behind the same factor admission.
- Recheck private Experience cookies against native proof; refresh retry proof before
  brand/model work. Recover interrupted Studio handoffs without repeating credential changes.
- Keep credentials outside sandbox/release/history restoration. Use existing encrypted
  state and outbox for secret-free security-change events; extend selected Lean admission
  coverage without claiming cryptography, SQL or provider correctness is proved.
- [Configuration, source ownership and synthetic end-to-end tests](docs/account-security.md).

## Studio setup and reusable roles — 13 October 2026

- Fix POS/marketplace wizard validation across interface and content languages. New channels start in the shop main language; missing fields have targeted errors and accessible invalid states.
- Add an explicit App Studio overview return that retains the current draft and closes private previews.
- Persist localized tenant roles with standard defaults, CAS/history, immutable owner authority, reference-checked custom deletion and immediately current session/key/worker grants. Team delegation and acceptance serialize with role changes; retained overrides also require current delegation authority.
- Add domain scopes and shared readable permission selectors. Filter Studio navigation, direct workspaces and startup data; preserve normal reauthentication drafts. Protect full CRM/order/history/PDF data with the separate PII grant, and redact arbitrary Flow results for limited readers.
- Add central versioned B2B feature settings, an explanatory module landing, atomic guided company/unit/customer creation and bounded indexed customer search.
- Add real PostgreSQL concurrent-demotion, privacy, MCP and rollback tests, plus visible wizard, role-editor, App Studio return and limited-navigation regressions. [Usage, ownership and limits](docs/studio-access-and-setup.md).

## UCP B2B offer negotiation — 13 October 2026

- Advertise the versioned Veyndo B2B negotiation extension alongside UCP checkout, with a namespace-bound composed schema and configured hosted endpoint.
- Route buyer RFQs, counterproposal messages, original-cart offer acceptance/release and purchasing approval requests to existing B2B owners; retain the merchant Studio quote inbox, APIs, MCP, history and transactional Flow events.
- Select exact platform capability versions through bounded public HTTPS profiles, or an explicit vendor client shortcut. Profile compatibility never grants identity; current customer/unit permissions, foreign-object denial, CAS, expiry, budgets and final checkout guards remain native.
- Expose current purchasing blockers, original-cart quote reads, scoped continuation/order URLs and terminal quote state. Add real PostgreSQL/UCP purchase and denial regressions; preserve the selected-protocol and simulated-payment boundaries.
- Document the sequence, native operations, extension version and ownership; regenerate the Developer API catalogue and complete rendered source inventory.


## New feature video tours — 13 October 2026

- Add three silent 1080p tours with English captions: POS/shared orders/B2B, visual apps/working preview/Flow canvas/selected release, and marketplace content/consented visitor statistics/semantic journeys.
- Add an on-demand chapter gallery to the public website, linked README posters and complete transcripts/capture boundaries. Preserve the six existing workflow clips and original Experience/SaaS tours.
- Extend the existing player for independent tab groups, one active video and chapter seeking; verify complete rendered documentation, media hashes and caption timing. [Tours and provenance](docs/video-tours.md).

## MCP dispatcher stack repair — 13 October 2026

- Reproduce a real worker-stack overflow in Linux coverage CI on `pos.cart`. Select and return only the chosen boxed domain future before polling it; inactive domain futures no longer inflate the shared asynchronous dispatcher frame.
- Retain native permission checks and HTTP/MCP/agent contracts. Real POS and B2B PostgreSQL suites pass with a 1.5 MiB worker stack locally, without increasing the production stack limit. Coverage CI remains the release gate; future-size inspection alone did not detect this poll-frame failure.

## Connected feature audit and repairs — 12 October 2026

- Require each selected release unit's native rights; validate current Flow action permissions and rebind its publishing actor. Share native channel validation and initialize selected POS cash/pickup defaults.
- Reject direct analytics capture from staging/preview. Add inherited versioned enable/retention/intake settings, current-consent disclosure and matching report/Storefront admission.
- Expose B2B entity history over the shared MCP schema and company/unit Studio controls. Restore configuration with current revision and native allocation/hierarchy validation; financial history remains inspection-only.
- Clone/publish selected B2B company/unit policies and catalog selection through shared transactional writers, preserving live employees/spending and denying hidden/unauthorized changes.
- Include B2B method/currency dependencies and monetary-storage guards in existing configuration/release owners. Add actual PostgreSQL/HTTP and UI regressions; no new commerce ledger or plugin source relocation.
- Refresh owner documentation, README and complete rendered documentation. [Audit matrix and boundaries](docs/feature-integration.md).

## Visitor behavior intelligence — 12 October 2026

- Native consent-bound guest/customer observations reuse the PostgreSQL event ledger, authenticated identity and native orders; no parallel analytics service or tracker identity.
- Channel/window reports, coarse browser/device/language/referrer and separate visitor/destination countries connect to current semantic product relationships. Studio provides charts, linked graph and permission-gated timelines in EN/DE/FR/ES.
- HTTP and MCP share report/PII permissions; repeated events, cross-shop IDs, forged customer/purchase events, consent withdrawal, bounded intake and expiration are tested. Trusted geography remains an optional operator-configured ingress.
- Native storefront capture is included; headless/Storyfront adapters must explicitly adopt the consent-bound contract. No automatic model training or causal conversion claim. [Guide](docs/behavior-intelligence.md).

## Marketplace channels and independent Rust app — 12 October 2026

- Add a private integration channel type, native tenant-scoped product/channel projections and authorized paid-order intake. Reuse exact minor currency amounts, native guest customer snapshots, stock allocation, order history, outbox and invoice/PDF owners.
- Add app-owned Amazon Listings Items/current Orders 2026 API, eBay inventory/offer reconciliation and Kaufland signed product/unit/order-detail adapters. Preserve stable SKU identities and paginated retrieval.
- Add multilingual connection, offer, mapping-preview and structured source-order review UI. Per-offer translated contents, media, prices, category policies and explicit data-only attributes inherit from one native catalogue.
- Reuse current-consent app callbacks and native leased jobs; add bounded external responses, heartbeat, CAS transmission uncertainty fences, actor rights and no blind listing retries.
- Add a non-root Rust-only service image, operator setup, native App Studio sales-channel references, API/MCP/Flow action contracts and registered local-provider/PostgreSQL/UI regressions.
- This is not live seller certification, automatic full-catalogue stock propagation or complete marketplace accounting/fulfillment/refund synchronization; prerequisites and remaining scope are explicit in the marketplace guide.

## Focused cashier workspace — 12 October 2026

- Add dedicated register/fullscreen controls, bounded product/customer search, customer-number card scanning, visible addition feedback and native customer-price rendering.
- Add revision/actor/current-PII-bound customer selection with shared billing/group repricing; stale/deactivated identities are rejected at settlement.
- Add reasoned percentage/fixed cashier adjustments through the native tax allocator in both quote and commit, transactional audit and pre-order Flow events.
- Add read-only advice through the existing merchant chat and safely escaped 58/80 mm print layouts from issued immutable invoices. No physical printer, terminal, loyalty wallet or fiscal certification is claimed.
- Reject malformed scalar/array discount bodies with 400 before trusted-actor injection; preserve the authoritative cart and server process.
- Fix duplicate customer/discount controls after parking and resuming a cart; add a multi-cart regression and keep tender/completion visible while tools scroll.
- Fix stack exhaustion found in real MCP POS calls by bounding domain futures; preserve existing checkout replay fingerprints when the new optional fields are absent.
- Add isolated PostgreSQL/current-role/foreign-tenant, discount/commit/document/Flow tests, cashier UI regressions and one scoped extracted Lean guard.

## B2B creation and purchase acceptance — 12 October 2026

- Fix company and purchasing-unit reference generation: digit-led UUIDs no longer produce an ID rejected by the native organization API. One shared factory preserves the lowercase-first-letter, 32-character contract.
- Exercise both complete editor creation request paths with a digit-led UUID and the native identifier rule. All 447 frontend tests in 81 files pass.
- Forward the current tenant-scoped customer session on the final checkout command through the same shared identity helper as the Store API. This closes an actual browser-observed B2B purchase rejection without weakening server approval or identity checks. Guest/logout and foreign-tenant sessions have regressions.
- Request approval after native checkout review, refresh it without rewriting the cart and block purchase while approval is pending or the unit budget is exceeded. Changed totals/revisions invalidate review; direct form submission cannot bypass it. A complete local buyer/approver browser run saved RAC-f0646e6d (134.83 EUR), consumed the approval, allocated budget once and retained Bag 0 after reload.
- Publish an actual hosted company/unit capture after saving, reloading and reopening currency, budget, approval threshold, cost center and required purchase-order policy. This does not claim external EDI transport or a real payment.

## Modular B2B and independent EDI — 12 October 2026

- Add tenant-bound companies, unit hierarchy, current employee grants, private catalogs, exact-currency period budgets and original-quote purchase approvals.
- Add SKU quick order, owned/shared lists, RFQ negotiation, original-cart offers, unit order history and shared invoice/PDF access. Reuse native currency/tax, checkout, stock, payment, audit and outbox owners.
- Integrate Studio/account UI, content-language inheritance, private app references/surfaces, API/MCP and ten Flow events; extend the shared coding-agent schema and App Studio recipe picker.
- Keep EDIFACT/UBL/cXML codecs, partner mappings, native requisition import and immutable document export in an independent Rust app package. No second pricing, order or queue owner.
- Fix capability-dispatch stack exhaustion exposed by the POS/MCP regression; box new domain futures without increasing worker stack limits.
- Add native HTTP/PostgreSQL/tenant and app/gateway restart regressions, UI cases and two scoped Lean policies. Advanced B2B chains, partner-profile certification and network transports remain open, explicitly documented.

- Complete App Studio action/surface permission choices for B2B, POS and customer PII; test against the central native registry and preserve restrictive action allowlists.

## Native POS channel — 12 October 2026

- Add authenticated, cashier-bound POS channels and touch/scanner register UI, native variants, parked carts, currencies and coupons.
- Reuse atomic checkout, stock, orders, customer snapshots, shared payment-provider onboarding/jobs and immutable invoice/PDF owners. Cash tender/change use reviewed integer currency units; pending provider attempts remain pending until confirmed.
- Emit transactional POS events through existing Flow/app workers; expose private catalog/cart/receipt app surfaces to the same visual/coding-agent contract and POS tools to MCP.
- Recheck pause/location, role and cart ownership; deny public and generic-MCP bypasses. Add real PostgreSQL/provider regression cases and a scoped Lean cash policy.
- Document setup, architecture, ownership, permissions and limits. Offline sales, terminals, shift accounting and fiscal certification remain outside this release.

## App lifecycle, reference services and Experience admission — 12 October 2026

- Fix transient Studio login errors during loading while retaining conversation drafts.
- Filter selected-app versions, reconnect exact restored builds and allocate unused patch versions.
- Deduplicate validated native Save controls; support named order cases and confirmed status transitions. Hydrate standalone inputs before interaction and refresh the shared app registry with the workspace.
- Add generic app-owned workflow declarations with transactional immutable fields and current-package fencing.
- Share process/tenant/app network admission across actions, events, UI bundles and payment adapters; bound opaque guest bridge concurrency and stale completions.
- Complete the Returns lifecycle and an independent Rust ERP reference adapter with app-only forced-RLS receipts, signed intake, deduplication, cold restart and explicit uncertainty reconciliation.
- Project order callbacks from immutable integer currency/scale totals and native line items.
- Companion private Experience release normalizes reference URLs, validates all saved wizard steps before quota admission and returns structured localized errors with Retry-After. Public creation reached the original Storyfront Studio on 12 October; no new images or real charge were used.
- Refresh workshops, package deployment guides and trust boundaries. This does not establish whole-system proof, full coverage, every ERP integration or live payment-provider settlement.

## Illustrated app workshops — 12 October 2026

- Add five step-by-step tutorials: product advisor, private returns workspace,
  customer preferences, scheduled review flow and ERP handoff.
- Include twelve unretouched English browser captures, exact input values,
  coding-agent prompts, permission reviews, expected/denied cases and the shared
  private preview → immutable version → staging → selective release workflow.
- Keep examples linked to existing app-owned packages/assistants; no second
  runtime, service queue or core app implementation is introduced.
- Refresh README, feature/editor/reference guides, release inventories, homepage
  entry and machine-readable documentation links. Preserve dated evidence and
  explicitly distinguish native previews from live external integrations.

## 2026-10-12 — App-owned packages and readable designer

- Move editable returns/advisor/ERP patterns to ordinary plugin manifests.
- Keep Email/Google Analytics/Gmail/Slack business modules in their app folders;
  compile shared connector hosting only in its separate binary.
- Keep Storyfront bridge UI/styles/translations and GA storefront tracking in their
  app folders; include them in architecture, localization and coverage checks.
- Group the legacy PayPal adapter with its package; preserve existing payment and
  webhook behavior and explicitly retain its host-native compatibility boundary.
- Show passive translated table/form/control previews, semantic toolbox icons and
  distinct navigation icons, retaining selection, geometry and F4/F5 behavior.
- Document all-app ownership and prevent known source leakage in the CI structure gate.


## Connected workbench — 12 October 2026

- Standalone native inputs edit a unique form for the same model and record; ambiguous/unrelated bindings and protected references do not join. Typing remains local until the validated Save action runs.
- Native runtime raster rows grow to fit editor content instead of hiding short controls behind internal card scrolling; tables retain bounded scrolling.
- Native input controls reload persisted values on explicit refresh and clear stale record values; typing still makes no write.
- AI edits target the existing Manifest through bounded JSON Patch; host-assigned versions, atomic application, no-op rejection and unchanged schema/access guards replace whole-app regeneration. A real local Qwen task produced translated, order-bound controls; broader model quality remains unbenchmarked.

- Add editable Product advisor, Returns workspace and ERP handoff patterns to the existing visual App Studio.
- Preserve host-object filters when adding or rebinding visual data controls; missing context prevents unfiltered requests. The actual order-bound case save is browser-verified.
- Review model proposals and coding-agent imports before replacing the canvas; stale drafts/environment changes prevent acceptance.
- Expand native generation controls and the local app output ceiling; retain existing storage/access/service/event contracts.
- Route approved whole-catalogue translation proposals into the existing durable draft queue, with a direct review link and idempotent replay.
- Explain consent-bound personalization and prevent cross-shop/cart state or delayed-response reuse.
- Companion private changes checkpoint completed imports and protect payment referral replay/disconnect state.
- [Architecture, usage, tests and precise remaining boundaries](docs/connected-workbench.md). Local fixtures are not live-provider or hosted acceptance.

## Storyfront connection consent — 2026-10-09

- Fixed the Storyfront workspace's Add integration button: it now uses the same
  package-permission review as Apps rather than sending an unapproved installation
  that the core correctly rejected. Successful installation or activation refreshes
  the shared app-surface registry immediately.
- Installation errors remain in the review dialog for retry. Activation errors keep
  the existing control available. Installed connectors without a configured service
  explain the missing setup in English, German, French and Spanish instead of
  repeatedly offering installation. Managed Experience discovery stays unchanged.
- Added regressions for complete consent, cancellation, rejected installation,
  revision-based reactivation, read-only access and workspace switching.

## Checkout continuity — 2026-10-09

- Public mobile acceptance: RAC-faa7dde0 / 44.80 EUR, German saved product name,
  cancellation preserving the original Bag and confirmed Bag 0 after reload.
- Refresh public release documentation and actual embedded-checkout/Studio screenshots.
- Return native checkout close/Escape cancellation to its registered Experience parent;
  keep ordinary checkout local and preserve the cart on cancellation.

- Reuse the native checkout inside registered Storyfront shop domains.
- Save localized parent/variant product labels in immutable order snapshots.
- Send shopper-only completion receipts for server-verified original bag reconciliation.
- Add actual PostgreSQL origin/isolation and localized order regression checks.
- Companion private integration adds recognized-account sign out and localized original Studio overview states.
- Real payment redirect/3DS acceptance remains separate from simulated checkout tests.

## Original public Storyfront acceptance — 9 October 2026

- Replace the reduced hosted Experience editor with the original private Storyfront Studio, Cinematic renderer and workers on the existing Experience service. Keep private source and provider credentials out of public Veyndo.
- Record a fresh AI demo catalog with three generated product images, original review/build/Go live, persisted brand edits, a real German product-answer scene and a 390px responsive check.
- Verify original Bag → canonical checkout → saved simulated order RAC-4aed0976 (54.70 EUR). Return-to-shop uses canonical hosted navigation instead of retaining the standard SPA; local navigation remains unchanged.
- Document canonical Core ownership, mounted public API admission, one-use checkout handoff, source pins and actual browser screenshots. Preserve dated legacy observations and explicit upstream localization, provider and production-capacity limits.

## Native Experience checkout destination — 9 October 2026

- Keep one-use checkout transfers on the shared Core `/checkout` page through cart consumption, payment and receipt. Canonical shop redirects previously sent the transferred customer back into a mounted Storyfront instead of opening checkout.
- Preserve existing tenant/channel scope, ticket expiry, single-use consumption and cart-token rotation. Legacy transfer URLs remain supported; ordinary product URLs still upgrade to their shop subdomain.
- Exercise the actual HTML entry and PostgreSQL handoff in the existing integration suite, plus frontend redirect regressions. This routing repair does not implement or validate a live payment provider.

## Hosted public frontend API routing — 9 October 2026

- Delegate the reserved `/api/v1/...` public frontend namespace only on an operator-mounted shop hostname. Original hosted Storyfront commerce/session APIs previously returned an unregistered-Core-API 403 before reaching their renderer.
- Preserve central tenant/channel, paused-shop, private-preview and resource admission; registered Core routes and merchant credentials remain isolated. Real HTTP/PostgreSQL regressions exercise GET/POST bodies, query strings, forged scope, unmounted hosts, paused shops and read-only private previews.

## Native Storyfront release packaging — 9 October 2026

- Fix the production image build: historical app manifests used by the canonical upgrade/approval contract are now copied into the Rust build stage. They are existing reference inputs, not a restored Python runtime or a second app registry.
- Add a CI dependency-closure check for literal Rust compile-time includes, with a negative control reproducing the eight missing manifests from the failed public build.
- The older publicly deployed Core lacked the confirmed-claim intake/compile endpoints required by the private original Storyfront adapter. Update the tested Core through the existing backup/migration/release workflow before claiming native public integration.

## Connected intelligence, app ontology and acceptance — 9 October 2026

- Automatic tenant-bound embedding intake/model rebuilds, pooled Qdrant, lexical/dense fusion, optional reranking and self-hosted OpenAI-compatible serving. Forced-RLS lexeme projections narrow current candidates without bypassing source admission.
- Authorized agent read rounds, native SSE progress, shared AI admission, source-bound reviewed claims, signed public facts and saved fact-based categories. Product answers recheck all supplied sources; buyer advice rechecks channel-visible native facts and explicit preference consent after inference.
- Price guardrails/daily autonomy budgets, fixed-horizon layout experiments and opt-in document-event extraction reuse existing approval, Flow, outbox and knowledge owners. Broader autonomous writes, token streaming and continuous extraction remain open.
- Optional app-owned ontology maps share one visual/coding-agent manifest and current API/MCP/planner grants. Added the multilingual ontology-care example. No parallel app knowledge database.
- Private Experience pins this merged Core and consumes confirmed public claims through the original Storyfront compiler; original native worker/provider and free-prose binding gaps remain separate.
- Refresh README, release/testing/formal guides and public site; publish exact formal/coverage evidence and a detailed acceptance record. Correct stale core-RLS and module/suite-count descriptions.
- Fix merchant-registration slug validation for modern browsers; add valid/invalid slug regression coverage. Repeat the full original Storyfront suite and actual product history/app publish journeys.
- Fix the real mail/Flow regression fixture to honor the existing native PostgreSQL selector instead of hard-coding Docker; the same fixture retains Docker CI support.

[Detailed changes, tests and limitations](docs/release-acceptance-2026-10-09.md). Historical recordings and performance measurements keep their original source/date.

## Request hotpath and delivery — 8 October 2026

- Reuse one fresh server-owned domain/tenant/staging/status/channel snapshot per request, with current personal credentials and immutable hosted mount binding. No status or permission TTL cache.
- Remove native public-asset identity SQL; ship deterministic gzip/Brotli build variants and secret-free API compression with correct negotiation, ranges and stream exclusions. Hosted/private assets retain admission.
- Borrow decoded settings through immutable Arc handles; batch inventory deduction/allocation/release using persisted quantities and sorted locks.
- Consolidate dashboard facts and bound parallel reads to three branches. Historical currency separation and cancellation idempotence retain their contracts.
- Publish a matched 9,000-request local comparison with zero errors, raw samples and unchanged business fingerprints; no universal speedup or production-capacity claim. See [the measurement and scope](docs/read-performance.md).
- Add two Lean properties for native-asset admission and explicit review locks for embedded SQL/build inputs. SQL, providers and browser behavior remain unproved.

## Rust standard services — 7 October 2026

- Ported bundled Email Delivery, GA4, Gmail, Slack and OAuth/export state to an independent Rust service; existing app, Flow Builder and MCP contracts are preserved.
- Replaced local SQLite with encrypted tenant/app-bound PostgreSQL records, forced RLS, distributed lease-fenced claims and per-tenant/app quotas. Ambiguous external delivery is never automatically resent.
- Added compiler-typed mail configuration, verified SMTP STARTTLS/TLS and Resend/SendGrid delivery, atomic offline migration, actual multi-process/provider regressions and the extracted Lean retry predicate.
- Archived the previous Python implementation as a migration comparison oracle. Python remains in development tools and independent app examples, outside the first-party central runtime. See [the architecture and language audit](docs/rust-services.md).

## Veyndo identity — October 2026

- Renamed the public repository, Rust crate/binary, frontend package, Docker images, MCP identity and documentation to Veyndo.
- Added the original Veyndo V/dune vector mark, light/dark wordmarks, shared Studio/operator branding and favicons.
- Preserve existing shop identities, browser sessions and database volumes; fresh installations use Veyndo names.
- Recaptured current English README views and added a public-brand consistency check.

## Unified content translation editors

- One shared content-language picker and one field per value across product/SEO,
  attachment, category, tax, method, rule/campaign/channel and graphical flow editing.
- Main-language inheritance for simple and graphical flow instructions and file
  titles, dynamic enabled content locales and localized storefront file labels.
- CI rejects new stacked language fields; regression checks cover preservation,
  explicit blanks, Spanish inheritance, Italian and regional variants.
## 0.5.0 — prototype release

This release packages the current experimental commerce slice. It is not a
production-readiness or complete Shopware-compatibility claim.

- Modular Rust commerce core and multilingual storefront/Veyndo Studio.
- Personal users, independent workspaces, invitations and merchant roles.
- SKU variants, quantity prices, review moderation and configurable demo checkout.
- Durable PostgreSQL storage with Apache AGE and pgvector.
- Merchant-approved proposals, local inference and optional cloud adapters.
- Partial MCP/UCP bindings and bounded Wasm B2B purchase policies.
- Original Shopware pricing/context/tax comparisons and first-start policy fix.
- Versioned app examples, shop intelligence, separate worker roles and a PayPal Sandbox adapter.
- Sandbox verification uses local contract fixtures; live Sandbox traffic is unverified.
- Clear commerce-first quickstart, searchable guides and contributor information.

Payments are simulated, manual or Sandbox; no real money is charged. See [the feature matrix](docs/shopware-parity.md),
[verification record](docs/verification.json) and current CI for exact scope.
