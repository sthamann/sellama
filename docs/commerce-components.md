# AI Commerce Components: implementation plan

For the developer entry point and the relationship between the product and the
individual components, see [One shop, composable parts](one-shop-components.md).

This is the authoritative task list for extracting independently usable Veyndo
components. Updated 8 November 2026. Checked tasks name observed evidence;
repository transfer, local tests, remote CI and hosted acceptance are separate.
The full component extraction is in progress, not released.

## Current implementation priority

Work now proceeds across complete service paths: shared service/UI composition,
independent checkout, knowledge ingestion/retrieval and automation. App runtime
improvements continue where they unblock those paths; they no longer define the
whole extraction sequence. Each slice must run independently and remain connected
to native Veyndo through the same owner.

- [x] UI-01a Shared SDK layout registry and separately scoped service read bindings;
  actual native OpenUI workspace consumes the same admission boundary. SDK 0.3.0,
  [contract](agentic-component-ui.md#shared-sdk-composition) and
  [evidence](evidence/service-workspace-composition-2026-11-06.md).
- [ ] AUTO-01a Extract and compose the existing deterministic rule evaluator as an
  independent Rust library and supplied-fact HTTP/MCP service. Local implementation
  is being validated; a private repository is not public product acceptance.
- [ ] CHK-01..03 Independent checkout domain ports and own session orchestration.
  - [x] Local embedded recovery after a lost browser notification. A status
    read completes while the cart is locked. An explicit reopen and purchase
    share the lock and preserve one cart and order. The browser fixture covers
    capture and cancellation with simulated payment responses.
    [Recovery contract](storyfront.md#responsibilities-and-contracts).
  - [ ] Accept the released Core and original Storyfront builds together with
    a configured Sandbox payment, return, empty bag and refund.
- [ ] KNOW-01..05 Independent knowledge ingest/retrieval and source lifecycle.
- [ ] UI-07 Compose actual domain views from those released service owners.

## Latest completed extraction, 6 November 2026

Apps 0.29.0 / Data service 0.5.0 supplies bounded job history/detail and approved
cancel/retry/resolve/archive through HTTP, MCP and the unchanged SDK, without Core.
Native Veyndo uses the same current-package/current-rights result redaction and
queued-event selector. The explicit schema-5 nonowner profile cannot enqueue or
forge worker input/results. Personal live authority, exact approval, original
leases/CAS and atomic events remain enforced. Actual worker execution, producer
provisioning and callback evidence retain their separate owners.
[Setup and SDK](app-job-supervision-service.md),
[acceptance](evidence/app-job-supervision-component-2026-11-06.md).

Portable package installation, settings and records remain independently usable.
Independent producer/worker hosting, native-resource ports, restore and release
orchestration remain open under APP-02..05.

## Required result

Each component has its own repository in the `veyndo` GitHub organization. The
`veyndo/veyndo` repository remains the complete product, composition, release lock,
end-to-end acceptance and documentation entry point. Veyndo consumes the same
versioned interfaces available to external developers. Private implementations
remain private; their source and archives must never enter public split histories.

Every independently operated service must expose its own documented HTTP API and
MCP endpoint using the same domain operations and authorization. JavaScript and
TypeScript examples must work without starting the entire Veyndo platform.
Pure libraries and UI packages also need usable SDK entry points; their optional
service adapters must reuse their implementation rather than duplicate rules.

## Organization and repository migration

- [x] ORG-01 Inventory original Veyndo repositories and current visibility: Core
  public, Experience private, Shopware Payments private.
- [x] ORG-02 Create `veyndo` with Stefan as owner and default member repository
  permission `none`. Organization creation and Terms approval were authorized.
- [x] ORG-03 Transfer Core to `veyndo/veyndo`; retain repository ID 1399879634,
  main SHA 0843dc9570974a0b48b2ca6e3226a9c0d709cf72 and protected main.
- [x] ORG-04 Transfer Experience to `veyndo/experience`, still private, ID
  1403217894; transfer Payments to `veyndo/shopware-payments`, still private,
  ID 1406902755. Original main SHAs retained.
- [x] ORG-05 Redeploy the existing public Pages artifact in its new organization;
  GitHub Actions run 42022516564 succeeded. This alone does not repair upstream
  references in the running website proxy.
- [ ] ORG-06 Update website proxy, media origins, CSP and canonical documentation
  links; verify public homepage, handbook, screenshots, videos and old links.
  - [x] ORG-06a Deploy the organization-aware website/docs proxy and media CSP.
    Verify the public homepage/Team/start/Experience entries, current handbook,
    its actual logo/CSS/JS assets and video byte ranges without upstream cookies.
    [Live evidence](evidence/component-hosting-2026-11-05.md).
  - [ ] ORG-06b Complete the historical alias/link and full media compatibility audit.
- [ ] ORG-07 Reconnect hosting source integrations to new repository ownership;
  preserve running versions, private submodule pins, deploy keys and rollbacks.
  - [x] GitHub app installation linked to Northflank for exactly `veyndo/veyndo`,
    `veyndo/experience` and `veyndo/shopware-payments`, with the explicitly approved
    organization rights. SDK, Apps and Marketplace repositories are not granted.
  - [x] Remap existing Core build, Experience and Payments build sources to the
    transferred repositories. Existing CI/CD settings and running deployment
    versions are retained; the Payments service starts its normal enabled build.
    Source mapping is not acceptance of a new runtime deployment.
  - [ ] Complete source/build/runtime acceptance and remaining deployment links.
- [ ] ORG-08 Verify repository permissions, rules, Actions settings, webhooks and
  secret/deploy-key availability without exporting secret values.
- [ ] ORG-09 Give each extracted repository its source history/provenance,
  license/notices, maintainers, security policy, CI and component README.
- [ ] ORG-10 Update clone commands, package/image provenance, badges and generated
  links. Migrate image namespaces only after pull access and deployment are tested.
- [x] ORG-11 Verify old Git repository redirects; never recreate old repository
  names in a way that destroys those redirects.

## Repository ownership map

These are target names. A listed repository is not evidence that extraction is done.

| Repository | Owner and deliverables |
| --- | --- |
| `veyndo/veyndo` | Complete product, composition, pinned release set, E2E and docs |
| `veyndo/commerce` | Transactional commerce domains and native API/MCP adapters |
| `veyndo/checkout` | Independent checkout sessions/orchestration, own HTTP/MCP/SDK and embedded UI |
| `veyndo/policies` | Pure money, pricing, discounts and verified rule kernel |
| `veyndo/knowledge` | Knowledge ingestion, graph, retrieval and evidence |
| `veyndo/catalog-ai` | Reviewed import, translation, enrichment and media jobs |
| `veyndo/agents` | Durable planning, tools, approval, budgets and authority |
| `veyndo/simulator` | Isolated shopper scenarios, replay and comparison |
| `veyndo/apps` | Manifest, Wasm runtime, app data, settings and releases |
| `veyndo/canvas` | Page schema, renderer, shop/app editor and agent integration |
| `veyndo/automation` | Shared rules, events, flows and durable execution |
| `veyndo/connectors` | Generic service host and package-owned provider adapters |
| `veyndo/migration` | Independent Rust source adapters and migration orchestration |
| `veyndo/marketplaces` | Provider mapping, listing sync and external order intake |
| `veyndo/edi` | EDI codecs, mappings and native business-document adapters |
| `veyndo/pos` | Register channel, cashier UI, device and native commerce adapters |
| `veyndo/b2b` | Companies, purchasing policy, approvals and negotiation adapters |
| `veyndo/shipping` | Provider-neutral shipping contracts and package-owned adapters |
| `veyndo/reports` | Metric definitions, projections, reports and embedded cards |
| `veyndo/sdk` | JavaScript/TypeScript transport, generated contracts and examples |
| `veyndo/payments` | Generic payment orchestration and provider contracts |
| `veyndo/shopware-payments` | Existing private provider implementation |
| `veyndo/experience` | Existing private Storyfront integration and presentation |

## Mandatory acceptance for every service

Each component task remains open until these checks are demonstrated for it.

- [ ] ACCEPT-01 Start its released image with its own configuration, storage and
  credentials, without a Core process or access to Core tables.
- [ ] ACCEPT-02 HTTP, MCP and SDK execute the same authorized domain operations;
  validate request/response schemas, error codes and supported contract versions.
- [ ] ACCEPT-03 Enforce current actor/tenant/environment authority; test foreign
  tenant reads, mutations, private records, revoked grants and spoofed headers.
- [ ] ACCEPT-04 Preserve language inheritance, a non-English main language, a fifth
  enabled content language, channel scope and exact currency minor units.
- [ ] ACCEPT-05 Exercise revision conflicts, duplicate requests, restart, timeout,
  expired worker lease, ambiguous external effects and bounded resource admission.
- [ ] ACCEPT-06 Test draft, private preview, review, selective publication, current
  rights and rollback; never publish operational orders, stock or credentials.
- [ ] ACCEPT-07 Supply a working Node example and browser-safe example where
  appropriate; privileged tokens must never be embedded in browser bundles.
- [ ] ACCEPT-08 Run automated unit, contract and real-storage integration tests;
  test component images independently and in the pinned complete product.
- [ ] ACCEPT-09 Publish API/MCP reference, setup, troubleshooting and an honest
  compatibility matrix. Record local, CI and hosted evidence separately.
- [ ] ACCEPT-10 Verify backup/restore, schema migration and rolling compatibility
  before switching the complete product to a new storage owner.

## FOUNDATION: contracts, SDK and composition

- [x] FND-01 Publish the existing generated operation contracts and typed clients
  through `veyndo/sdk`; retain one canonical operation registry per owner.
- [x] FND-02 Provide a dependency-light JS client for existing HTTP/MCP operations,
  explicit endpoint configuration, scoped auth, cancellation and structured errors.
- [x] FND-03 Test protocol/HTTP/domain failures, wrong response IDs, redirects,
  cancellation and ambiguous writes; never retry mutations automatically.
- [ ] FND-04 Supply executable Node and browser examples and a minimal external
  host with no Veyndo implementation dependency.
- [ ] FND-05 Complete typed response contracts, pagination and compatibility tests;
  current generated native contracts cover inputs, not all domain responses.
- [ ] FND-06 Define authenticated service grants, identity adapters, short-lived
  delegated scopes, resource budgets and secret ownership across repositories.
- [ ] FND-07 Define event ID, source revision, causation, trace context and replay;
  reuse existing outbox/subscriber checkpoints and uncertainty handling.
- [ ] FND-08 Add a composition lock with exact repository commits/image digests,
  API compatibility and migrations. No unpinned branch deployment dependencies.
- [ ] FND-09 Build component CI and complete-product CI; short affected checks per
  change and daily full coverage retain the existing verification cadence.
- [ ] FND-10 Generate a public component catalog and detailed docs from actual
  releases; planned repositories must not be advertised as available services.

## CORE: modular transactional commerce

- [ ] CORE-01 Map current catalog, customer, cart, pricing, inventory, order,
  payment, fulfillment and settings consumers before changing ownership.
- [ ] CORE-02 Replace broad App dependencies with explicit domain ports/context;
  enforce one-way crate dependencies and prohibit importing the product shell.
- [ ] CORE-03 Extract catalog/category/variant/media contracts and domain module.
- [ ] CORE-04 Extract customer/account/address contracts with immutable order
  ownership and PII field admission preserved.
- [ ] CORE-05 Extract cart and checkout orchestration through the explicit
  [independent Checkout tasks](#checkout-independent-service-and-ui); preserve CAS, legal receipt,
  stock locks, idempotency and one order/stock/outbox transaction.
- [ ] CORE-06 Extract inventory/reservation/allocation ports; test concurrent
  purchases, cancellation and content edits without overwriting fresh stock.
- [ ] CORE-07 Extract order, fulfillment, documents and refund contracts; keep
  money snapshots and provider receipt verification authoritative.
- [ ] CORE-08 Isolate configuration, countries, currencies, taxes, promotions and
  language resolution behind shared domain contracts, never protocol calculators.
- [ ] CORE-09 Extract `veyndo/commerce` with Core-independent Rust build, storage
  migrations, HTTP/MCP and SDK use; product shell consumes the released package.
- [ ] CORE-10 Verify the complete direct and embedded Storyfront purchase, return,
  empty carts, order/document visibility and simulated/provider refund paths.

Transactional ownership can stay in one commerce service while its Rust domains
become independent modules. Separate APIs must not split an atomic stock/order
commit into unsafe network calls. Further independently deployed inventory/order
owners require an explicit reservation/compensation design and corresponding tests.

## CHECKOUT: independent service and UI

Checkout is an explicit independent service, target repository `veyndo/checkout`.
[Ownership, commit boundary and acceptance](checkout-component.md).

- [x] CHK-00 Record standalone service/API/MCP/UI requirement and preserve one
  authoritative order/stock/outbox commit owner in the extraction design.
- [ ] CHK-01 Trace current native/Storyfront cart, quote, legal, payment, purchase,
  return and refund paths; identify shared session/token/receipt compatibility.
- [ ] CHK-02 Define typed catalog/pricing/stock/customer/company/delivery/order/
  Payments ports and actual reservation/CommitOrder/recovery semantics.
- [ ] CHK-03 Extract Rust checkout orchestration/session storage to its own repo;
  no Core-process dependency, private Core SQL access or second financial ledger.
- [ ] CHK-04 Publish own versioned HTTP/MCP interfaces and JS/TS SDK, preserving
  current authorization, CAS, idempotency, package hooks, language/country/channel.
- [ ] CHK-05 Publish one standalone/embedded checkout UI with provider method,
  hosted-field/wallet/redirect support through the same admitted APIs.
- [ ] CHK-06 Integrate contextual agent/validated UI generation while preserving
  deterministic checkout and actual customer purchase/saved-method consent.
- [x] CHK-07 Supply standalone external frontend and real reference commerce /
  PostgreSQL adapter without the Veyndo product process; prove concurrent commit.
  - [x] CHK-07a Run a separate Rust reference commerce host and Checkout against
    two PostgreSQL databases. Verify concurrent purchase, original receipt
    after response loss and restart, HTTP, MCP and the JavaScript SDK.
    [Reference purchase](checkout-component.md#a-purchase-with-a-separate-commerce-host).
  - [x] CHK-07b Run a browser purchase through the external reference storefront,
    the JavaScript SDK and the separate commerce host. Confirm one order, an
    empty cart on return and the same receipt after a lost response, reload
    and restart. [Browser example](checkout-component.md#external-reference-storefront).
- [ ] CHK-08 Compose native Veyndo and original Storyfront; accept full purchase,
  verified return, empty originating cart, callback replay and refund integration.
  [Hosted release checklist](storyfront.md#accept-a-hosted-release).
- [ ] CHK-09 Accept foreign/revoked/private/paused/stale/B2B/stock/provider failures,
  restart/uncertainty recovery and existing Flow/document/outbox behavior.
- [ ] CHK-10 Cut over existing routes/sessions/attempts through versioned adapters,
  document rollback and publish independent SDK/UI examples and product evidence.

## Cross-component agentic UI

[Source observations, architecture, coverage matrix and protocol adapters](agentic-component-ui.md).
The following are implementation tasks; existing UI foundations do not complete them.

- [x] UI-00 Check operation registry, tool contracts, shared Surface/NativeView/AST
  and browser SDK. Record missing output semantics, cross-service host navigation
  and common generation/composition contract; cover every component in the matrix.
- [ ] UI-01 Extend existing operation/App definitions with typed outputs, resources,
  precise effect/review/preview/replay semantics and compatible UI references;
  generate SDK/OpenAPI/MCP contracts without duplicate operation/rights lists.
- [ ] UI-02 Define typed UiHost context/API/theme/locale/navigation/picker/result/
  cancellation/return ports and required/optional service dependency negotiation.
- [ ] UI-03 Extract the actual renderer/design tokens and versioned UI packages;
  standalone shell, trusted native/React and Web Component embedding share exports.
- [ ] UI-04 Keep external code isolated with current CSP/frame grants; agent UI
  uses validated registered controls/bindings and current server admission only.
- [ ] UI-05 Let agents propose/save/revise contextual multi-component workspaces
  through the same definitions as manual editing, with durable runs and review.
- [ ] UI-06 Add version-negotiated OpenUI, A2UI and MCP Apps adapters to that same
  definition/runtime; declare supported subsets and structured/text fallback.
- [ ] UI-07 Prove one actual standalone/embedded/agent-host vertical slice, then
  cover each component's required UI exports and agent operations from the matrix.
- [ ] UI-08 Test permissions/PII/current context, missing capabilities, versions,
  unsaved work, cancellation/return, hostile output, responsive/accessibility and
  actual business effects in both standalone host and complete Veyndo.
- [ ] UI-09 Enforce frontend package boundaries and pin compatible API/UI/schema
  revisions; retain sandbox/review/selective publication and restoration paths.

## KNOWLEDGE: first complete standalone AI component

- [ ] KNOW-01 Define source/product/document/variant/reference DTOs with language,
  provenance, revision, withdrawal and deletion semantics.
- [ ] KNOW-02 Move indexing/retrieval algorithms behind source/storage/model ports;
  remove direct dependence on native products and the Core App context.
- [ ] KNOW-03 Implement the Veyndo source adapter through current owners/events.
- [ ] KNOW-04 Give the independent service its own rebuildable projections,
  ingestion checkpoints, vector configuration and migration/restore procedures.
- [ ] KNOW-05 Expose ingest/search/graph/source/withdraw/delete over HTTP and MCP;
  preserve private-source admission, current evidence and tenant isolation.
- [ ] KNOW-06 Provide SDK examples using an external catalog and documents.
- [ ] KNOW-07 Prove update/delete/reindex/restart/model-version handling without
  paid provider calls; keep real-provider acceptance separate.
- [ ] KNOW-08 Switch Veyndo to the same released service and pass existing
  knowledge, merchant advice, app discovery and source-withdrawal regressions.

## CATALOG: import and content AI

- [ ] CAT-01 Extract shared CSV/URL/demo/translation/media request and result DTOs.
- [ ] CAT-02 Reuse bounded source fetching, validation and central model ports;
  preserve SSRF, upload limits and prompt-injection boundaries.
- [ ] CAT-03 Persist resumable jobs and reviewed proposals in the component owner;
  add revisions, provenance and safe ambiguous paid-job recovery.
- [ ] CAT-04 Apply through target adapters with current rights and CAS; preserve
  operational prices/taxes/stock separately from observed or generated content.
- [ ] CAT-05 Expose HTTP/MCP and Node/browser examples; test CSV, URLs, images,
  translation inheritance, duplicates, interruption and publication in Veyndo.

## AGENTS and SIMULATOR

- [ ] AGT-01 Extract current durable run/checkpoint/proposal contracts and storage
  ports without introducing a competing planner or approval queue.
- [ ] AGT-02 Add host tool adapters using the same typed operations as HTTP/MCP;
  preserve current-rights checks, revision checks and explicit human apply.
- [ ] AGT-03 Preserve per-agent identity, model/token/spend budgets, revocation,
  emergency stop, lease fencing and deliberate uncertain-call continuation.
- [ ] AGT-04 Separate inference configuration/budget stores from Core SQL types.
- [ ] AGT-05 Test external host, process kill/resume, denied tools, changed sources,
  stale approval and repeated request IDs through API/MCP/SDK.
- [ ] SIM-01 Extract snapshot/profile/journey/evidence contracts and run storage.
- [ ] SIM-02 Implement Veyndo and independent example-host catalog/checkout
  adapters; retain simulation-only payment and private environment checks.
- [ ] SIM-03 Test deterministic fixtures, bounded agent concurrency, cancellation,
  comparison freshness and replay without live orders/provider effects.
- [ ] SIM-04 Embed the released simulator in Veyndo; label simulated findings
  separately from observed traffic and measured conversion impact.

## APPS and CANVAS

- [x] APP-01 Split manifest/schema validation and Wasm execution into distributable
  packages preserving resource limits and reviewed component digests. Apps 0.16.0
  supplies the complete ordered model 0.12.0 compiler; runtime 0.2.0 supplies the
  existing bounded executor. Native Core consumes exact pinned source with required
  host policies. [Compiler acceptance](evidence/app-complete-compiler-component-2026-11-06.md). The runtime network host is APP-01a below; full app-data identity/service
  hosting remains APP-02..05/MKT-03b/c work.
  - [x] APP-01a Independent Rust runtime service with fresh current OAuth admission,
    one typed HTTP/OpenAPI/MCP operation, existing Fetch/SDK examples, bounded
    disconnect-safe execution, Rust-only non-root image and actual process tests.
    [Runtime service acceptance](evidence/app-runtime-service-component-2026-11-06.md).
- [ ] APP-02 Extract app data/settings/jobs/version contracts and fixed shared
  storage; never create per-app/per-model/per-tenant tables or indexes.
  - [x] Scoped record/query/package/install and enqueue/claim/progress storage,
    plus Apps 0.17.0 bounded job history/detail and merchant cancel/retry/resolve/
    archive transaction. Required current-action/right/input retry admission and
    native response redaction remain attached. [Job workflow evidence](evidence/app-job-workflows-component-2026-11-06.md).
  - [x] Apps 0.18.0 encrypted configuration metadata/internal resolution/rotation,
    required host seal/open port, original binding and lock/CAS/package/outbox
    sequence; native administrator/consent/declared-kind/sandbox/projection checks
    retain their owners. [Encrypted configuration evidence](evidence/app-encrypted-configuration-component-2026-11-06.md).
  - [x] Apps 0.19.0 immutable Studio snapshots/digests, bounded history,
    recoverable archive/restore and row-fenced private staging through required
    native environment/compiler/current-actor/actual-installer admission.
    [Studio version evidence](evidence/app-studio-versions-component-2026-11-06.md).
  - [x] Apps 0.20.0 actor-private mutable Studio drafts, original typed wire and
    byte budget, actor/quota/CAS fence, scoped deletion and mandatory current
    environment admission; native identity/rights and transaction ownership remain.
    [Private draft evidence](evidence/app-private-drafts-component-2026-11-06.md).
  - [x] Apps 0.21.0 immutable app-record snapshots, retained historical read
    rights, bounded history and restoration through a required normal managed
    writer on the same transaction. Original 20-revision/16 MiB retention and
    native current entity/field/approval/CAS authority remain attached.
    [Record history evidence](evidence/app-record-history-component-2026-11-06.md).
  - [x] Apps 0.22.0 package activation/deactivation sequence, original tenant/app
    fences, active-dependant check and revision CAS with mandatory native config,
    current actor/trust/commerce/lifecycle and connected-frontend admission.
    [Activation evidence](evidence/app-activation-component-2026-11-06.md).
  - [x] Apps 0.23.0 original explicit schema conversion and bounded recovery
    capture on the existing installer transaction, mandatory native field/language
    validation, declared historical values and checked record revisions.
    [Schema recovery evidence](evidence/app-schema-recovery-component-2026-11-06.md).
  - [x] APP-02a Independent read-only App Data service with versioned fixed reader
    schema, real restricted login, current OAuth merchant/action rights, shared
    signed RLS protocol and HTTP/OpenAPI/MCP/SDK acceptance. Native page and field
    projection consume the same code. No install/write or resolver bypass.
    [Reader acceptance](evidence/app-data-reader-component-2026-11-06.md).
  - [x] APP-02b Opt-in managed portable record writes and retained history through
    HTTP/OpenAPI/MCP/SDK, supported schema-2 permission upgrade, current authority,
    explicit approval/package/revision fences, original state/history hooks and
    atomic outbox. Default read-only mode remains separate. Native resource
    policies have no fallback. [Acceptance](evidence/app-data-managed-writes-component-2026-11-06.md).
  - [x] APP-02c Explicit encrypted settings profile through HTTP/OpenAPI/MCP/SDK,
    fresh personal live administrator authority, shared partial-update/CAS/projection
    and original vault envelope. [Setup](app-settings-service.md),
    [independent and assembled acceptance](evidence/app-settings-service-component-2026-11-06.md).
  - [x] APP-02d Explicit portable package review/install through HTTP/OpenAPI/MCP/SDK,
    complete shared compiler, original installer/model sequence, immutable versions,
    exact approval and current personal/live authority, fixed schema-4 grants and
    original row/byte budgets. [Setup](app-package-installation-service.md),
    [independent and assembled acceptance](evidence/app-package-installer-component-2026-11-06.md).
  - [x] APP-02e Independent job supervision through HTTP/OpenAPI/MCP/SDK: bounded
    scoped history/detail, current-rights result redaction, approved cancel/retry/
    resolve/archive, original CAS/leases/atomic events and explicit fixed schema-5
    control-only grants. [Guide](app-job-supervision-service.md),
    [acceptance](evidence/app-job-supervision-component-2026-11-06.md).
  - [ ] Complete independent producer/worker/callback hosting and remaining native-policy lifecycle
    orchestration and independent full host operation.
- [ ] APP-03 Implement native entity resolver ports and safe external references;
  account for guarantees currently enforced by local composite foreign keys.
- [ ] APP-04 Preserve encrypted settings, installation consent, rights, events,
  schedules, MCP exposure and one revisioned definition across entry points.
- [ ] APP-05 Exercise create/configure/private test/release/update/rollback in
  standalone host and full Veyndo, including malicious Wasm and denied data.
- [ ] CAN-01 Extract versioned page/element/slot schemas and the actual renderer.
- [ ] CAN-02 Extract editor with content, asset, preview, agent and publication
  adapters; remove Studio/private product-editor implementation imports.
- [ ] CAN-03 Preserve graphical blocks, drag/drop, inline actions, responsive
  preview, undo and shared shop/app definitions.
- [ ] CAN-04 Connect manual, agent and coding-agent changes to identical reviewed
  revisions; reference URL/image output remains validated structured content.
- [ ] CAN-05 Supply independent embedding example, own server API/MCP for content
  operations and full browser coverage of Veyndo shop/app editing and release.

## AUTOMATION and CONNECTORS

- [ ] AUTO-01 Extract rule/flow/event contracts and reusable pure evaluation.
  - [x] AUTO-01r Independent deterministic rule library and real Rust HTTP/MCP
    supplied-fact service, current shared OAuth admission, SDK composition and
    standalone process acceptance. Source is initially private; native integration
    and public visibility remain under explicit acceptance.
    [Guide](automation-component.md), [evidence](evidence/automation-component-2026-11-06.md).
- [ ] AUTO-02 Extract durable flow execution ports; retain current actor, app
  activation, settings, lifecycle locks and delayed-step reauthorization.
- [ ] AUTO-03 Expose independent API/MCP and graphical/SDK authoring through one
  definition; test branches, delays, retries, revocation and publication.
- [ ] CON-01 Move connector host and app-owned adapters to `veyndo/connectors`
  with source history and independently buildable Rust images.
- [ ] CON-02 Replace Core tenant foreign-key provisioning with an authenticated
  namespace/identity contract while retaining forced service-owned isolation.
- [ ] CON-03 Preserve encrypted settings, OAuth states, idempotency, quotas,
  leased workers and uncertainty; no automatic resend after ambiguous delivery.
- [ ] CON-04 Add standalone API/MCP/SDK examples and real fixture integration;
  rerun native checkout -> outbox -> flow -> connector -> delivery acceptance.

## MARKETPLACES and other additional channels

- [x] MKT-01 Move `extensions/apps/marketplaces` source/providers/UI/tests into
  `veyndo/marketplaces`, preserving package ownership and provenance. Extracted
  Git history, standalone Cargo package/container, shared HTTP/MCP actions and
  SDK fixture pass. Initial extraction used `edc49f56`; the current checked
  source snapshot is recorded in `components.lock.json`. [Extraction evidence](evidence/marketplace-component-2026-11-05.md).
- [x] MKT-02 Extract the generic host exchange/order-intake contract into the SDK;
  expose own mapping/listing/sync/review/order API and MCP tools. SDK 0.2.0 exports
  generated host DTOs and the versioned server client. Marketplace HTTP/MCP now
  support declared record actions and native idempotent sync; independent and
  connected fixtures pass. [Host contract evidence](evidence/marketplace-host-2026-11-05.md).
- [ ] MKT-03 Replace dependence on native app records/jobs with host interfaces and
  an independent supported implementation; no copied native order ledger.
  - [x] MKT-03a Extract native record/job persistence to `veyndo/apps`, consume the
    exact same Rust package in Core and verify independent PostgreSQL plus the
    native storage/jobs/tenant and marketplace fixtures.
    [Storage evidence](evidence/app-storage-component-2026-11-05.md).
  - [ ] MKT-03b Extract the validated host operations and identity adapter, with a
    supported production schema, current permissions, API/MCP and SDK examples.
    The first supported reader schema and authenticated read operation are delivered
    in APP-02a; full installer/write/settings/jobs hosting and native resolver ports
    remain open. [Reader service](app-data-service.md).
    Shared record CAS/replay/write/outbox and bounded page/filter/publication
    queries are extracted and consumed by Core. Apps 0.3.0 also supplies the pure
    model declaration/field/schema/language/workflow compiler, with required host
    policy ports. Apps 0.4.0 adds current-authority action/callback rules and the
    scoped active-package fence. Apps 0.5.0 supplies the original atomic installer
    through required compiler/commerce/migration/model/default/schedule hooks.
    Apps 0.6.0 adds the common package compiler with required native scope,
    reference/Wasm-kind policies and ordered full-domain extension validators.
    Apps 0.7.0 shares settings declaration/value/projection and schema evolution
    planning/conversion, including operational/core-binding compatibility.
    Apps 0.8.0 shares event subscription/privacy/filter/delivery contracts and
    UTC schedule/private webhook declarations with mandatory destination policy.
    Apps 0.9.0 shares object-binding declarations, strict AI metadata and current-row
    graph mapping/projection with native object rights and scoped lists retained.
    Apps 0.10.0 shares placement/named HTTP route DTOs and grammar through required
    native-view, known-scope and read-only effect policies.
    Apps 0.11.0 shares strict native views/controls, geometry, editor bindings and
    bounded typed UI behavior with required native field/public-read policies.
    Apps 0.12.0 adds the actual independent Wasm/WIT executor with required native
    resource admission, explicit namespace configuration and preserved call budgets.
    Apps 0.13.0 shares configuration/library/argument and typed-hook contracts,
    frozen business snapshots/expected decisions, WIT projection and actual example
    evaluation. Native currency/value/reference/source policies remain attached.
    Apps 0.14.0 shares exact native lifecycle graph/snapshot contracts and bounded
    compilation, locale/fact narrowing and accepted-label projection. Native current
    permissions, order base/domain checks, locks and verified final effects remain attached.
    Apps 0.15.0 shares the complete strict Manifest wire, common projection,
    canonical fingerprint/signing message, passive artwork/payment declarations
    and publisher/dependency graph grammar with mandatory native signature trust.
    Apps 0.16.0 shares the complete ordered standard compiler. Required native
    policies retain their original owners and errors; no standard domain stage is
    supplied as an optional before/after host callback.
    Apps 0.24.0 additionally supplies standalone runtime HTTP/OpenAPI/MCP with
    current external OAuth access and existing SDK usage. It evaluates supplied
    examples only; full data/installation identity/schema/API hosting remains open.
    [Runtime service acceptance](evidence/app-runtime-service-component-2026-11-06.md).
    - [x] Shared record CAS/write/query operations with host history/lifecycle hooks.
    - [x] Independent model compiler and required current-authority ports.
    - [x] Atomic installation, immutable versions, quota and original package locks;
      integrated preview/staging/upgrade consumers use the same component.
    - [x] Common package metadata/model/action/slot/event compiler; required native
      extension checks and policy owners remain in their original order.
      [Compiler evidence](evidence/app-package-compiler-2026-11-05.md).
    - [x] Strict settings declarations/partial updates/secret-safe projections and
      explicit schema evolution planning/conversion, reused by native settings and
      upgrade review/install consumers.
      [Settings and evolution evidence](evidence/app-evolution-settings-2026-11-05.md).
    - [x] Event subscription and minimized payload rules, projected filters,
      bounded delivery contracts, UTC cron and private webhook declarations;
      actual native dispatch/signatures/queues/current authority remain attached.
      [Event contract evidence](evidence/app-event-contracts-2026-11-05.md).
    - [x] Product/customer/order/company extension declarations, AI tool/entity
      metadata and bounded namespaced graph projections from admitted current rows;
      native object authority and verified configuration release remain attached.
      [Object and graph evidence](evidence/app-object-graph-contracts-2026-11-05.md).
    - [x] Surface and named HTTP route wire types/grammar with mandatory host view,
      team-scope and read-only policies; native grants/pinned UI/dispatch remain attached.
      [Surface and route evidence](evidence/app-surface-contracts-2026-11-05.md).
    - [x] Native views/controls, layout, context bindings, bounded UI AST/type checks
      and scoped view projections; actual runtime/current grants remain attached.
      [Native view evidence](evidence/app-native-views-component-2026-11-05.md).
    - [x] Actual core-Wasm/WIT runtime, required resource policy, bounded execution,
      explicit namespace configuration and standalone quote example; native verified
      predicate, authorized snapshots and outcome application stay attached.
      [Runtime evidence](evidence/app-wasm-runtime-component-2026-11-05.md).
    - [x] Structured configuration/library/arguments and typed commerce-hook
      declarations; frozen snapshot/expected-decision grammar, WIT projection and
      real example execution, reused by native install/checkout/release paths.
      [Business contract evidence](evidence/app-business-contracts-2026-11-06.md).
    - [x] Native order/quote lifecycle graph and immutable snapshot contracts,
      bounded compiler, current-right narrowing and safe display projection;
      independent example and assembled order/RFQ/release paths use the same code.
      [Native lifecycle evidence](evidence/app-native-lifecycle-component-2026-11-06.md).
    - [x] Complete strict typed Manifest and shared canonical fingerprint/signing
      message; passive artwork/provider grammar and bounded publisher/dependency
      graph checks, retaining current operator trust and native financial effects.
      [Complete package evidence](evidence/app-complete-package-component-2026-11-06.md).
    - [x] Complete ordered standard domain compiler with mandatory field/reference,
      currency/scope/source/native-base, signature/namespace/destination/read-effect
      and clock ports; all 19 stages and first-error semantics tested independently
      and reused by native installation/Studio/API/MCP/release consumers.
      [Complete compiler evidence](evidence/app-complete-compiler-component-2026-11-06.md).
    - [x] Bounded scoped job history/detail and actual merchant control transaction,
      with required retry admission, unchanged revisions/uncertainty/lease semantics,
      actor/package rebinding and atomic outbox. Native callbacks/evidence/current
      authority stay attached. [Job workflow evidence](evidence/app-job-workflows-component-2026-11-06.md).
    - [x] Digest-bound encrypted settings/transport persistence through required host
      AEAD; secret-safe metadata, CAS/concurrent rotation, shared webhook read and
      atomic events, retaining native identity/consent/key/projection owners.
      [Encrypted configuration evidence](evidence/app-encrypted-configuration-component-2026-11-06.md).
    - [x] Immutable development snapshot/history/archive persistence and actual
      private-stage sequence, retaining native current admission and installer on
      the original transaction. [Studio version evidence](evidence/app-studio-versions-component-2026-11-06.md).
    - [x] Actor-private mutable Studio autosaves and scoped reads/deletion, original
      wire/byte/revision/quota behavior and required environment admission on the
      same transaction. [Private draft evidence](evidence/app-private-drafts-component-2026-11-06.md).
    - [x] App-record capture/history/restore orchestration with required current
      historical-read authority and actual normal save port; unchanged scoped
      retention, original attribution and caller rollback.
      [Record history evidence](evidence/app-record-history-component-2026-11-06.md).
    - [x] Package activation/deactivation and active-dependant fencing through
      required current native host hooks; same writer/install locks, error order,
      retained data and revision behavior. [Activation evidence](evidence/app-activation-component-2026-11-06.md).
    - [x] Explicit field migration and bounded old-manifest/record recovery
      capture, required actual host validation and atomic installer rollback.
      [Schema recovery evidence](evidence/app-schema-recovery-component-2026-11-06.md).
    - [x] Independent execution host, fresh identity introspection, typed API/MCP,
      SDK parity and container with no Core/database dependency.
      [Runtime service acceptance](evidence/app-runtime-service-component-2026-11-06.md).
    - [ ] App-data identity and remaining lifecycle hosting.
    - [ ] Supported independent schema/service with API/MCP and SDK examples.
    [Installation evidence](evidence/app-installation-component-2026-11-05.md).
    [Admission and package fence evidence](evidence/app-admission-component-2026-11-05.md).
    [Model extraction evidence](evidence/app-model-component-2026-11-05.md).
    [Record operation evidence](evidence/app-record-operations-2026-11-05.md).
  - [ ] MKT-03c Accept independent durable-host operation, restricted database
    roles, migration/restore and complete Veyndo composition before cutover.
- [ ] MKT-04 Test listing overrides, mapping, stock sync, changed revisions,
  duplicate external orders, refunds, events and restart against provider fixtures.
- [ ] MKT-05 Prove standalone SDK integration and complete Veyndo channel creation,
  Studio navigation, sync, order, stock and documents after extraction.
- [ ] EDI-01 Extract codecs/profiles/mappings with API/MCP and private settings;
  test malformed and duplicate messages, native document export and B2B intake.
- [ ] POS-01 Extract register UI/device adapters and native commerce ports;
  preserve cashier rights, discounts, customer cards and immutable receipts.
- [ ] POS-02 Test SDK register use plus native sale/cancellation/refund/stock/events;
  document real printer/hardware acceptance separately from fixture tests.
- [ ] B2B-01 Extract company/unit/catalog/budget/approval/RFQ domain ports and UI;
  keep transactional checkout admission in the commerce owner.
- [ ] B2B-02 Test API/MCP/UCP negotiation, budget races, approval, EDI requisition
  and reorder in independent adapters and assembled Veyndo.
- [ ] SHIP-01 Extract generic booking/label/tracking/return contracts and adapters;
  retain package-owned carrier protocols and no default provider selection.
- [ ] SHIP-02 Test uncertain booking, immutable documents, split/dispatch admission,
  retries, restore, current rights and actual native fulfillment consumption.

## MIGRATION, PAYMENTS, EXPERIENCE and REPORTS

- [ ] MIG-01 Move the existing Rust migration application to `veyndo/migration`;
  retain source adapters, immutable packages, review and Veyndo target intake.
- [ ] MIG-02 Supply own API/MCP/SDK and test products, variants, content, customers,
  history, reviews and coupons without source-system credentials in fixtures.
- [ ] PAY-01 Separate generic orchestration contracts into `veyndo/payments` while
  keeping Shopware/PayPal implementation in private `shopware-payments`.
- [ ] PAY-02 Preserve immutable attempts, account/environment binding, receipts,
  capture/void/refund idempotency, vault and invoice instruction authority.
- [ ] PAY-03 Expose own scoped API/MCP/SDK; test provider fixtures and complete
  native/Storyfront purchase/refund. Actual sandbox-provider acceptance is separate.
- [ ] EXP-01 Preserve original private Storyfront pins, editor and renderer;
  adapt only host contracts and new repository/deployment references.
- [ ] EXP-02 Test onboarding, return/login, channel identity, embedded checkout,
  confirmed return, purchased-item removal and replay after reload.
- [ ] RPT-01 Extract metric definitions, consent-bound ingestion/projections and
  dashboard configuration without a second financial order ledger.
- [ ] RPT-02 Expose API/MCP/SDK and embedded cards; test revenue periods, currency,
  conversion denominators, channel/POS/marketplace attribution and PII access.

## Complete-product release acceptance

- [ ] SYS-01 Resolve and boot a clean composition from exact released component
  versions; include private services only through authorized images/contracts.
- [ ] SYS-02 Run automated signup/setup, roles, catalog/variants/media, search,
  direct checkout and embedded Storyfront checkout through real browser/API paths.
- [ ] SYS-03 Check return URLs, localized order, both empty carts, receipt, mail,
  capture/refund events and configured flow execution.
- [ ] SYS-04 Create an app via agent/visual editor, configure, test privately,
  publish selected changes, update and restore with retained records.
- [ ] SYS-05 Exercise POS, marketplace import, B2B/EDI, shipment and cross-channel
  inventory against isolated fixture services and explicit provider test modes.
- [ ] SYS-06 Verify service failure/restart, rolling contract versions, duplicate
  events, revoked rights, foreign tenants and restore across all storage owners.
- [ ] SYS-07 Keep README, website, component references, examples and current status
  synchronized with released artifacts and actual acceptance evidence.

## Progress log

### Shared app business contracts, 6 November 2026

- Apps 0.22.0 shares the original package state-change transaction, active-dependant
  check and revision CAS. Required host hooks retain configuration-first locking,
  current rights/trust/commerce/lifecycle and connected-frontends admission. Actual
  shared install/writer tests exercise dependency races in both orders; no data,
  version, credential or job lifecycle is substituted. [Extraction](evidence/app-activation-component-2026-11-06.md).

- Apps 0.21.0 shares immutable app-record capture and bounded history plus the
  actual lookup/read-admission/managed-restore sequence. Restoration creates a new
  revision through the native current-package/field/reference/lifecycle/CAS writer;
  snapshot/event failure rolls back the whole transaction. Real PostgreSQL checks
  exercise concurrent restores and actual 16 MiB retention. [Extraction](evidence/app-record-history-component-2026-11-06.md).

- Apps 0.20.0 shares private mutable draft persistence, preserving strict wire
  decoding, exact submitted fields, actor scope, 64 KiB budget, row/CAS and per-user
  quota locking. The native product retains current identity, developer access,
  owned-environment checks and caller transactions. Drafts neither install nor
  publish packages. [Private draft extraction](evidence/app-private-drafts-component-2026-11-06.md).

- Apps 0.19.0 shares immutable App Studio snapshots and their original digest,
  bounded active/archive history, recovery and the actual row-fenced staging
  sequence. Required native environment/compiler/actor/installer admission retains
  its original authority and transaction. [Studio version extraction](evidence/app-studio-versions-component-2026-11-06.md).

- Apps 0.18.0 extracts encrypted configuration storage/resolution/rotation into
  required host crypto ports. Original scoped bindings, locks, package/CAS checks,
  webhook read fences and atomic event behavior remain connected. Exhausted
  revision inputs reject safely. [Encrypted configuration extraction](evidence/app-encrypted-configuration-component-2026-11-06.md).

- Apps 0.17.0 extracts actual job history and merchant control into the independent
  storage package. Native HTTP routes consume that same implementation with
  mandatory current-action/right/input retry admission and current response
  redaction. A disposable PostgreSQL example runs without Core and rolls back.
  [Job workflow extraction](evidence/app-job-workflows-component-2026-11-06.md).

- Apps 0.16.0/model 0.12.0 composes all 19 standard domain stages in the original
  native order with required trusted-host policy decisions. The full compiler,
  including actual native view lookup, is now independent; an exhaustive Manifest
  pattern requires review when new package fields are added. Native identity,
  source preparation, transactions and current authority retain their owners.
  [Complete compiler extraction](evidence/app-complete-compiler-component-2026-11-06.md).
- Apps 0.15.0/model 0.11.0 shares the complete strict native package wire,
  common compiler projection, original fingerprint/signing message and remaining
  artwork/provider/publisher/dependency grammar. Native operator trust, current
  permissions, installed-package locks and financial effects remain attached.
  [Complete package extraction](evidence/app-complete-package-component-2026-11-06.md).
- Apps 0.14.0/model 0.10.0 shares native lifecycle graph/snapshot contracts and
  compilation through mandatory native base/scope/locale ports, plus current-right
  narrowing and accepted-label projection. Native domain validation, transactional
  locks, current identities and final verified transition checks retain their owners.
  [Native lifecycle extraction](evidence/app-native-lifecycle-component-2026-11-06.md).
- Apps 0.13.0/model 0.9.0 shares structured configuration, public library/lookup,
  exact arguments, typed hooks and bounded frozen business examples. Runtime 0.2.0
  consumes that pure model for the same WIT projection, real guest comparison
  and bounded integer contribution execution used in the Core.
- Native complete-package validation order, canonical currency/value/reference
  policies, actual source probing, cached preparation, current selected package
  and record authority, async execution and transactional release stay attached.
- Independent preflight executes seven configuration and five commerce examples
  without Core/SQL/inference. Exact source/acceptance and remaining domain/identity
  service extraction are [documented](evidence/app-business-contracts-2026-11-06.md).


### Independent app Wasm runtime, 5 November 2026

- Apps 0.12.0 publishes `veyndo-app-runtime` 0.1.0 with the actual core-Wasm/WIT
  executor. It has no Core/kernel, SQL/network or environment dependency.
- Native `crates/apps` adapts its required resource policy using the original
  verified predicate and supplies configured legacy namespaces. Original cache,
  admitted snapshots, checkout, current package rights and release remain native.
- Own locked runtime CI, executable quote example and real guest regressions are
  paired with native adapter, checkout/B2B/configuration, preview/release and
  marketplace composition. Core rejects drift between the runtime WIT input
  and SDK mirror. [Evidence](evidence/app-wasm-runtime-component-2026-11-05.md).
- Identity/lifecycle hosting and a standalone API/MCP service remain open.


### App native view and UI behavior contracts, 5 November 2026

- Apps 0.11.0/model 0.8.0 extracts strict view/control/geometry wire types,
  editor context bindings, bounded UI behavior and static type checks.
- Core uses the same source through its native adapter with canonical field
  policies and the direct verified public-read predicate. Current grants,
  execution, scoped records, runtime actions and release remain connected.
- Independent compiler/example and actual PostgreSQL acceptance, native package
  fingerprints, app unit tests and affected composed HTTP/MCP flows are recorded
  in the [evidence](evidence/app-native-views-component-2026-11-05.md).
- Complete identity/lifecycle hosting and standalone API/MCP remain open in MKT-03b.


### Shared placement and HTTP route contracts, 5 November 2026

- Apps 0.10.0/model 0.7.0 extracts strict Surface/ApiRoute wire types and the
  existing placement/action/path/scope/method grammar and error pointers.
- Native view existence, known team scopes and read-only effects are required host
  policies. Veyndo retains its actual native registry/scope catalog and verified
  read predicate; full native view compilation still runs separately in order.
- Actor/context-bound grants, installed-package admission, UI pins and execution
  remain native. Standalone Rust example and independent model cases run in CI.
- [Implementation and acceptance](evidence/app-surface-contracts-2026-11-05.md).

### Shared object bindings and intelligence graph contracts, 5 November 2026

- Apps 0.9.0/model 0.6.0 extracts native object-binding declaration rules and strict
  AI tool/entity/mapping types. Exact object and PII scopes remain declared on
  private native list/save actions with unique required reference anchors.
- Graph validation/projection uses the same declared fields, namespaced node/edge
  types, source version/revision and budgets. Native lists and object projections
  feed already-authorized current rows into that same component implementation.
- Native current rights, immutable reference ownership, MCP/agent admission,
  tenant-scoped lists and the verified configuration-release predicate stay native.
- [Implementation and acceptance](evidence/app-object-graph-contracts-2026-11-05.md).

### Shared event, schedule and webhook contracts, 5 November 2026

- Apps 0.8.0/model 0.5.0 extracts strict event filter/delivery types, declared
  subscriptions, own-app binding and existing privacy projections. Filters use
  projected data. The destination validator remains a mandatory host policy.
- UTC cron parsing/validation accepts a host clock; private incoming webhook
  declarations bind existing emit actions. Native durable delivery/ticks,
  signatures, replay, current package authority and SQL remain their owners.
- Independent model builds have their own lockfile and direct CI; tracked Rust
  build artifacts are ignored at every depth and explicitly rejected by CI.
- [Implementation and acceptance](evidence/app-event-contracts-2026-11-05.md).

### Shared settings and schema evolution, 5 November 2026

- Apps 0.7.0/model 0.4.0 extracts strict localized setting declarations, bounded
  updates and secret-safe projections from native settings, plus explicit migration
  declarations, compatibility planning and exact conversions from schema changes.
- Existing encrypted settings and native upgrade review/install transactions use
  that same pinned code. Identity, package consent, secrets, actual checked record
  changes, recovery snapshots and atomic commit remain with their original owners.
- The independent Rust example prepares settings and an explicit model plan without
  Core or SQL. Full standalone identity/runtime/schema/API/MCP remains open.
- [Acceptance evidence](evidence/app-evolution-settings-2026-11-05.md).

### Shared common package compiler, 5 November 2026

- Apps 0.6.0/model 0.3.0 owns common package metadata, budgets, capability grammar,
  model/index/configuration bindings, action schemas and cross-feature action
  restrictions, strict legacy slots and event names. Native validation delegates
  to this exact implementation.
- Mandatory host before/after validators keep the complete native extension
  checks. Scope registry, Wasm-kind and verified reference policies retain their
  host owners; full decoding, identity, trust and standalone service remain open.
- All 34 independent model tests, actual PostgreSQL, 74 native app units, affected
  Studio/preview/release/app/Marketplace fixtures and the local payment-provider
  checkout/capture/refund/callback fixture pass. Published package digests remain
  unchanged for all 34 bundled packages. Component CI no longer runs library tests
  twice: --tests includes the original unit and all integration tests.
- [Exact source and acceptance](evidence/app-package-compiler-2026-11-05.md).

### Shared atomic app installation, 5 November 2026

- Apps 0.5.0 owns the original package installation transaction sequence: tenant
  and package locks, quota, immutable version check, package/model attachment,
  version/event persistence and configuration/schedule completion through required
  host hooks. Core calls that exact implementation.
- Native compiler, signed package/provider trust, actor/consent, commerce admission,
  downgrade/schema migration and preview authorization retain their existing owners.
- Independent PostgreSQL cases cover ordering, every hook failure rollback,
  concurrent quota contention, foreign version identity and writer/upgrade fencing.
  Native install/upgrade, App Studio, F5, staging/release, signed distribution,
  callback/consent, models/jobs, tenant isolation, visual workspace and Marketplace
  composition pass. Full standalone service acceptance remains open under MKT-03b.
- [Exact source and acceptance](evidence/app-installation-component-2026-11-05.md).

### Shared app admission, 5 November 2026

- Apps 0.4.0 shares Action wire types, current-authority ports, primary/compound
  rights, callback capability mappings and callback-key scope planning. Native
  authentication, verified callback policy and credential issuance remain native.
- The same component owns canonical content fingerprints and the scoped active
  package lock/read. Full typed digest comparison and reserved/provider package
  approval retain their host owner. PostgreSQL verifies upgrade/write exclusion
  without blocking another tenant.
- Twenty-two independent model tests, 74 native app units and the affected native
  callback/consent/surface/job/state/schema/isolation/visual and marketplace
  fixtures pass. All 34 public package fingerprints remain unchanged.
- The surface concurrency fixture now holds/releases calls explicitly instead of
  depending on a one-second polling window. The production ceiling is unchanged.
- MKT-03b remains open for complete package/identity hosting and standalone API/MCP.


### Pure app model component, 5 November 2026

- Apps 0.3.0 adds the independent `veyndo-app-model` Rust package. Native entity
  types, declaration grammar, bounded schemas, field/language checks, publication
  declarations and record workflows now have one shared implementation.
- Required host ports retain native currency/rich-content/relation validation and
  the verified reference guard. The model crate cannot import SQL, network, Core
  or the storage crate; dependency checks reject those four bypasses.
- Fourteen independent model tests, 74 native app unit tests, affected PostgreSQL
  suites and component CI pass. All 34 public package fingerprints match the
  previous binary, preserving installed immutable package identities.
- MKT-03b remains open for full package/identity authority and separately hosted
  API/MCP operation. Model extraction does not establish standalone authorization.


### Shared record operations, 5 November 2026

- Apps 0.2.0 owns the original record CAS/import replay/write/outbox sequence and
  bounded keyset/filter/publication queries. Core API/MCP/Flow and site/app editing
  use these functions; lifecycle/history hooks run in the existing transaction.
- Independent PostgreSQL and component CI cover CAS races, replay, hook/outbox
  rollback, typed filters, hostile bound field names and public windows. Native
  app storage/jobs/schema/object extensions, 43 tenant checks, visual workspace
  and the marketplace order/stock/Flow/invoice fixture pass.
- Corrected the visual workspace fixture to expect rejection of an unsafe local
  HTTP reference before model invocation; kept the existing server URL protection.
- MKT-03b progressed; complete model/identity extraction and authenticated
  standalone API/MCP deployment remain open.


### App persistence extraction, 5 November 2026

- Published the initial `veyndo/apps` storage package with extracted source history,
  original license, provenance, its own PostgreSQL CI and native connection/scope
  ports. Core consumes its pinned source through `components.lock.json`.
- Record storage, job admission persistence and job/outbox handoff now use this
  package. Native current identity, package, CAS, field/reference validation,
  history and signed database scope remain on the original execution path.
- Independent PostgreSQL verifies rollback, concurrent request replay, failed
  outbox rollback, quotas, expired leases and persistence after reconnection.
  Native shared storage, jobs, 43 tenant checks and the marketplace HTTP/MCP
  order/stock/Flow/invoice fixture pass with the extracted code.
- MKT-03a is complete. MKT-03, APP-02 and standalone host acceptance remain open;
  this Rust library does not yet supply a standalone authenticated app service.


### 5 November 2026

- Created and secured the organization; transferred the existing repositories
  without changing visibility. Verified repository IDs, main commits and Core
  branch protection through GitHub API.
- Rebuilt/deployed Pages successfully at the new organization. The existing
  website proxy initially required new upstream/media origins; its deployed repair
  and remaining compatibility audit are now recorded under ORG-06.
- Published `veyndo/sdk`: 202 canonical input contracts, original guest bridge,
  dependency-free HTTP/stateless MCP client, typed external operation configuration,
  Node/browser examples and source provenance. SDK main `2786e54` passed Node 22/24
  CI [42024978023](https://github.com/veyndo/sdk/actions/runs/42024978023), including
  eight independent wire cases, negative type controls and exact source exports.
- The Node example completed initialize and catalog.search against the public
  Core. No standalone knowledge service or full component extraction is accepted.
- Installed the packed SDK into a separate consumer outside all Veyndo checkouts;
  its package import, native MCP initialize/catalog read and Node ESM TypeScript
  contract checks passed. Main requires successful Node 22/24 checks and prohibits
  force pushes/deletion. The SDK package is a GitHub prerelease, not an npm release.
- Experience website-origin changes passed 254 tests, type/localization/structure
  checks and the production frontend build locally, then private CI and merge
  [85](https://github.com/veyndo/experience/pull/85). The final hosting organization
  app authorization is pending; this fix is not yet publicly deployed. The public
  handbook remains available at <https://veyndo.github.io/veyndo/docs/> meanwhile.
- Existing integration/proof tests remain authoritative; this planning work does
  not claim a new full-system test run.
- After the transfer, the old personal GHCR destination rejected the new
  organization's workflow token. Image publication now uses `ghcr.io/veyndo/veyndo`
  and `ghcr.io/veyndo/migration`. The real packaged Core signup/private preview/
  restart and migration non-root health checks, followed by publication, passed
  at source `43aae905`: [Core image](https://github.com/veyndo/veyndo/actions/runs/42028917700),
  [migration image](https://github.com/veyndo/veyndo/actions/runs/42028917797).
  Already deployed images and the documented tour pin remain unchanged until
  independent pull access and the new deployment coordinates are accepted.
- SDK [0.1.1](https://github.com/veyndo/sdk/releases/tag/v0.1.1) preserves uncertain
  outcomes for domain/tool and internal RPC failures after possible external
  effects. The added regression failed before the fix and passed afterward;
  [Node 22/24 CI](https://github.com/veyndo/sdk/actions/runs/42029426645) also passed.
  Actual old Git clone URLs resolve to the transferred repositories' current HEADs.
