# AI Commerce Components: implementation plan

This is the authoritative task list for extracting independently usable Veyndo
components. Updated 5 November 2026. Checked tasks name observed evidence;
repository transfer, local tests, remote CI and hosted acceptance are separate.
The full component extraction is in progress, not released.

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
- [ ] ORG-07 Reconnect hosting source integrations to new repository ownership;
  preserve running versions, private submodule pins, deploy keys and rollbacks.
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
- [ ] CORE-05 Extract cart and checkout orchestration; preserve CAS, legal receipt,
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

- [ ] APP-01 Split manifest/schema validation and Wasm execution into distributable
  packages preserving resource limits and reviewed component digests.
- [ ] APP-02 Extract app data/settings/jobs/version contracts and fixed shared
  storage; never create per-app/per-model/per-tenant tables or indexes.
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

- [ ] MKT-01 Move `extensions/apps/marketplaces` source/providers/UI/tests into
  `veyndo/marketplaces`, preserving package ownership and provenance.
- [ ] MKT-02 Extract the generic host exchange/order-intake contract into the SDK;
  expose own mapping/listing/sync/review/order API and MCP tools.
- [ ] MKT-03 Replace dependence on native app records/jobs with host interfaces and
  an independent supported implementation; no copied native order ledger.
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

### 5 November 2026

- Created and secured the organization; transferred the existing repositories
  without changing visibility. Verified repository IDs, main commits and Core
  branch protection through GitHub API.
- Rebuilt/deployed Pages successfully at the new organization. The existing
  website proxy still needs its upstream and media origins changed (ORG-06).
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
  checks and the production frontend build locally. Hosting reconnection requires
  GitHub's pending Passkey confirmation; this fix is not yet publicly deployed.
- Existing integration/proof tests remain authoritative; this planning work does
  not claim a new full-system test run.
