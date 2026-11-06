# Shared service and workspace composition, 6 November 2026

## Delivered source

SDK 0.3.0, source `f18c9bc74695ec1485478f75057f437aefb5ad36`,
[SDK PR 3](https://github.com/veyndo/sdk/pull/3), supplies shared layout admission
and independent service read bindings. The native frontend pins that exact source.
`GeneratedWorkspace.tsx` uses the shared registry after original domain/criteria/
PII admission; approved OpenUI nodes still resolve only to existing local native
components. No new commerce or permission implementation is added.

## Observed checks

- 18 SDK transport/host/composition tests pass locally and on GitHub Node 22/24.
  Composition wire tests use two actual independent MCP HTTP fixtures with separate
  credentials and routing. Fixtures do not prove every domain service.
- Hostile/unknown views, injected URLs/code/authority, incompatible versions,
  duplicate panels, oversized inputs and prototype keys reject.
- Missing annotations, destructive tools, ambiguous/incomplete discovery and
  service failures do not become automatic read views. Server admission remains
  authoritative for current rights.
- Context/discovery races abort requests and discard stale replies; scope changes
  require fresh clients. Revocation removes views and actual service errors propagate
  without automatic retry.
- Native workspace composition, copilot and role frontend tests pass: 10 tests.
  Products preserve read/write intake distinction; orders retain required PII.
- SDK TypeScript positive/negative controls and package/syntax/provenance checks pass.

This is not acceptance of a universal renderer, protocol adapters, agent-generated
cross-service business writes or the complete modular product. Those remain explicit
component-plan work. It adds no provider configuration and performs no real payment.
