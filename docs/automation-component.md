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

## Remaining Automation work

Durable Flow execution, Flow authoring UI, event delivery/checkpoints and scheduler
extraction remain AUTO-02/03. They use this same rule library when moved. The
component plan keeps these separate from completed deterministic rule extraction.
[Current task list](commerce-components.md#automation-and-connectors),
[acceptance evidence](evidence/automation-component-2026-11-06.md).
