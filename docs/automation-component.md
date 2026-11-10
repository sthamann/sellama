# Independent Automation component

The independent `veyndo/automation` repository contains the deterministic rule
registry, input validation, comparison, container, calendar and time-zone logic,
custom fields and selected-line evaluation. Core links the pinned library into
its native process. The independent preview service uses the same rule source
to evaluate facts supplied by its caller. Core owns native rule configuration,
trusted fact collection, checkout and Flow execution.

## Library and service

The Rust library depends on JSON/calendar support and the existing pinned pure
kernel library. It imports no Core server, SQL, provider or model runtime.
Core imports the pure sources and registry from Automation `c4e50f6`, the
revision running in the private preview. The import points Cargo to the local
kernel and verifies that its Automation policy source matches the pinned
standalone policy. All rule source and catalog files retain their upstream
bytes. The Core build uses its own dependency lock. The preview retains its
separate lock and runtime.

The 10 November local comparison exercised the Core-linked evaluator and the
standalone build of that preview revision. All 440 HTTP cases and three MCP
calls agreed, including large integers, floating-point boundaries and missing
facts. The independent PHP comparison also passed 432 original rule cases.
These results cover the tested inputs and both resolved dependency builds.

Future updates go through `scripts/component_sources.py --import-source
automation --checkout PATH --commit SHA` against a clean reviewed revision. The
import keeps the HTTP server out of Core and records the exact files in
`components.lock.json`. Changes to the registry belong in the upstream
component before an updated snapshot is committed in Core.

The service has its own Rust binary, Dockerfile, operator configuration,
OpenAPI, MCP operations and SDK example. Current OAuth access comes from the
shared identity adapter with a fixed endpoint and audience, fresh expiry/scope/
tenant admission and sanitized errors. It has no database and stores no facts.

| Interface | Operation |
| --- | --- |
| `GET /v1/rules` | Supported registry and fingerprint |
| `POST /v1/rules/evaluate` | Validate and evaluate `{name, config, facts}` |
| `POST /mcp` | `automation.rules.catalog`, `automation.rules.evaluate` |
| `GET /openapi.json` | Request and result contracts |

Required current service scope is `automation.evaluate`. The result contains
`matched`, `registryDigest` and `effects: "none"`. Facts submitted by a caller are
simulation inputs; they never become native shop authority or applied changes.
Missing facts reject, including under NOT. Scripts, unsupported conditions and
unknown DTO fields reject. Input, configuration depth, identity checks and blocking
execution concurrency are bounded. Restart loses no rule state because evaluation
is stateless and the shipped registry is versioned source.
The service calculates the immutable registry fingerprint once per process.
It continues to check current identity and evaluate the submitted facts on
each request.

## Shared release check

