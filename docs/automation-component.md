# Independent Automation component

The first Automation extraction contains the actual native deterministic rule
engine in `veyndo/automation`: registry, input validation, comparison, container,
calendar/time-zone, custom-field and selected-line evaluation. Native Veyndo
imports that same library through the existing `veyndo::automation_rules` and
`veyndo::rule_comparison` facades. Native rule configuration, trusted fact
collection, Flow execution, current actor checks, queues and events retain their
existing owners. No price or checkout writer moves into this service.

## Library and service

The Rust library depends on JSON/calendar support and the existing pinned pure
kernel library. It imports no Core server, SQL, provider or model runtime. The
native composition patches the kernel dependency to the actual reviewed local
kernel. Exact source pins and file hashes in `components.lock.json`, plus kernel
source hashes in component provenance, reject a drifting or duplicated policy
implementation. This retains the existing Lean policy boundary; moving the engine
does not prove its surrounding JSON, time, IO or complete rule catalog.

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

## Connect the service to Veyndo Core

Set `AUTOMATION_CORE_ORIGIN` to the Core HTTPS origin and leave the OAuth
introspection settings and allowed origins unset. In Studio, create an
integration key with only **View rules, actions and flows** (`automation.read`).
Use that key from a backend or trusted MCP host. The service checks the
current permissions at Core's `/api/auth/access` on every request. Personal
sessions, browser origins and keys with additional permissions are rejected.
The preview only uses facts submitted with the request.

Run the image with the repository root as build context, `service/Dockerfile`,
and HTTP port 8808. Use `GET /health` for liveness. This endpoint stays
independent of Core. Use a scoped key to verify authenticated readiness after
deployment. An isolated test with the real Core issued a key, exercised HTTP
and MCP, denied a broader key and verified that revocation took effect on the
next call. [Component README](https://github.com/veyndo/automation).

## Agent and host composition

The service advertises both operations as deterministic read tools. A trusted
host can bind the simulation to SDK 0.3.0's common workspace contract and compose
it with another component. The actual Rust process is tested through that SDK
path. Agents select registered views; endpoints, credentials and operation bindings
remain host code. [Shared host contract](agentic-component-ui.md#shared-sdk-composition).

For standalone setup use the [component README](https://github.com/veyndo/automation)
and `examples/workspace.mjs`. Repository access is currently private.

## Keep checkout independent of the preview service

Core links the evaluator directly. The separate service can preview a rule for
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

## Remaining Automation work

The job adapter is the first part of the execution boundary. A portable
runner, separately deployed execution, Flow authoring UI, event delivery
and scheduler extraction remain open under AUTO-02/03.
[Current task list](commerce-components.md#automation-and-connectors),
[acceptance evidence](evidence/automation-component-2026-11-06.md).
