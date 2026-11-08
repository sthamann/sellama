# Use Veyndo Knowledge from another application

Store a product description, a returns policy or a manual. Search for the
relevant passage and verify it again before using it in a decision. Each result
includes the source ID, revision, language, digest and exact passage. Editing
or withdrawing the source invalidates earlier evidence.

The independent Rust service uses its own PostgreSQL database. The migration
owner installs the schema. The runtime uses a restricted database login and a
fixed OAuth introspection endpoint. Current token scopes supply the shop and
the operation grants. [Setup and examples for repository members](https://github.com/veyndo/knowledge).

## Read and verify evidence

| Operation | HTTP | MCP |
| --- | --- | --- |
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

```js
import { createClient } from '@veyndo/sdk';

const knowledge = createClient({
  baseUrl: process.env.KNOWLEDGE_URL,
  token: () => process.env.KNOWLEDGE_ACCESS_TOKEN,
});
await knowledge.initialize();
const { sources } = await knowledge.tool('knowledge.documents.search', {
  query: 'return policy', locale: 'de-DE', mainLocale: 'en-GB',
});
if (sources.length) {
  const { current } = await knowledge.tool('knowledge.documents.current', { sources });
  if (current) console.log(sources[0].text);
}
```

Run this in a backend with a current, shop scoped read token.
[SDK installation](https://github.com/veyndo/sdk).

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
Hosted delivery, capacity and switching the product's knowledge consumers to
this service are tracked separately. [Implementation plan](commerce-components.md#knowledge-first-complete-standalone-ai-component).