Core's differential test and the Automation image workflow use the
[same synthetic cases](https://github.com/veyndo/veyndo/blob/main/scripts/testing/automation-release-cases.json).
They cover passing and failing thresholds, the existing numeric tolerance,
large inputs, XOR and a missing fact inside NOT. Core runs the cases through
its linked rule evaluator. Automation verifies them through HTTP and MCP in
the native binary and the image that is published.

Before publishing, the Automation workflow compares the exact set and SHA-256
hashes of the shared rule sources, catalog and provenance with Core's
`components.lock.json`. It accounts for the one intentional Cargo change
that selects Core's local kernel. For a shared rule change, review it in
Automation, land its pinned snapshot in Core, and then release the matching
Automation build. Changes to the preview HTTP service alone do not require a
new Core rule pin. The live checkout continues to evaluate its rules locally.

## Connect the service to Veyndo Core

Set `AUTOMATION_CORE_ORIGIN` to the Core HTTPS origin and leave the OAuth
introspection settings and allowed origins unset. In Studio, create an
integration key with only **View rules, actions and flows** (`automation.read`).
Use that key from a backend or trusted MCP host. The service checks the
current permissions at Core's `/api/auth/access` on every request. Personal
sessions, browser origins and keys with additional permissions are rejected.
The preview only uses facts submitted with the request.

Run the private component image by the digest reported by its release workflow,
with port 8808 and `GET /health` for liveness. This endpoint stays independent of
Core. Use a scoped key to verify authenticated readiness after deployment.
Compare an eligible and an ineligible rule through both HTTP and MCP, then revoke
the key and check that the next request is refused. An isolated test with the
real Core issued a key, exercised HTTP and MCP, denied a broader key and
verified that revocation took effect on the next call.
[Component README](https://github.com/veyndo/automation).

### Private Northflank pilot

On 10 November the private service started one replica from Automation
`c4e50f6`. The project image import preserved the digest from the
[tested GitHub build](https://github.com/veyndo/automation/actions/runs/42792827027).
Port 8808 stays inside the project. The service has no database and uses Core's
HTTPS access endpoint for current authorization.

Through a private tunnel, health returned HTTP 204 and OpenAPI returned 200.
Anonymous access and invalid Core keys were refused with 401. An unexpected
browser origin was refused with 403. Both HTTP and MCP were exercised. Core
and the public Lumen Storyfront still responded. Authenticated previews,
revocation and latency for valid calls remain open on Northflank.

## Agent and host composition

The service advertises both operations as deterministic read tools. A trusted
host can bind the simulation to SDK 0.3.0's common workspace contract and compose
it with another component. The actual Rust process is tested through that SDK
path. Agents select registered views; endpoints, credentials and operation bindings
remain host code. [Shared host contract](agentic-component-ui.md#shared-sdk-composition).

For standalone setup use the [component README](https://github.com/veyndo/automation)
and `examples/workspace.mjs`. Repository access is currently private.

## Keep checkout independent of the preview service

Core runs the pinned evaluator in-process. The separate service can preview a rule for
another application or an agent using supplied facts. Core reads its own
current cart, checks whether a discount applies and owns the transaction and
its resulting event. The Flow worker uses that committed event and runs
actions with its current authorization.

In the local integration test, both preview paths returned the same
decisions for an eligible and an ineligible cart. The previews left no
order, coupon redemption or Flow job. The test then stopped the separate
service. Core applied the €1.01 coupon to the eligible cart and completed
one order, one stock decrement, one coupon redemption and one invoice.
The repeated order request returned the original order. The independent
service was restarted and continued evaluating rules with the same registry.

In a local loopback comparison of two development builds, 192 HTTP previews
per build completed with identical results. The 95th percentile went from
7.83 ms to 0.68 ms after caching the fingerprint. This measures the
supplied-fact preview with synthetic identity, separate from hosted capacity
and checkout latency.

## Flow graph contract

The public `veyndo-flow-graph` Rust crate validates how the nodes of a Flow
connect. Core calls it when saving the Flow and when a worker starts or
resumes it. Both use the same node limit and reject duplicate IDs, missing
successors, cycles and unreachable nodes. The worker uses the resulting
index to find the next step by ID instead of scanning the whole graph at
each step. The saved JSON format and existing Flow cursors still work.

The host supplies condition and action validation. Core still resolves
current actor rights and installed actions, persists delays and handles
side effects and replay. The crate has no database, provider or HTTP client.
External Rust hosts can use the graph validator directly.
[Crate README and example](https://github.com/veyndo/veyndo/tree/main/crates/flow-graph).

In a local optimized Rust comparison, validating and walking a chain of
100 nodes took a median of 12.6 microseconds with the index, compared with
38.5 microseconds with repeated scans. Each median came from 21 batches
of 2,000 runs. The comparison covers graph work only.

## Check a Flow draft before saving

In Studio, open **Rules & Flows**, select **Event flows**, and choose **Check draft**.
Core checks the graph, its rule references, installed app actions, current actor
rights and the expected revision. The editor keeps the draft open so you can
correct it, then save it explicitly.

Send the same Flow definition from a server using
`POST /api/automation/flows/{id}/validate` with `{revision, data}`,
or use `automation.validate_flow` in MCP. For a new Flow, use revision 0. For an existing
Flow, use its current revision. Use the shop's main content language for the
Flow name.

```js
const result = await client.tool("automation.validate_flow", {
  id: "confirm_purchase",
  revision: 0,
  data: flowDraft,
});
// { valid: true, saved: false, revision: 0 }
```

Use a current `automation.manage` grant plus the rights required by each action.
If the route or MCP tool is unavailable on an older Core, report that the
check is unsupported. Calling the save operation as a fallback can write
a Flow.
Core reads a consistent shop snapshot. The check creates no saved configuration,
job or event. Saving is a separate request and checks the current dependencies
and revision again. A revision conflict means you need to reload and reconcile
the draft. The independent preview service continues to evaluate supplied facts
without a native shop write.

## Built-in Flow catalog

The graph crate also exposes the built-in trigger and action names. Core
uses those names when saving and matching flows. The same catalog is
available over `GET /api/automation/catalog` and `automation.catalog` in MCP.
Version 1 preserves the existing ordered arrays of 50 triggers and 20
pipeline actions. Core rejects an unsupported action in a queued Flow
and records the failure.

The isolated test used the new Core with the independent preview process.
Both returned the same rule decisions on real cart inputs. After stopping
the preview process, Core applied the eligible coupon, purchased the cart
and generated one invoice. Repeating the request returned the same order.

`flowCatalogVersion` identifies the built-in names. Use the authenticated
shop response for installed app metadata and let Core check each write
against current permissions. The version is discovery metadata. Saved
Flow definitions keep their existing format. Increment the version when
built-in identifiers change and preserve the names already in use.
[Rust crate and example](https://github.com/veyndo/veyndo/tree/main/crates/flow-graph).

## Durable Flow job storage

Core's [Flow job adapter](https://github.com/veyndo/veyndo/blob/main/src/marketing/flow_jobs.rs)
owns claiming, renewing, saving progress, deferring and finishing a job in
PostgreSQL. It claims one ready job and returns its cursor and checkpoint
in one statement. Each later update is scoped to the same shop, job and
attempt. An older worker cannot replace a newer attempt's checkpoint or
result. A delay saves its deadline and releases the claim. The worker
finishes a final delay only after the next claim and a current access check.

Existing queued jobs, step receipts and effect keys keep their format.
An expired running attempt still becomes uncertain. Recovery of external
effects follows the current provider and step receipt contracts. Core
keeps the action handlers and authorization close to the commerce owners.
The checkout transaction has no dependency on the preview service or
on Flow worker availability.

Two local Core workers shared one isolated PostgreSQL test database.
Six concurrent purchases and their replays produced six orders, six
stock decrements and six invoices. Every Flow ran its delay and resumed
once. With those purchases in flight, 96 catalog reads completed without
errors. The median was 40.4 ms and the 95th percentile was 75.7 ms in
this local debug build with four catalog clients and four purchase clients.
The current [public status](status.md) records the separate hosted checks.

## Portable Flow directives

The public Rust crate resolves a validated node to a branch, effect, delay
or stop. The same outgoing edges are used to validate the definition and
continue the job. The native worker borrows the step and its configuration
from the saved job definition. An unknown cursor fails the job before
another action can run. Delays carry a duration and the database stores
the resulting deadline. Core still supplies the rule result, checks current
rights and owns every effect and receipt.

The existing Core image can split HTTP (`PROCESS_ROLE=http`), event delivery
(`PROCESS_ROLE=memory-worker`) and app and Flow execution
(`PROCESS_ROLE=app-worker`). The processes use the same shop database and
the existing Core access controls. The app worker has no public HTTP listener.
In the isolated service test, a simulated order queued its Flow. The worker
stopped during a delay. The shop kept serving reads and returned the original
order on retry. After restart, the worker continued from the saved definition
despite an edit to the merchant's current Flow, and created one invoice.
[Crate example](https://github.com/veyndo/veyndo/tree/main/crates/flow-graph).

A second isolated run placed six new orders with the app worker offline.
All six exact replays returned their original orders. After the worker
started, it produced one invoice per order. With four concurrent buyers
and four catalog clients, 96 catalog reads completed without errors.
The median was 22.5 ms and the 95th percentile was 55.4 ms in that local
debug build. This measures the test environment with split HTTP and workers.

## Move the app worker out of Core

Keep Core on `PROCESS_ROLE=all`. The default is `APP_WORKER_ENABLED=true`.
To move Flow execution, app scheduling and app deliveries together, use
the same Core image in a separate private deployment with
`PROCESS_ROLE=app-worker` and leave `APP_WORKER_ENABLED` unset there.
This process has no public HTTP listener. Core retains checkout, order
events, payment reconciliation and the other background tasks.

1. Prepare the new deployment stopped. Use `BOOTSTRAP_MODE=serve` and the
   existing restricted system and tenant runtime connections with signed
   database scopes. Exclude migration credentials. Reserve connections for
   both deployments under the shared fleet budget. The signed scope setup
   uses a combined pool of at least four connections per process. Allow at
   least 30 seconds for process termination. Keep the worker's ports closed
   and use process and queue checks. When running it directly with Docker,
   pass `--no-healthcheck` to disable the image's HTTP probe for this role.
   [Database access](authenticated-database-scope.md) ·
   [Connection budget](production-architecture.md).
2. Start the private worker on the same compatible image and verify its
   process role, database access and queue sample before changing Core.
   Use the existing exact origin allowlist for private connector targets.
   Brief overlap uses the shared PostgreSQL claims and checkpoints. Set
   `APP_WORKER_ENABLED=false` on Core and deploy it. Confirm the old Core
   instance exits and the new process reports that app work is disabled.
   On shutdown the app tasks stop taking new work and have up to 15 seconds
   to finish current operations. PostgreSQL retains claims, checkpoints and
   delivery state for recovery if a task is interrupted.
3. Place a test order and check its actual Flow and receipt. Check pending
   job age, worker memory and concurrent shop latency. To return app work
   to Core without a planned gap, restore `APP_WORKER_ENABLED=true` and
   verify Core's app lane before stopping the dedicated worker. Orders and
   durable jobs stay in the same database throughout.

The isolated handoff test placed an order with Core's app lane disabled.
A separate worker processed the queued event and finished the Flow after
a restart. During rollback, a second order queued work that the combined
Core then completed. Both orders and the original invoice remained
available. The test used separate restricted system and tenant database
roles with signed scope enforcement.

In a local comparison, each configuration handled six purchases and exact
replays while four catalog clients made 96 reads. Both produced six orders,
six stock decrements and six invoices without a catalog error. Median and
95th percentile catalog response times were 36.5 and 69.3 ms with combined
Core, and 22.7 and 61.5 ms with a dedicated app worker. These timings apply to
this debug build and isolated test database.

## Read the worker queue logs

Search the active app process logs for `app_worker_queue_sample` at the
Info level. The
first sample follows startup. The worker samples again every minute, using
one read through its existing database pool. The query checks the oldest
due queued Flow and app delivery with the existing ready indexes.

Each queue has a `*_due` flag and a `*_oldest_seconds` age. A false flag
means there is no due queued row. A true flag with zero seconds means a
row has just become due. Intentional future delays and retry backoff
enter the sample when they become due. The sample can include queued
work for a paused shop or inactive app. It excludes jobs already running
and terminal history. A growing age calls for checking the queue and
the worker logs. A failed read emits `app_worker_queue_unavailable`.

These are aggregate signals for operators with access to process logs.
The worker does not include tenant, job, order, app or credential data
in the sample. Checkout never waits for it. Verify a specific order
through the saved Flow result, app delivery receipt and any expected
invoice. A healthy sample cannot establish that result.

## Remaining Automation work

Northflank now runs the app worker separately from Core. The public demo
purchase and queue diagnostics were checked after cutover. Reading the
saved trace of a hosted test order requires current merchant access.
Independent Flow authoring, event delivery and scheduler extraction remain
open under AUTO-02/03.
[Live cutover](status.md#live-flow-draft-check-and-separate-app-worker-9-november-2026).
[Current task list](commerce-components.md#automation-and-connectors),
[acceptance evidence](evidence/automation-component-2026-11-06.md).
