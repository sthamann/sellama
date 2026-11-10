# Independent Automation acceptance, 6 November 2026

Source: private `veyndo/automation`, commit
`879fd2fb351fe289975068fccf320faf10eaafd9`, version 0.1.0.
Original algorithms come from Core `ba19977612d91733bb37f89b6d8bb5d22b558415`.
The source record lists original paths and exact kernel source hashes.

## Independently observed

- Standalone library: seven original behavior tests pass, including XOR, calendar,
  custom fields, selected lines, missing facts under NOT and comparison boundaries.
- Actual standalone Rust HTTP/MCP process: equal results/fingerprint, current OAuth
  checks, two tenant identities, exact scope/audience/expiry, revoked access, hostile
  origins, oversized requests, missing facts, malformed DTO and identity failures.
- Actual SDK 0.3.0 composition discovers and calls the running Rust rule service,
  returning the deterministic result through the common registered-view contract.
- Restart and fresh calls pass. No Core server, database or model runs are needed.
- Independent library/service formatting and all-target Clippy pass.
- Private repository component CI run `42253013226` passes.

## Native composition

The local composition branch linked the independent library behind the original
public facades and used the existing local kernel dependency. The released Core
still builds the evaluator from its own source tree. See the current
[Automation component guide](../automation-component.md) for deployment status.

The service evaluates supplied facts only. Native fact collection, actual rules/
prices, Flow writes and durable jobs retain their current authenticated owners.
The extracted rules retain original numeric comparison semantics. This change is
not a money-representation migration or arbitrary plugin-compatibility guarantee.
