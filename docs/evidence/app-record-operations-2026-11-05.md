# Shared app record operations: 5 November 2026

## Delivered

Apps [0.2.0](https://github.com/veyndo/apps/releases/tag/v0.2.0) extends the existing
independent Rust storage package with the shared native record mutation and query
owners. Component source `135caaffd82814c7f374cecad9ad30ad52100f44` is pinned with
exact file hashes in the complete product's `components.lock.json`. Original
native owner provenance is recorded in the component repository.

| Owner | Responsibility |
| --- | --- |
| Component `mutations.rs` | Scoped record lock, revision conflict, exact declared-field import replay, revision overflow rejection, record/event write and required host hook sequencing |
| Component `queries.rs` | Bounded keyset pages, exact typed shared-index equality and public status/channel/schedule SQL; every field name and value is bound |
| Native `data.rs` | Current package fence, field/reference/language and configured-price validation; declared index admission and final field projection |
| Native `record_write.rs` | Calls the shared engine with the real workflow and bounded-history hooks |
| Native `record_history.rs` | Current entity rights, actor attribution, retained history limits and restoration through the same writer |

The caller retains its scoped transaction and commits only after success. Any
storage or hook error must roll back the entire transaction. No pool, principal,
production schema, table-per-app scheme, alternate queue or commerce ledger was
added. The library is trusted host code; its storage keys do not authenticate a
request. MKT-03b remains open for complete model/identity extraction and standalone
service deployment.

## Independent PostgreSQL tests

The explicitly selected disposable PostgreSQL 17 database has no Veyndo Core or
identity/commerce tables. Its fixed minimum schema and audit table are fixtures,
not a supported standalone production schema. The component tests demonstrate:

- Two concurrent writes using the same revision admit one winner. A stale write
  reports the current revision and adds no event or history.
- Exact import replay preserves revision and event count; changed content conflicts.
  French content, an explicit Italian null and boolean values remain unchanged.
- A host workflow failure, a failing after-write history hook and an outbox insert
  failure roll back record, history and event state together.
- Equal IDs in other tenants/apps remain distinct; maximum revision exhaustion is
  rejected without integer overflow.
- Keyset pages stay within 1..100 rows and preserve stable cursors. String, integer
  and boolean indexed filters use exact JSON types. Hostile ID/filter/field-name
  bytes remain data, and absent scopes return no rows.
- Public queries exclude drafts, other channels and future schedules while allowing
  explicitly global content. Hosts still admit model indexes and filter returned
  fields before exposing data to users.

Local formatting, clippy and the real database test pass. The component's required
[PostgreSQL CI](https://github.com/veyndo/apps/actions/runs/42047644973) also passes.
The original record/job/idempotency/lease/quota tests remain part of that run.

## Integrated Veyndo checks

A fresh Core build and clippy pass with this exact package. The affected suites
use isolated synthetic tenants and the actual native PostgreSQL schema:

| Suite | Observed result |
| --- | --- |
| `app_shared_storage` | Shared-table identity, indexed values, unique-write races, projection denial and private preview cleanup pass. |
| `apps` | Typed API/MCP records, permissions, version conflicts, native cart effects, quotas, grants and private drafts pass. |
| `app_jobs` | Job leases, completion evidence and record CAS remain atomic; revoked creators and foreign identities are denied. |
| `app_schema` | Model conversions, failed-conversion rollback and recovery history preserve stored records and event consistency. |
| `app_core_extensions` | Product/customer/order/company extension projections, indexed filters, current rights and selected private publication pass. |
| `tenant_isolation` | All 43 checks pass, including composite references and the explicit restricted-role app RLS check. |
| `visual_workspace` | Native HTTP/MCP history/restore, public draft/channel/schedule filtering, selected release, private form answers, reviewed model/coding-agent apply and graphical app elements pass. |
| Marketplace provider fixture | Independent HTTP/MCP record/sync calls, native paid-order replay, once-only stock, Flow, localized order, invoice/PDF and service restart pass with local Amazon/eBay/Kaufland fixtures. |

The visual workspace fixture previously expected a local HTTP reference to reach
the model. The unchanged server URL owner rejects it. The test now asserts that
rejection and zero model calls, then tests a valid design request and uploaded
image normally. No URL protection was relaxed.

These are targeted local fixtures and component CI, not a new real-provider or
public browser purchase acceptance. The main local Core fixture uses a test
owner; its app RLS subtest explicitly checks a restricted role. Full daily Veyndo
coverage remains on the existing daily schedule.

## Next boundary

The native model compiler, identity/package admission, references, history,
configuration and deployment schema still need complete standalone adapters.
API/MCP/Flow in Veyndo already consume the shared record owner. A separately
operated authenticated app service is not yet delivered by this release.
