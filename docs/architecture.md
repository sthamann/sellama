See [v0.5 connected intelligence, app and payment paths](intelligence-apps-payments.md)

**Personal workspace and standard-shop editor:** [Illustrated workflow, shared models, rights, history, forms and publication](personal-workspace-and-shop-design.md).
for the current implementation and performance limits.

# Architecture decisions and next boundaries

The product can run as one shop or use independently deployable components.
The in-process commerce port and the independently hosted checkout adapter
use the same native quote and purchase owners. Keep the atomic order, stock
and event transaction with Commerce. The component boundary changes how a
caller reaches the operation. Its authority and business decisions stay with
the same owner. [Component map and measured composition](one-shop-components.md).

Core exposes three host operations for an independent Checkout client. Quotes
are read-only. Confirmation rechecks the quote and commits through the native
order transaction. Receipt recovery uses the original indexed purchase key.
The normal storefront and Storyfront both call Core. For a configured test
shop, Core relays the browser's two session operations to private Checkout,
with separate request capacity for the relay and its Commerce callbacks.
A short bounded wait absorbs bursts before requests reach Checkout. The
cluster still caps simultaneous purchases per shop, and Commerce owns the
order, stock and event transaction. The public Lumen pilot verifies this composition in the original Storyfront
iframe with demo payment.
[Commerce host ports](checkout-component.md#commerce-host-ports-in-core) ·
[Hosted Lumen pilot](checkout-component.md#hosted-lumen-pilot-10-november-2026) ·
[Matched Northflank relay measurement](evidence/composed-release-rehearsal-2026-11-10.md#hosted-relay-admission-comparison).

The separate Checkout service can also call a reference commerce host. The
host has its own database and runs the same purchase orchestrator with its own
cart, pricing and transaction adapters. This demonstrates the boundary with
real persistence and simulated payment. An external storefront uses the
JavaScript SDK on its server and recovers the same receipt after a browser
reload. The sample runs separately from the native request path.
[Browser example](checkout-component.md#external-reference-storefront).
Storyfront can recover a purchase after its browser notification is lost. Core
deploys the recovery route and migration first. The Experience uses the
verified Core receipt to decide when to clear its original cart.
[Native and embedded compatibility](checkout-component.md#how-native-and-embedded-checkout-share-one-order).
[Hosted acceptance](storyfront.md#accept-a-hosted-release).
Checkout delegates company approval and budget checks to the native transaction.
A current identity is also required to read the stored order result.
[Authority tests](checkout-component.md#current-buyer-channel-and-company-authority).
Independent Checkout admission can be paused at its confirmation boundary.
Core continues to serve its own storefront and hosted handoff. Its provider
workers reconcile existing payments against the original order. The same
session and purchase identity carry across a Checkout restart.
[Rollback rehearsal](checkout-component.md#pause-and-resume-checkout-confirmation).

Knowledge projects private source and catalog content into a separate database.
The installed app receives product events through the existing delivery queue.
Projection reads the current Core product, and the local test verifies a
purchase while Knowledge is down and source delivery after restart.
For a single configured shop, Core can check current app and integration keys
for the catalog projection. A scoped callback reads the snapshot. A distinct
read scope serves the resulting evidence. The buyer transaction has no
dependency on Knowledge or its identity endpoint. External applications can
import their own sources and verify localized evidence through the typed SDK
against the service without Core.
The standalone database recovery keeps source records and localized chunks.
It rebuilds the search index under fresh runtime credentials.
[Recovery procedure](knowledge-component.md#restore-knowledge-into-a-fresh-database).
[External SDK example](knowledge-component.md#import-your-own-catalog-and-documents-with-the-sdk) ·
[Knowledge service boundary](knowledge-component.md#keep-the-shop-running-during-a-knowledge-outage).

Core links the pinned Automation rule library into native pricing and Flow
execution. The separate service uses the same source for SDK and MCP previews of
caller-supplied facts. Those previews run separately from the checkout transaction.
In the local outage test, native coupon pricing, purchase and the
invoice Flow completed while the preview process was stopped.
[Automation service boundary](automation-component.md#keep-checkout-independent-of-the-preview-service).
The optional Core identity profile uses dedicated integration keys with
`automation.read`. The preview checks the current grant at Core, while native
pricing and checkout call the library in-process.
[Access and deployment](automation-component.md#connect-the-service-to-veyndo-core).
Flow authoring and native workers share a dependency-free graph validator.
The worker looks up steps by stable node ID. Core owns event persistence,
permissions and execution.
[Flow graph contract](automation-component.md#flow-graph-contract).
Studio and external clients can check a Flow draft through the same Core
admission rules. The read uses one tenant snapshot. Publishing rechecks current
dependencies and the expected revision in the write transaction.
[Draft check](automation-component.md#check-a-flow-draft-before-saving).
Core uses the same versioned built-in Flow catalog for authoring,
event admission, HTTP and MCP discovery. Installed app capabilities and
actor rights are resolved per shop. [Flow catalog](automation-component.md#built-in-flow-catalog).
The Flow runner uses one PostgreSQL adapter for claims and checkpoints.
A deferred job releases its claim, and each progress or completion write
must match the shop, job and execution attempt. Checkout commits the
event and the worker consumes it asynchronously.
[Flow job storage](automation-component.md#durable-flow-job-storage).
Northflank runs app work in a separate private process. Core keeps the public
checkout and writes the order event. Both processes use the existing restricted
runtime connections, and the app worker samples due queue ages.
[Hosted cutover](status.md#live-flow-draft-check-and-separate-app-worker-9-november-2026).
Connectors own provider credentials, delivery leases and receipts. The app
worker calls the existing app gateway after checkout has committed. The
Connector can use a separate PostgreSQL database and still consume the same
order Flow. The local composition test verifies one delivery after an exact
checkout replay. [Connector boundary](connector-component.md#verify-the-complete-shop).
The validated graph also supplies typed directives for branching, effects,
delays and stops. Core evaluates rules from the saved job, checks current
rights and dispatches through the existing action owners. An app worker can
run in a separate process and consume the same durable jobs. Core can
disable just its app lane, which covers Flow execution, app scheduling and
deliveries. Checkout still commits orders and events in Core. Shutdown
gives app tasks a bounded window to persist progress before the process
releases its database connections.
[Flow directives](automation-component.md#portable-flow-directives) ·
[Worker rollout](automation-component.md#move-the-app-worker-out-of-core).
Worker queue freshness is sampled through the existing PostgreSQL pool
and reported in process logs. Checkout stays independent of this read.
[Queue signals](automation-component.md#read-the-worker-queue-logs).

See the [SaaS scalability roadmap](scalability.md) for code-specific bottlenecks,
cell architecture, delivery order and proposed capacity/economics tests.

The app executor is also independently usable as `veyndo-app-runtime` in
[veyndo/apps](https://github.com/veyndo/apps/tree/main/runtime). Core consumes the
same pinned source with its native verified resource policy; admitted snapshots,
current rights and commerce writes retain their original owners.
[Execution boundary and tests](evidence/app-wasm-runtime-component-2026-11-05.md).

## One transactional core, independently deployable workers

The Commerce crate now owns the Product snapshot and price-tier DTO
consumed by the native catalog and transaction paths. Database hydration,
permissions and storage ownership stay attached to Core's existing
operations. The shared contract can be imported by other Rust components.
[Product ownership](source-map.md#shared-product-contract).

The same crate also owns the persisted cart data contract. Core binds its
typed extension contexts and retains session authority, row locks and the
order transaction. [Cart ownership](source-map.md#shared-cart-contract).

Release tooling keeps the accepted service composition separate from a newly
built candidate. The candidate replaces one exact Core artifact and retains
the seven peer artifacts and reviewed schema inputs. This avoids a lock that
must contain its own future commit. Automatic pipeline admission remains
tracked separately. [Release candidates](cloud-releases.md#prepare-a-core-release-candidate).
The same candidate path now covers every build-backed component and retains
its seven peers, source owner and reviewed schema inputs. The imported
Automation image retains its separate immutable import contract.

Fresh installations use Rust/Axum, ordinary PostgreSQL 17 and private Qdrant
v1.16.3. PostgreSQL owns commerce records, knowledge relations, source vectors
and the durable synchronization queue; Qdrant supplies rebuildable vector search.
Candidates are hydrated and checked against current PostgreSQL state. AGE and
pgvector are retained for legacy conversion, not required for a fresh install.
See [managed hosting](managed-hosting.md) for migration and index-consistency boundaries.
The runtime can separately deploy HTTP, memory/outbox, payment, app-event,
translation and media roles. HTTP-only deployments need workers for queued work.
SQL leases and receipts coordinate their work. Inference still uses an
external Ollama/provider service and process-local admission. Prices,
reservations and order placement share a database transaction initially.

Catalog operations use a pool of 20 connections. Checkout locks the cart and
its product rows in deterministic ID order; an advisory lock serializes one
tenant/idempotency key across concurrent requests. Disjoint product orders can
progress independently. There is no unbounded model call in this transaction.
All writes originate from deterministic operations, not model-generated SQL.

An embedded checkout can recover an order after the browser misses its return
message. Commerce resolves the original cart and order through a scoped recovery
key. Status reads use the last committed state while an order is in progress.
Only reopening an open cart takes the purchase lock and invalidates the old
frame. [Storyfront recovery contract](storyfront.md#responsibilities-and-contracts).

The hosted Lumen profile pins the builds, interface dependencies and schema
inputs of its services. Deployment verification compares the active artifacts
with the recorded set before testing checkout and background work.
[Composition release lock](cloud-releases.md#verify-the-hosted-lumen-composition).

The [illustrated production architecture](production-architecture.md) explains
implemented money, database security, inventory, payment, cache, admission and
observability foundations. Orders/provider boundaries now use explicit minor
integers and currency scale; the ported calculators deliberately retain Shopware
float behavior and remain behind the original-source differential gates. Core
FORCE RLS requires a separate non-owner runtime login and strict startup; direct
or session pooling is supported. All payment methods have persisted allocations,
provider money states have central admission, committed outbox events evict
settings caches, and replicas share daily interactive HTTP AI quotas.

Remaining production steps include integer pricing/tax intermediate rounding,
distributed concurrent/spend/job quotas, telemetry export, independently operated
cells and measured recovery/failover. The guide gives exact configuration, tests,
privileged exceptions and limits rather than treating the foundation as complete
production certification.

## Intelligence is connected to state

The model reads tenant-scoped product snapshots and experience state. Its
output is parsed into typed changes. The server binds actual revisions to the
snapshot, persists the proposal, and the merchant approves exactly that stored
proposal. Applying it is atomic and rejects stale revisions. Browser, MCP and
merchant endpoints call the same operations; agent output has no separate
privileged execution path. The proposal summary is model text, not a guarantee
that it matches the changes: the UI displays the actual fields for review.

Customer advice selects catalog IDs and one registered layout. Local behavior
updates ordering immediately while keeping keyed product/cart/form components
stable. A small policy stores which variant was exposed, its selection
probability and a reward generated by a simulated order. Model weights remain
fixed. Production experiments need randomized control, delayed outcome,
refund corrections, trust/consent and contribution-margin objectives.

## Extension isolation

The guest signature is `approve(total_minor: i64, limit_minor: i64) -> i32`.
Only merchant-authorized modules are activated. The engine compiles at
activation; instances get 10,000 fuel units, 1 MiB memory, a 256 KiB Wasm stack
and no host imports. Source is limited to 32 KiB. Infinite loops and oversized
memory are tested. Source/digest survive restart; boot recompiles saved modules.

This is a genuine small sandbox, not a general PHP JIT. More powerful hooks
need versioned typed host capabilities and a separate quota/sandbox worker.
Activation caches are process-local and refresh from the persisted policy inside
checkout; the two-instance extension regression verifies this boundary. Compilation also
needs stronger process-level time/memory limits for untrusted SaaS authors.

## Standards are adapters

The capability registry describes operations and typed MCP inputs. UCP checkout
calls the same cart and checkout implementation. Protocol versions and the
unimplemented portions are documented rather than claiming all agentic
standards are one interchangeable interface.

Studio maps validated workspace definitions onto registered OpenUI panels.
The Orders panel uses the normal order and fulfillment views. The policy
panel retrieves current, scoped Shop Knowledge passages separately. The
independent SDK host can bind those reads to separate service endpoints.
The storefront uses its native product and cart controls for buying.
[Composition walkthrough](agentic-component-ui.md#orders-shipments-and-shipping-policy).

Installed apps can add interactive cards to either conversation. Studio uses
its durable run status to announce a completed read. The storefront uses its
chat stream. Both host app interactions through the same revision-bound MCP
gateway. Commerce changes remain on the native review and confirmation paths.
[Studio conversation flow](agentic-component-ui.md#show-the-merchants-app-view-during-the-answer).

Primary protocol sources checked during implementation:

- https://ucp.dev/specification/shopping/checkout/rest/
- https://ucp.dev/2026-08-25/schemas/shopping/checkout.json
- https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

## Historical v0.2: one data engine, three representations

This section records the original AGE/pgvector implementation. The current
PostgreSQL/Qdrant replacement is described above; the extension requirements
and exact-vector search details below apply to the earlier version.

PostgreSQL owns orders, stock, revision checks, outbox, conversations and
proposals. Apache AGE owns explicit Product/Need nodes and SERVES/PAIRS_WITH
relationships. pgvector stores real 1,024-dimensional Qwen embeddings with
model and document hashes. All three are in the same open database, backed by
the existing volume. Startup migrations and initial graph construction are
serialized with a database advisory lock.

Graph queries are fixed code templates with bound agtype parameters. Product
metadata updates join merchant approval's transaction. The seeded relations
have curated-demo provenance; neither their presence nor embeddings imply
learned causal knowledge. Search filters by tenant and model before exact
ranking, then joins current price/stock/revision from the ledger. Unchanged
documents reuse embeddings. No ANN index, graph sharding or million-product
performance is claimed. A production system needs bounded graph neighborhoods,
tenant partitioning and retrieval before model context construction; the
six-product demo still passes the full bounded catalog to the planner.

## Historical v0.2: persisted conversations and provider boundaries

The transaction-held inference described here was later replaced with short
conversation leases and network calls outside database transactions; see
[the current inference path](intelligence-apps-payments.md#process-scaling-and-measured-boundaries).

The merchant chat reads current catalog, graph, experience state, recent
conversation and verified simulated-order aggregates. Ollama (explicitly disabling optional thinking for bounded structured operations), OpenAI Responses
and Anthropic Messages produce the same typed proposal. Optional cloud keys
remain on the server; provider errors create explicit chat messages without
executable proposals. There is no silent fallback.

Conversation turns use a per-conversation advisory try-lock and retain the
last 16 messages as model context. Inference holds a conversation transaction,
not stock/product locks. It is an asynchronous HTTP request inside one process,
not a durable worker; long-running jobs should move to a worker with bounded
queues and cancellation before scaling. Approvals remain a separate short
transaction. History reads join the actual task's applied flag so reloading
cannot offer an already-applied change as pending.

The MCP stdio bridge forwards to Rust's shared capabilities. Remote ChatGPT or
Claude account registration, HTTPS deployment and OAuth remain deployment work;
the prototype does not imply local endpoints are reachable from hosted clients.
Cold restart checks include graph relations, exact stored vector digests,
conversations and approval state, alongside the earlier ledger/policy checks.

## Historical v0.3: merchant visibility and language context

VEYNDO Studio reads one tenant-scoped overview containing actual order
aggregates, seven-day counts, inventory, AGE relations, vector-index metadata,
recorded policy counters, activity and provider/connector boundaries. Every
product selection shares the same preview state. Preview quote construction
is in-memory and executes the real deterministic pricing operation without
writing a cart, order or inventory. Mobile users open the same preview in a
native dialog. Locale/theme preferences persist; the merchant token does not.

The planner now receives recorded policy views/rewards and diagnostic channel
counts as verified facts. Its stored evidence preserves those input facts with
the chosen response locale. Graph facts are explicitly curated and the policy
learns an observed reward association, not causal uplift or new model weights.
The history groups exposures by initial session time and displays their current
reward state; it does not invent historical estimates. New approvals record
an actual applied timestamp; old proposals retain only their creation history.

HTTP call counters are best-effort asynchronous diagnostics for Store API,
MCP and UCP. They count requests, including tests; no external platform or
customer attribution is inferred. A cart's initial adapter is stored with its
order; this identifies the entry path, not the identity of a hosted agent.

The original Shopware language-chain slice feeds native translated field
hydration. English, German, French and Spanish products are seeded once;
Swiss German demonstrates parent fallback. Currency stays EUR. Original rule
priority and calculated-tier selection replace the earlier hardcoded quantity
branch, and normalized quantities are persisted in real carts. This remains a
bounded context/product-cart port with its own original-PHP differential gate.

## Current native automation and hands-on setup

`automation_rules/` evaluates reviewed source-named conditions. The marketing
context builders supply private server-owned facts; referenced rules are fetched
by tenant/ID and frozen per matching event. `marketing/pipeline_runtime.rs`
executes an admitted graph using durable node receipts, cursors and scheduled
continuations. A current membership check precedes each action. Internal product
metadata is excluded from public serialization. Apps share the existing typed
action gateway; AI proposals retain merchant review.

This is an executable native subset, not a certified translation of the full
Shopware interpreter, DAL, trigger set or FlowSequence protocol. See
[automation.md](automation.md) for source/configuration boundaries. The
[playground](playground.md) creates a separate shop through personal-owner APIs
and seeds repeatable provider-free configurations; it does not bypass production
handlers or add a second business-logic implementation.

The standard synthetic catalog lives in `src/demo_catalog.rs` and `fixtures/fashion-catalog.json`. New shops receive the Nord Atelier fashion template when demo catalog seeding is requested; `scripts/fashion_demo.py` tests the actual signup, variants, translations, images, isolated checkout and process restart. See [Fashion demo](fashion-demo.md).

## Modular B2B and EDI — 12 October 2026

Native company units, current employee rights, private catalogs, currency-bound
budgets, separate approval, RFQ negotiation, quick order and repeat lists reuse
the existing checkout, inventory, order, document and Flow owners. The Studio and
customer account use the same API/MCP contracts. [Setup, source owners and precise
B2B comparison](b2b-commerce.md). The independent `extensions/apps/edi/` package owns
bounded EDIFACT/UBL/cXML parsing, mapped private requisition import and immutable
native document export; no Core codec or second ledger. [EDI profiles, deployment
and network/certification limits](edi.md).

## Shared publication and observation owners

`marketing/channel_config.rs` owns transactional channel admission for native
writes and releases; `marketing/flow_policy.rs` checks current action rights.
`staging/access.rs` checks each selected domain and `final_config.rs` validates the
final aggregate/POS defaults. `b2b/staging.rs` clones only configuration/catalogs
and delegates publication to the same organization/catalog transactional writers.
`legal/model.rs` owns inherited visitor settings; behavior capture/report/journey
and consent disclosure consume that same policy. Shared history exposes B2B
configuration over HTTP/MCP without financial rewind. No second settings, audit
or analytics ledger is introduced. [Integration map and limits](feature-integration.md).


### App results inside assistant conversations

A versioned App Manifest declares the view and the associated read tool.
Core checks the installed package and current actor, executes the tool, then
attaches the result to the conversation. The browser hosts the view in the
existing isolated App document boundary. Pagination and a declared filter call
that view's pinned read tool within the original query. Other MCP hosts discover
the same resource through the tool metadata. OpenUI is the optional renderer for
model-generated layouts. The same service operations supply data and validate
actions in either presentation.
Generic native App list tools obtain their indexed filter fields, scalar types
and choices from the independent Apps model contract. The same metadata reaches
MCP discovery, the JavaScript SDK and the agent. Query and identity admission
remain with their existing owners; discovery never creates a database index.
[App views in conversations](agentic-component-ui.md#app-owned-views-in-the-conversation).
