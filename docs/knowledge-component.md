# Use Veyndo Knowledge from another application

Store a product description, a returns policy or a manual. Search for the
relevant passage and verify it again before using it in a decision. Each result
includes the source ID, revision, language, digest and exact passage. Editing
or withdrawing the source invalidates earlier evidence.

The independent Rust service uses its own PostgreSQL database. The migration
owner installs the schema. The runtime uses a restricted database login and a
fixed OAuth introspection endpoint. Current token scopes supply the shop and
the operation grants. [Setup and examples for repository members](https://github.com/veyndo/knowledge).

## Check readiness before routing traffic

Run the service on a private listener and use `GET /health` for liveness
and `GET /ready` for readiness. Readiness returns 204 after a transaction
accepts the configured signed scope through the restricted database login.
The transaction rolls back without reading or changing shop data. A database
failure returns 503 while liveness stays available. Startup also requires
the signed transaction to succeed.

Before sending catalog events, make an authenticated source request with the
test shop's token and check that a token for another shop cannot read that
source. Then run a real catalog edit through the installed app, restart
Knowledge and verify that the new passage is current. The readiness endpoint
checks storage. These authenticated checks cover the identity and catalog
connections.

## Read and verify evidence

| Operation | HTTP | MCP |
| --- | --- | --- |
| List private document sources | `POST /v1/documents/list` | `knowledge.documents.list` |
| Save a private document | `POST /v1/documents/put` | `knowledge.documents.put` |
| Search for a passage | `POST /v1/documents/search` | `knowledge.documents.search` |
| Verify the passage | `POST /v1/documents/current` | `knowledge.documents.current` |
| Follow document links | `POST /v1/documents/graph` | `knowledge.documents.graph` |
| Withdraw a document | `POST /v1/documents/withdraw` | `knowledge.documents.withdraw` |

The product operations use `/v1/products/*` and
`knowledge.products.*`. Give search clients the corresponding read scope and
importers a separate write scope. Create a source at revision zero. Later
changes and withdrawal require the current revision. Documents and products
can share the same external ID. The graph returns links only between current
sources in the authenticated shop.

## Import your own catalog and documents with the SDK

Use `@veyndo/sdk/knowledge` from Node to call the standalone HTTP API.
Your app supplies the service address, the expected tenant and a current
access token. The service rejects a token for another tenant. Use a read
token in the application that answers questions and a separate write token
in the importer.

```js
import { createKnowledgeClient } from '@veyndo/sdk/knowledge';

const knowledge = createKnowledgeClient({
  baseUrl: process.env.KNOWLEDGE_URL,
  expectedTenant: process.env.KNOWLEDGE_TENANT,
  token: () => process.env.KNOWLEDGE_ACCESS_TOKEN,
});

const evidence = await knowledge.documents.search({
  query: 'return policy', locale: 'en-GB', mainLocale: 'de-DE',
});
if (evidence.sources.length && (await knowledge.documents.current(evidence)).current) {
  console.log(evidence.sources[0].text);
}
```

The same client exposes `products`, including an optional exact product ID
on searches. TypeScript separates product and document evidence. For an
agent host that needs to discover operations, the service still provides
the same contract over MCP.

The runnable example accepts one JSON source per import. Set the ID to
your own SKU or document key. The first save uses revision zero. For an
update or withdrawal, read the current revision and pass it with the change.
The example also reads one inventory page and checks current evidence after
search. It was exercised with an external product and a private document
using the same ID, German translations, cursor pagination, separate read
and write credentials, withdrawal and revoked access against the standalone
service and PostgreSQL. [SDK installation and Node example](https://github.com/veyndo/sdk#use-standalone-knowledge).

## Audit which sources arrived

Knowledge service 0.5.0 can page through imported sources over HTTP and MCP.
Use `knowledge.products.list` for products and `knowledge.documents.list`
for private documents. Each operation needs its own read scope. The page
returns source IDs, revisions, titles, source languages, hashes and
withdrawal state. It uses the existing tenant and source index on schema 4.

```js
const page = await knowledge.products.list({ limit: 25 });
if (page.nextCursor) {
  const next = await knowledge.products.list({
    limit: 25,
    after: page.nextCursor,
  });
  console.log(next.sources.map(({ id, revision, withdrawn }) => ({ id, revision, withdrawn })));
}
```

Pass each returned cursor until it is null. A walk reads current metadata page
by page. A product update during the walk can be visible on a later request.
The inventory describes what the projection has received. It is not an event
history or an authoritative read of the Core catalog. Withdrawn sources stay
listed for reconciliation. Use search and evidence validation for the actual
passages. [SDK example](https://github.com/veyndo/sdk/blob/main/examples/knowledge.mjs).

## Restore Knowledge into a fresh database

The logical archive covers the two tables that hold source records and
localized chunks. It preserves revisions, relationships and withdrawals.
Install the same Knowledge schema into an empty destination with its own
restricted runtime login. The migration owners transfer the data with
PostgreSQL row security enabled. The destination keeps its own access
grants and signing key. Rebuild the lexical projection with
`veyndo-knowledge-service --print-rebuild` before starting the new runtime.

The PostgreSQL 17 rehearsal started Knowledge from the restored database
and compared its HTTP and MCP results with the original. A Polish product
passage, a private document, graph links and withdrawal records survived.
A token for another tenant was denied and the old database key could not
start the restored runtime. Core and the separate Knowledge service also
passed the local checkout and catalog delivery checks.

For a planned move, pause Knowledge writes before the final backup.
When recovering an older copy, keep it isolated until edits, withdrawals
and tenant removals since the backup are accounted for. Use point-in-time
recovery, a newer backup or an authoritative change record for withdrawals
recorded only in Knowledge. Core and the original documents can verify
source content. Keep affected sources and tenants out of service until you
can establish their current state. Keep the archive encrypted because it
contains private content.
[Operator commands for repository members](https://github.com/veyndo/knowledge#restore-knowledge-into-a-fresh-database).

## Verify source and model changes

The standalone service uses lexical retrieval. Its PostgreSQL acceptance
changes a private source, verifies that older evidence is rejected, withdraws
the source and checks that it stays withdrawn after restart. The restore test
rebuilds search from the source tables and verifies the result through HTTP
and MCP with fresh database credentials.

Core owns optional embeddings. A separate local run used PostgreSQL 17 and
Qdrant 1.16.3 with two deterministic models exposed by a local
OpenAI-compatible endpoint. Core indexed a catalog product and a document
under a three-dimensional model, then restarted with a five-dimensional
model. Both source types reached new Qdrant collections. Search reported
the new model, an edit invalidated the earlier excerpt, and a further
restart kept the current content. Archiving the document removed it from
merchant retrieval.

## Change the Core embedding model

First deploy Core with the existing model and the current
`EMBEDDING_MODEL_REVISION` on all workers. Existing installations start at
revision zero. For a model change, set the new `EMBEDDING_MODEL` and increase
`EMBEDDING_MODEL_REVISION`. To return to a previous model, set its model name
again with a higher revision. Use a distinct model name for different embedding
weights or dimensions.

Core records the highest accepted revision per shop and rebuilds it from
the existing source queue. Older workers stop claiming work for that shop.
A result that returns from an older provider call after the revision changed
cannot overwrite the newer projection. Catalog updates continue to queue and
search can use lexical results while the new vectors arrive.

The local PostgreSQL and Qdrant regression keeps both Core workers running,
reindexes 150 products, changes a product during the overlap and verifies
the new revision and working search. A second local run also exercised the
dimension change and both product and document projections. Provider and
Northflank rollout acceptance are tracked separately.

## Synchronize a Veyndo catalog

Install the [Knowledge catalog app](https://github.com/veyndo/veyndo/tree/main/extensions/apps/knowledge-catalog)
with its approved package digest. Configure the operator's service destination
and the installed shop's `knowledge.catalog.sync` credential. On Knowledge,
set the fixed Core origin and that shop's `products.read` callback credential
as described in the [service README](https://github.com/veyndo/knowledge#connect-a-veyndo-catalog).
Existing items can be refreshed through the app's private action.

Core sends a product ID on creation, edit or selected publication. The app
credential can read the catalog snapshot from its installed shop. The snapshot
contains the enabled translations and product links. An unavailable or
deactivated product is represented as inactive so a retry can withdraw old
evidence. The separate service owns its search records and does not receive
the Core database connection.

Read a synchronized product by its Knowledge source ID, which prefixes the
Core product ID with `veyndo:`. The product inventory returns this source ID.
Use it for product reads, search filters and graph requests. The Knowledge
revision tracks changes to the stored evidence.

### Use Core as the identity provider for one live shop

Set `KNOWLEDGE_IDENTITY_SHOP` on Core to the shop's internal tenant ID.
Configure a dedicated `KNOWLEDGE_INTROSPECTION_TOKEN` on both services and
point Knowledge's `KNOWLEDGE_INTROSPECTION_URL` to the Core endpoint
`/api/identity/knowledge/introspect` with audience `veyndo-knowledge`.
For the catalog app, approve the installed package digest and its private
Knowledge destination on Core. Store a current, expiring `products.read` key
for that installation in its encrypted `service` setting. Use a separate
app callback key in Knowledge's `KNOWLEDGE_CATALOG_CALLBACKS` for snapshot
reads from Core.

For evidence consumers, issue an expiring Core integration key with
`catalog.read` and `knowledge.read`. That grants `knowledge.products.read`.
Only the approved catalog app credential grants `knowledge.catalog.sync`.
Revoked keys lose access on the next request. Document access continues to
use its own scopes. Standalone deployments can use their own identity
provider as described in the service README.

## Rehearse a Knowledge outage on Northflank

The isolated Northflank rehearsal on 10 November ran Core
`e42fd0fc`, the private App Worker `687bbae8` and Knowledge `874534dd`.
The shop used synthetic data. Core and Knowledge had separate PostgreSQL 17
databases with restricted runtime roles.

The installed app imported product revision 1. While Knowledge was paused,
a product edit recorded a failed delivery and stayed queued for retry.
The native simulated purchase completed during that outage. Replaying its
confirmation returned the same order, stock fell from 40 to 39 once, and
the next cart was empty.

After Knowledge restarted, the worker delivered the queued event. A scoped
key read revision 2 and verified the current German evidence through HTTP
and MCP. A mismatched shop was rejected. Both transports rejected the
reader after revocation, and the two app credentials were revoked too.
The test services were paused afterward.

## Keep the shop running during a Knowledge outage

Core owns products, stock and orders. It records catalog changes and queues
delivery through the installed Knowledge app. The separate service reads the
current product through a scoped callback and updates its search projection
under a database lock for that shop and product. If an earlier refresh is still
running, the next request returns `503 catalog_sync_busy`. Core can retry the
notification. An old event always triggers a fresh read and cannot restore
withdrawn content after the withdrawal has been applied.

The local integration test stopped Knowledge, edited a product, and placed a
native order. Replaying the order returned the same ID and stock decreased
once. The queued product change reached Knowledge after restart, and the new
passage verified against the current source. A separate test held a first
import response open during withdrawal and replayed the original event.
The withdrawn product stayed out of search after the retry.

The independent projection uses lexical search and catches up asynchronously.
To repeat the local composition test, build Core and the independent Knowledge
binary. Set `DATABASE_URL` to a disposable local PostgreSQL database with a
test owner that can create a second database and restricted role. Set
`BASE_URL` to an unused `http://127.0.0.1:port` Core origin.
Set `KNOWLEDGE_REPOSITORY` to the component checkout and
`KNOWLEDGE_TEST_BINARY` to its built binary. Optionally set
`KNOWLEDGE_SDK_MODULE` to the SDK's JavaScript entry. Run
`python3 scripts/knowledge_catalog_integration.py`. The runner selects the
furniture fixture for the catalog edit and test purchase. Set
`KNOWLEDGE_TEST_NATIVE_AUTHORITY=1` to also test the actual Core identity
endpoint with the current Knowledge acceptance suite. That phase checks real
catalog delivery, evidence reads, foreign shop keys and revocation.

Hosted delivery, capacity and switching the product's knowledge consumers to
this service are tracked separately. [Implementation plan](commerce-components.md#knowledge-first-complete-standalone-ai-component).
