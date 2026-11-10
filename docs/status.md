# Veyndo: current status

For the whole-shop architecture, public repositories and independent
entry points, see [One shop, composable parts](one-shop-components.md).
The local Checkout comparison records equivalent quote results and catalog
availability across a Checkout restart. Hosted capacity remains a separate
test. [Measurement](evidence/checkout-composition-performance-2026-11-08.md).

Updated 10 November 2026. Start here for the public product, observed journeys and
remaining delivery work. Source code, passing tests and a successful public
journey are tracked separately. The 4 November PayPal journeys use the actual provider Sandbox; earlier purchases retain their stated simulation scope.

## Private Automation preview on Northflank

Core's build now links the rule library pinned to the private preview's source
revision. A local comparison found matching results in 440 HTTP cases and three
MCP calls. [Source ownership and checks](automation-component.md#library-and-service).

The independent Automation service runs privately alongside Core. It evaluates
supplied rule facts through HTTP and MCP. The deployed image passed the container
tests. In Northflank, health, OpenAPI and unauthorized access checks passed.
A one-day `automation.read` merchant key was created and revoked in Lumen.
The hosted authenticated comparison and rejection after revocation still
need evidence from both interfaces. [Deployment and acceptance](automation-component.md#private-northflank-pilot).

## Private Checkout live in the Lumen test shop

Northflank routes signed-in Lumen buyers using the demo payment through the
private Checkout service. The original Storyfront iframe created and confirmed
its session through the two same-origin Store API endpoints. Order
`RAC-694ba533` cost EUR 59.90. The original Storyfront bag was empty after
return and reload, and the demo lamp's stock moved from four to three.

A separate native Store API purchase returned the same order ID when its
confirmation was repeated. Stock moved from three to two. The completed API
cart retains its line items for the receipt.

The native browser and the original Storyfront iframe then each completed a
EUR 59.90 Shopware Payments purchase using the actual PayPal Sandbox. Both
used the private Checkout route. The native cart was empty on return, and the
Storyfront bag stayed empty after a full reload. Studio then refunded the
original native order `RAC-a31ce698` and Storyfront order `RAC-2e7cfc2a`.
Each EUR 59.90 refund showed a completed PayPal Sandbox provider record
and the original payment showed `refunded`.

The default order and capture Flows wrote internal notes for those two
orders. A separate live demo payment created order `RAC-7048dee8` and its
scoped order Flow generated invoice `INV-00000001` automatically. Repeating
confirmation returned the same order and the lamp's stock moved once, from
one to zero. Lumen has the Email Delivery app installed. It still needs a
configured sender and transport before the Connector receipt and delivery
to a reachable mailbox can be verified.
[Pilot setup and verification](checkout-component.md#hosted-lumen-pilot-10-november-2026). The
[ordered release checklist](commerce-components.md#release-acceptance-order)
tracks the remaining pilot, composition, hosted load and external integration checks.

## Independent Connector image live

Northflank runs Connector build `mint-meeting-7629` from the independent
`veyndo/connectors` repository at `fc36cad`. One instance passed its
checks with zero restarts. The deployed service retains the existing Core
profile and provider configuration. The dedicated Connector database was
exercised in the local composition below. A hosted order mail through the new
image still needs an authorized test shop and a receipt from the provider.
[Connector deployment and verification](connector-component.md).

In a local run, the same order passed through private Checkout, Core, the
separate app worker and the independent Connector. The client discarded the
first confirmation body and recovered the order after a Checkout restart.
Core showed one stock decrement and one invoice, and the SMTP fixture
received one mail with that order number.
[Reproduce the composed journey](connector-component.md#verify-the-complete-shop).

A separate local run followed a Shopware Payments fixture purchase through
the same services. Verified capture triggered the invoice and order mail.
The Connector receipt matched the message ID received by SMTP. The refund
and its replay preserved the original order and payment attempt. The
[hosted Lumen checks](#private-checkout-live-in-the-lumen-test-shop) cover
both Sandbox refunds and an automatic invoice after a separate demo payment.
Provider acceptance and arrival of the hosted order mail are still open.

## Pinned purchase recovery rehearsal

Fresh builds of Core, Checkout and Connector started on a disposable
PostgreSQL cluster with the independent app worker. One order survived a
discarded confirmation and Checkout restart. While independent confirmation
and the worker were paused, the native route accepted a distinct second order.
The worker restart generated its invoice and SMTP fixture mail. Re-enabling
Checkout and retrying the first confirmation preserved both orders and stock
effects. A separate payment fixture also passed capture, invoice, mail and
refund. A separate Northflank job reproduced these tests with the
checksummed executables from the running Core, worker, Checkout and Connector.
It completed 48 purchases per route with one invoice and one loopback SMTP
message per order. Purchase p95 was 430.84 ms native and 3195.01 ms independent,
including 27 retries across 11 independent orders. A full boot from pinned
OCI images and the provider callback load check remain open.
[Source pins, schema fingerprints and hosted results](evidence/composed-release-rehearsal-2026-11-10.md#northflank-rehearsal-with-deployed-executables).

The active Northflank deployments for Core, the app worker, Checkout,
Knowledge, Connector, Payments and Automation now have recorded image
manifest digests. The original Core and App Worker builds then ran as
separate containers in the private Northflank release lab. Core booted
against empty PostgreSQL. Two simulated native purchases each preserved
one order and one stock decrement after a confirmation retry. The Worker
generated one invoice per order, including after a stop and restart. A second
fresh database run enforced distinct restricted system and tenant roles.
Startup rejected a runtime role with `TRUNCATE`, and the isolated shops
could not read each other's orders or receipts. Independent Checkout and
Connector image wiring still need a separate run.
[Hosted image boot with restricted roles](evidence/composed-release-rehearsal-2026-11-10.md#run-the-original-images-with-restricted-database-roles).
[Image evidence and next checks](evidence/composed-release-rehearsal-2026-11-10.md#match-the-deployed-builds-to-image-manifests).

## Mixed shop traffic and app-worker recovery

An isolated local Core with 200,000 synthetic products accepted 48 simulated
purchases while serving catalog and agent requests. Core committed an order
while the private app worker was stopped. After restart, every order had one
invoice and one SMTP delivery through the independent Connector. Purchase
retries returned the original order IDs and stock moved once per order.
[Reproduce the test and see the timings](benchmarks.md#mixed-shop-traffic-and-worker-restart).

The same local load also passed through independent Checkout. All 48 orders
had one stock decrement, one invoice and one mail. Eight confirmations
needed the server's retry interval. Checkout p95 was 10.05 seconds with
those waits, compared with 51.77 ms on the native route in the paired run.
[Independent Checkout load](benchmarks.md#run-the-same-load-through-independent-checkout).

The local follow-up reduced the retry interval for independent Checkout
admission from five seconds to one. Confirmation p95 fell to 2.04 seconds in
the same workload, with one order, stock decrement, invoice and SMTP delivery
per cart. [Follow-up measurement](benchmarks.md#shorter-wait-after-a-refused-checkout-request).

The bounded relay queue and explicit lease handoff reduced local independent
confirmation p95 from 2,047.84 ms to 129.65 ms in a matched 48-order test.
All 48 purchases completed without a retry. Median latency went from 41.62 ms
to 107.22 ms. Each purchase still produced one order, stock decrement, invoice
and loopback SMTP delivery. [Comparison and scope](benchmarks.md#absorb-a-short-burst-before-refusing-a-relay-request).
Core `9ed1c0bb` is live on Northflank. The isolated comparison using
the running Linux executables reduced independent confirmation p95 from
4,078.00 ms to 1,717.01 ms and retries from 30 to 9. The native control
completed at 298.18 ms p95 with zero retries. All three runs produced one
order, stock decrement, invoice and loopback SMTP message per purchase.
[Hosted versions, method and results](evidence/composed-release-rehearsal-2026-11-10.md#hosted-relay-admission-comparison).

## Knowledge source inventory

The independent Knowledge service 0.5.0 can list imported products and private
documents with their source revisions and withdrawal state. HTTP, MCP and the
JavaScript example use the same scoped operation. The existing database index
serves the pages. Core catalog and checkout do not call this inventory.
In the local composition, a native purchase completed while Knowledge was
stopped. The queued product update was delivered after restart and the
inventory showed the recovered revision.
[API and example](knowledge-component.md#audit-which-sources-arrived).

The local Knowledge acceptance rejected a wrong database signing key at
startup. While PostgreSQL refused connections, readiness returned 503 and
liveness stayed up. Readiness recovered once the database accepted
connections again, with the same service process.
[Readiness and authenticated rollout checks](knowledge-component.md#check-readiness-before-routing-traffic).

A local run also used Core's current integration and app keys for a single
live shop. A catalog edit reached the independent Knowledge database and
the read key returned current evidence. Both revoked keys and keys from a
different shop were denied. A withdrawal rejected after revocation stayed
queued, and the next delivery after key rotation removed it from search.

The initial Core identity rollout used Northflank build `fast-winter-7173`
at `d3a2042`. That instance
passed its readiness check with zero restarts. All 48 public health samples
succeeded during rollout. Afterward, the native demo and Storyfront loaded,
and an isolated demo cart passed quote, change, replay rejection and cleanup.
Across 12 requests each, median client times were 30 ms for Core health,
72 ms for the native demo and 65 ms for the Lumen Storyfront landing page.
Capacity testing uses a separate load run.
One private Knowledge replica is running on Northflank with its own PostgreSQL
database, a restricted login and enforced row security. Through a private
tunnel, liveness and database readiness returned 204, OpenAPI returned 200
and an unauthenticated source request returned 401. Core and the app worker
have the same pinned private catalog app destination. Core's identity
endpoint is scoped to Lumen. The running Knowledge service reached the
broker and rejected an unknown token. The installed Lumen catalog app has
separate short-lived keys for event delivery and for reading current product
content from Core. Both the Core callback and the private Knowledge refresh
returned HTTP 200. Studio recorded first-attempt delivery of two live
`product.updated` events (`#926` and `#927`) for the demo lamp, including
the restoration of its original description at product version 28. Reading
that revision back with a separate evidence-consumer key remains open.
[Core identity setup](knowledge-component.md#use-core-as-the-identity-provider-for-one-live-shop).

## Knowledge database recovery

The standalone PostgreSQL 17 acceptance restored a source archive into a
fresh database with a separate runtime login and signing key. The test rebuilt
lexical search, compared localized evidence and graphs, checked withdrawals
and denied the old key and a foreign tenant. This was a local recovery test.
[Recovery procedure](knowledge-component.md#restore-knowledge-into-a-fresh-database).

## App cards during replies in Studio and the shop

In a local Chrome test with Core, PostgreSQL and a controlled model response,
Studio showed the private merchandising card before the final answer. The
merchant filtered the card and prepared an editable follow-up while the
model was waiting. The same frame and filter remained when the answer arrived.
The original actor could see the progress. Another administrator in the same
shop and an unrelated shop
could not access the run. The status contained only the card reference and
tool arguments. The browser made one initial app read through the current
MCP permissions. [Studio progress](agentic-component-ui.md#show-the-merchants-app-view-during-the-answer).

In a local Chromium test with Core and PostgreSQL, the assistant's final
response waited for the test to release it. The shopper could see and
filter the Product Guide before that release. The filter and iframe stayed
in place when the text arrived. With one inference slot per shop, a second
assistant request received HTTP 429 while the existing app filter still
worked. The same API returned JSON when the client asked for it.
[Shopper stream](agentic-component-ui.md#show-the-shoppers-app-view-during-the-answer).

## External SDK example with an MCP App and Checkout

[Connected Shop](https://github.com/veyndo/sdk/tree/0870b2d3510a3274272dc756a1de50c5fa4b00df/examples/connected-shop) is available from the public SDK repository.
The example runs an external Node host with SDK 0.4.0, the Core catalog,
the installed Product Guide MCP App and independent Checkout. A fixed
question opens the guide without requiring a model key. The browser can
filter its public records and explicitly confirm the reviewed simulated order.

On desktop and mobile, Core recorded one order and one stock decrement
per purchase. The mobile run dropped the successful Core confirmation
response before it reached the example. The host read back the original
receipt, and reload preserved it. The same test rejected a different
product requested by the iframe and an unrelated origin on confirmation.
[Setup and test scope](checkout-component.md#combine-checkout-and-an-installed-mcp-app).

## MCP App conversation views and independent Checkout rehearsal

Core image `gorgeous-seat-2912` from
[`bb95542`](https://github.com/veyndo/veyndo/commit/bb955422ccd34b73dc943fd4ffc6f1a7eb076042)
is live on Northflank. The workflow built that commit, created the PostgreSQL
snapshot, ran `vendune-migrate` successfully and started the new Core. The Git
trigger now follows `veyndo/veyndo` on `main`.

The public app view served the new filter control. In an isolated cart in the
public demo shop, preview returned a price and delivery date and left the cart
empty. The single external probe measured 85 ms for preview and 103 ms for
confirmation. Confirmation added one unit. Changed quantity and a replay of the same
revision each returned HTTP 409. The test then emptied its cart. The
[Nord Atelier SDK excerpt](https://github.com/veyndo/sdk/blob/main/docs/nord-atelier.md)
also ran against the public demo. These checks did not install an app in a
hosted shop or apply a merchant proposal there.

The next app interaction was verified in local Chrome with Core, PostgreSQL
and a simulated model endpoint. The storefront and Studio each carried an
applied filter into an existing editable draft. Both sent it only on the
next explicit submission. A forged frame message with extra content was
rejected in both views. [Chat context](agentic-component-ui.md#use-a-filter-in-the-next-message).

The first MCP App rollout used Core image `alleged-degree-4325` from
[`e133b155`](https://github.com/veyndo/veyndo/commit/e133b15573c5ea3e1c4df991750c08ba70bc8d53)
on Northflank. The instance passed readiness with zero restarts.
Studio, the native demo and the Storyfront demo returned HTTP 200. The public
demo shop negotiated MCP Apps with a compatible client. A text-only client
received the ordinary MCP capabilities and a request for an unknown view was
rejected.

The Product Guide 0.1.1 follow-up adds an app-declared filter in the
conversation. The isolated Core and PostgreSQL test exercised the public and
private reads, retained the original product filter, and rejected unauthorized
actors. In Chrome, the mobile storefront and desktop Studio each filtered and
reset their own app result.

The local follow-up exercised native actions in both chats. A shopper selected
a product variant, reviewed the server-calculated price and delivery, and added
the variant once. A merchant opened an app-linked stock proposal, compared 80
with 79, approved it, and read back 79. The PostgreSQL fixtures rejected a
changed price, a replayed cart revision and approval by another administrator.
[Interaction contract](agentic-component-ui.md#review-and-act-in-the-veyndo-chat).

An installed app can show its own table or expandable cards inside a Studio or
native storefront answer. In the isolated browser run, the frame loaded the
next page of records. The HTTP and PostgreSQL fixture checked both assistant
paths with a synthetic model and rejected foreign-shop, private-scope and
deactivated-package requests. The public protocol check did not install an app
in a hosted shop. [Package guide](agentic-component-ui.md#app-owned-views-in-the-conversation).

The local Checkout composition recovered a simulated purchase when the native
host's response was dropped after commit. It returned the original receipt after
restart and observed one order and one stock allocation. Under four quote
workers and four concurrent catalogue readers, 192 requests per quote path
had zero errors and p95 of 13.1 ms direct versus 13.6 ms composed. The catalogue
and native quote stayed available with Checkout stopped. These are local
fixture measurements. The [opt-in browser route](https://github.com/veyndo/veyndo/pull/371)
is merged. Desktop and mobile Chromium used it with a signed-in buyer and
simulated payment. Recovery preserved the receipt and the empty cart after
reload. The local Storyfront checkout also signed in inside the iframe, placed
the order through Checkout and kept the originating bag empty after return and
reload. When the confirmation response and iframe message were both lost, two
transport attempts resolved to one receipt, one stock decrement and one
`order.placed` event.

The new same-origin route passed locally in desktop and mobile Chromium,
using the real Core and Checkout processes and separate databases. The
native storefront and embedded Storyfront controller recovered the original
receipt when confirmation was lost. Both showed an empty bag after reload,
with one order, one stock decrement and one `order.placed` event per
purchase. The local Storyfront fixture also
discarded the iframe completion message. Checkout kept its private listener.
The relay uses separate request capacity so waiting requests leave room for
Commerce callbacks. An isolated PostgreSQL check filled all four shop relay
slots. The next relay request returned HTTP 429 while the native cart still
responded. Local PayPal provider responses also exercised approval, capture
and full refund on the original payment attempt in both browser journeys.
[Configuration and verification](checkout-component.md#route-a-test-shop-through-private-checkout).

Northflank runs Checkout image `puffy-soup-2325` from `eaa34f2` with one
ready private replica and zero restarts at verification. Its separate database
enforces row-level access. The restricted login authenticated and could not
read the database signing key. The temporary administrator connection was
removed from the maintenance job after installation. Public shops still use
the existing Core checkout. Hosted native and Storyfront purchases, provider
payment and refund through the independent service remain open. The earlier Core image
`max-tendency-8164` from [`6edb6a8`](https://github.com/veyndo/veyndo/commit/6edb6a8aaf04e21282207059f286680f43e05408)
rolled out with one ready replica and zero restarts. The browser switch remains off.
[Checkout verification and rollout](checkout-component.md#storyfront-composition-and-hosted-rollout).

Experience image `guided-eggs-5114` from `465f0a9` now serves original
Storyfront `a57ed0e` on Northflank. In the public Lumen test shop, closing and
reopening checkout kept the demo product in the bag. The simulated purchase
`RAC-2d6858a4` for EUR 59.90 returned to the Experience and the bag stayed
empty after reload. A second simulated purchase, `RAC-e2a6e476`, recovered
after the browser deliberately dropped the completion message. It made one
order request and left an empty bag after reload. Both purchases used the
existing Core checkout.
[Public Storyfront acceptance](checkout-component.md#storyfront-composition-and-hosted-rollout).

The local PayPal Sandbox composition exercised the built-in PayPal adapter
and the installed Shopware Payments adapter using synthetic provider responses.
It recovered the original attempt after a lost confirmation, verified provider
approval and reconciled capture and refund on that attempt. A switch to Live
after the quote left order, stock and payment job state unchanged.
The local browser run also verified provider-frame approval, full refund and
an empty bag after reload in native Veyndo and Storyfront. Closing Storyfront
while payment was pending preserved the bag and reopened the original order.
The [hosted Lumen pilot](#private-checkout-live-in-the-lumen-test-shop) later verified Sandbox capture in both browser entry points.
[PayPal Sandbox setup and local test](checkout-component.md#paypal-sandbox-through-the-separate-service).

## Orders and shipping in agentic workspaces, 9 November 2026

The initial Orders workspace release used Northflank image `pure-knowledge-5648` from
[`cb66af0`](https://github.com/veyndo/veyndo/commit/cb66af0b7b0d9719c49fa204d3ba631957329618).
The new instance passed readiness with zero restarts and the previous instance
terminated. Public Studio and the demo shop served the new frontend assets.
A public assistant request opened the comparison for two catalog products with
59.90 EUR and 24.90 EUR prices. Its product link opened the native detail page.
A separate disposable basket added one item, returned a server total and was
cleared. Anonymous access to private Knowledge remained denied.

Studio can render a reviewed Orders view with current shipping policy using
OpenUI and native domain permissions. An independent example pairs Commerce
and Knowledge using scoped SDK reads. Local service tests exercised a real
test order and policy, including revocation and a foreign Knowledge identity.
The storefront compares catalog products and opens the native product page
for configuration and purchase. The adapter and hosted acceptance matrix
remains tracked in [Agentic interfaces](agentic-component-ui.md).

## Commerce host ports for independent Checkout, 9 November 2026

Core now supplies quote, simulated confirmation and receipt recovery from
its existing Commerce transaction. The native storefront and Storyfront
still reach Commerce directly. The independent Checkout service uses one
host request per operation and keeps only its session metadata in its own
database.

The independent service has also passed a local purchase using the native
HttpOnly buyer login. Core issued a five-minute Checkout grant and rechecked
the underlying session on every use. The two Rust services used separate
PostgreSQL databases, with enforced system and tenant roles for Core and a
restricted runtime role for Checkout. Replaying confirmation kept one order and one stock
decrement. The grant stopped working at logout, and a fresh login recovered
the same receipt. [Buyer identity setup](checkout-component.md#bind-checkout-to-a-native-buyer-login).

The native storefront's existing checkout now has a local opt-in path to the
separate service for signed-in simulated purchases. Chromium exercised the
actual shop on desktop and mobile. The mobile run recovered the original
receipt after the confirmation response was dropped. Both runs showed an
empty bag on return and exactly one stock decrement.

That rollout used Northflank image `wiry-spirit-4983` on Core and the private
app worker. It was built from `7ce9217c`, with the same source tree as merged
release `f8cdece8`.
Core passed readiness with one replica and zero restarts. The private app
worker started with its dedicated role and sampled its queues.

| Public simulated journey after rollout | Observed result |
| --- | --- |
| Core host API | `RAC-4c01a1f4`, 59.90 EUR, one stock decrement and the same receipt on replay and recovery. |
| Native storefront | `RAC-f34fe74a`, 59.90 EUR, empty cart after return and reload. |
| Embedded Storyfront | `RAC-8991a90e`, 59.90 EUR, empty bag after return and reload. |

Twenty public host quotes measured 84.1 ms at p95. The API confirmation
took 116.4 ms and the receipt read took 40.9 ms. The Chrome confirmations
took 301 ms in the native storefront and 373 ms inside Storyfront. These
are client observations on demo shops, with one purchase per path.
The Storyfront run used keyboard activation to add the product because
pointer clicks did not add it at the tested viewport.

Local PostgreSQL acceptance combined both Rust processes with HTTP, MCP and
the JavaScript SDK. A lost confirmation response recovered the original
order after restarting Checkout. The company buyer test exercised current
membership, approval and budgets, the resulting Flow and the invoice.

With concurrent catalog reads, 192 local quotes per path finished without
errors in each of two runs. The first run shared the machine with other
verification. In the isolated rerun, native and composed quote p95 were
76.5 ms and 88.1 ms, and catalog p95 was 21.6 ms and 23.2 ms. Core still
returned quotes and catalog results while Checkout was stopped. These
measurements use debug builds and a loopback proxy. The separately hosted
Checkout process and configured provider acceptance remain open.
[Commerce host ports](checkout-component.md#commerce-host-ports-in-core).

## Native and embedded checkout compatibility, 9 November 2026

Two public demo purchases on the current Core used the simulated payment
method. The native storefront confirmed `RAC-703fe454` and Storyfront
confirmed `RAC-ca1fb71a` inside its embedded checkout. Each showed the
German product name and €59.90 total. The originating cart stayed empty
after returning and reloading in both cases.

| Public Chrome observation | Time |
| --- | ---: |
| Storyfront checkout click to visible contact form | 1,005 ms |
| Storyfront final submit to visible confirmation | 398 ms |
| Native final submit to visible confirmation | 248 ms |

Each row is one browser observation, including the test interaction overhead.
The two purchases used different demo shops. The times describe those journeys
and do not establish service capacity or a latency difference between the paths.

A separate PostgreSQL regression compared both entry points in the same shop.
Both rejected an altered reviewed total and replayed the original order without
another stock or event write. See the [shared order contract](checkout-component.md#how-native-and-embedded-checkout-share-one-order).
This step covers the compatibility analysis and simulated checkout. The
[configured provider callback and refund](storyfront.md#accept-a-hosted-release)
and independent hosted Checkout cutover remain separate acceptance items.

## Connector composition and public response times, 9 November 2026

The private [Connector 0.1.0 prerelease](https://github.com/veyndo/connectors/releases/tag/v0.1.0)
builds from its own repository. The Linux component run verified its non-root
image with PostgreSQL, scoped HTTP and MCP, the SDK and a loopback provider.
The native test against this separate binary ran Core, the app worker and the
Connector with an independent database. Core accepted a simulated order
before the worker started. Replaying checkout returned the original order ID.
The worker finished one Flow, and the loopback SMTP receipt contained the
order number. The same Connector binary also passed the existing Core
database profile, nine provider fixtures and the offline import regression.

Before the cutover the hosted Connector ran Northflank build `bold-table-9699`
from `d56d663`. Its old build source is unlinked from the GitHub app.
The private Connector repository needs a scoped installation grant before
the hosted service can build the replacement. The existing Core and private
app worker remain deployed.

The public Storyfront demo kept one item after leaving the unpaid checkout.
A second visit completed the embedded checkout with its simulated payment
method. The German confirmation appeared, and the basket stayed empty after
returning and reloading the Experience.

Four readers made 600 public requests over 150.6 seconds without an error.
Each reader fetched one route per second and read the full response.

| Public route | p50 | p95 | p99 |
| --- | ---: | ---: | ---: |
| Core health | 34.3 ms | 47.5 ms | 59.8 ms |
| Storyfront catalogue | 72.2 ms | 86.3 ms | 104.3 ms |
| Shop onboarding | 32.0 ms | 42.7 ms | 46.7 ms |
| Experience onboarding | 31.4 ms | 40.3 ms | 46.3 ms |

These are client-side times for four read routes at about four requests per
second. The hosted test order's merchant-visible Flow trace and sustained
traffic with active checkout and provider delivery still need acceptance.
[Connector guide](connector-component.md) · [Component map](one-shop-components.md).

## Live Flow draft check and separate app worker, 9 November 2026

Core and the private app worker run Northflank build `dashing-rain-5353`
from `3a73ccd3`. Its tree matched the merged release `c24b5527`. Core
deployment `vendune-core-865b8bccb7` passed readiness with one replica and
zero restarts. The private worker deployment `vendune-app-worker-849d988994`
runs one replica and has no assigned ports. Core reports
`app_worker_enabled=false`. The worker reports `process_role=app-worker`
and samples both due queues. It uses the existing restricted runtime roles
and the exact approved private connector origin.

During the initial worker handoff and the final Core rollout, all 70 public
health probes returned HTTP 200. After the final rollout, four parallel
readers completed 60 timed requests. Median response times were 13 ms for
Core health, 9 ms for standard shop onboarding, 9 ms for Experience
onboarding and 48 ms for the Storyfront catalogue. These are short public
checks around this release.

The public Storyfront demo completed an embedded purchase on the final
build using simulated payment. The German receipt named the purchased
product. Returning to Storyfront and reloading left the basket empty.
A separate attempt for an unavailable item was rejected at checkout.
The live storefront test did not have merchant access to the saved
execution trace for the successful order. Worker queue samples and checkout
were verified separately.

Studio uses `POST /api/automation/flows/{id}/validate`, and the SDK uses
the read-only MCP tool `automation.validate_flow`. A host without the
dedicated endpoint rejects the check. It cannot interpret it as a save.
The public route returned 401 without a merchant session. In isolated
signed PostgreSQL, HTTP, MCP and the SDK validated the same Flow without
saving or queuing it. The saved Flow branched, persisted a delay and created
one invoice. Tests checked actor revocation, replay and continuation across
a separate worker restart. The local Studio browser showed the successful
check with the same revision.

The daily verification checks each Rust image against its own build inputs.
Tests for the visual editor, reports and coding agent follow their current
entry points. The local frontend run passed all 1,018 tests and the
unchanged coverage floors. Outbox migration checks run before the slower
provider group.

[Flow draft check](automation-component.md#check-a-flow-draft-before-saving) ·
[Worker rollout](automation-component.md#move-the-app-worker-out-of-core) ·
[Core source](https://github.com/veyndo/veyndo/pull/357) ·
[SDK example](https://github.com/veyndo/sdk/blob/main/examples/check-flow-draft.mjs) ·
[Image and UI verification](https://github.com/veyndo/veyndo/pull/358).

## Live app queue diagnostics, 9 November 2026

Northflank released build `dizzy-milk-2262` from `a2de14d` as Core
deployment `vendune-core-6478ccfff5`. The deployed and merged sources
have the same Git tree. One replica passed readiness with zero restarts
and the previous replica exited. All 35 public health samples during
the rollout returned HTTP 200.

The active Core app process logged the due age sample from PostgreSQL.
Both queues had no due queued rows in the startup sample. At that
release, the dedicated worker was still paused and combined Core
processed app work.

A simulated purchase in the public Storyfront demo completed through
the embedded Core checkout. It displayed the German confirmation and
the original basket stayed empty after returning and reloading. In 12
public reads per route before and after rollout, median times were 12
and 12 ms for Core health, 8 and 8 ms for onboarding, and 30 and 32 ms
for the Storyfront catalogue. These are short public samples.

In isolated PostgreSQL, the service acceptance placed an order with Core's app
lane off, delivered its event, restarted the app worker during a delay and
observed one invoice from the resumed Flow. The combined Core then completed
queued work after rollback. The same test checked that the worker emitted
aggregate queue ages without tenant, order, app or credential data.

With six test purchases and exact replays, each local topology handled 96
catalogue reads without an error. The combined process measured 41.9 ms at the
median and 77.1 ms at the 95th percentile. With the app work separated, it was
28.2 and 52.9 ms. Both runs produced six orders, stock decrements and invoices.
These are local debug measurements, with four readers and four purchase clients.

[Queue diagnostics](automation-component.md#read-the-worker-queue-logs) ·
[Source change](https://github.com/veyndo/veyndo/pull/353).

## Live Core with app worker handoff support, 8 November 2026

Northflank deployed Core build `eminent-balance-6864` from `357b341` as
deployment `vendune-core-64574dd986`. The deployed and merged sources have
the same Git tree. The new Core reached one ready replica with zero
restarts and the previous replica stopped. All 35 Core health samples
during the rollout returned HTTP 200. App processing remains active in
the combined Core process.

Before and after the rollout, 12 public requests per route gave median
response times of 11 and 10 ms for Core health, 8 and 8 ms for onboarding,
and 28 and 29 ms for the Storyfront catalog. Mobile Storyfront displayed
the embedded checkout in 1,334 ms and retained the original open basket
after an unpaid return and reload. The desktop form opened in 804 ms.
A simulated order placed through that frame returned its receipt after
206 ms from submission. The German confirmation showed the purchased
product and the Storyfront basket stayed empty after return and reload.
These are short public samples.

In the isolated PostgreSQL test, Core accepted orders while the app lane
was off. The dedicated worker processed the queued events, resumed a
Flow from a saved delay after restart and created one invoice. A second
order queued during the rollback and completed when Core resumed app
processing. The separate hosted worker still needs to be started and
verified with a hosted order Flow.
[Handoff and local load comparison](automation-component.md#move-the-app-worker-out-of-core) ·
[Source change](https://github.com/veyndo/veyndo/pull/351).

<a id="live-core-and-portable-flow-directives-8-november-2026"></a>

## Previous Core release with portable Flow directives, 8 November 2026

Northflank released build `small-station-5881` from `a3a4d25` on
deployment `vendune-core-7b794464df`. The deployment reached one ready
replica with zero restarts. All 18 sampled Core health checks during the
rollout returned OK.
The native worker resolves branches, effects, delays and stops through
the public Rust crate. Core checks permissions, applies the effects
and persists progress. The image source and merged change have the same Git tree.

The public Storyfront checkout showed its form in 804 ms on desktop and
811 ms on mobile. Returning and reloading kept the original open cart.
Recovery took 17 and 18 ms. In 12 reads per route before and after the
rollout, Core and onboarding stayed at median times of 11 and 8 ms,
and the demo catalog changed from 29 to 28 ms. These are short public
availability and latency checks.

The complete simulated purchase ran in an isolated shop. Separate
HTTP, event and app processes verified a worker restart during a delay.
The current Flow was edited through the merchant API while the worker was
offline. The restarted worker used the saved definition for its existing job.
Six new purchases also completed
with the worker offline and produced one invoice per order after it started.
An external Rust project built and ran the documented example from the merged
revision. A dedicated worker deployment on Northflank remains a separate task.
[Flow directives and tests](automation-component.md#portable-flow-directives) ·
[Source change](https://github.com/veyndo/veyndo/pull/349).

<a id="live-core-and-durable-flow-job-storage-8-november-2026"></a>

## Previous Core release with durable Flow job storage, 8 November 2026

Northflank deployed Core build `apt-group-5288` from `bf42343`. Deployment
`vendune-core-5c9dbdbc64` reached one ready replica with zero restarts.
The image source and merged change have the same Git tree. The job adapter
claims a ready Flow together with its checkpoint and scopes progress and
completion to the same execution attempt.

After deployment, the Storyfront checkout opened and returned to the
original open cart on desktop and mobile. Reload preserved the cart and
the recovery read took 18 to 19 ms. The form was visible after 799 ms on
desktop and after 1,310 ms and 807 ms in two mobile checks. In 12 reads per route before
and after rollout, median response times stayed at 11 ms for Core health
and 8 ms for onboarding. The demo catalog changed from 27 to 28 ms.
These are short public availability and latency checks.

The complete purchase and Flow effects ran in an isolated test shop.
Tests covered replay, a final delay, a stale attempt, revoked access and
tenant isolation. The separate rule preview could be stopped during the
purchase. Two local workers also processed six concurrent purchases and
their replays with one stock decrement and invoice per order.
[Flow job storage](automation-component.md#durable-flow-job-storage) ·
[Source change](https://github.com/veyndo/veyndo/pull/347).

## Previous Core release with the built-in Flow catalog, 8 November 2026

Northflank deployed Core build `past-shake-5794` from `a2a6d60`, with one
ready replica. The build and merged source have identical Git trees.
The public Storyfront checkout opened in 806 ms on desktop and in 1,308
and 802 ms in two mobile checks. Returning and reloading preserved the
open cart. Recovery took 18 to 20 ms. In 12 reads per route before and
after deployment, median response times went from 12 to 11 ms for Core
health, stayed at 8 ms for onboarding, and went from 30 to 28 ms for the
demo catalog.

The complete purchase, discount, delayed Flow, replay and invoice were
verified in an isolated shop. The same test environment checked a
purchase with the independent preview process stopped. The public check
covered checkout opening and return.
[Flow catalog change](https://github.com/veyndo/veyndo/pull/345).

## Previous Core release with the shared Flow graph, 8 November 2026

Northflank deployed Core build `loving-delight-7432` from `a3bcee7`, with one
ready replica. The build and merged source have identical Git trees. The
public Storyfront demo opened the embedded checkout in 805 ms, returned to
its open bag and kept that bag on reload. Recovery of the open cart took
16 ms. In 12 reads per route, median response times after deployment were
9 ms for Core health, 8 ms for onboarding and 23 ms for the demo catalog.
This is a public smoke check. The completed purchase, delayed Flow and invoice
were tested separately in an isolated shop.
[Core change](https://github.com/veyndo/veyndo/pull/343).

## Automation and native checkout, 8 November 2026

The separate Automation preview and Core agreed on two actual cart totals.
After the preview process stopped, Core applied the eligible coupon, placed
one order and produced one invoice through its Flow. Replay returned the
same order. The separate process retained its registry and behavior after
restart. Hosted composition and capacity are separate acceptance steps.
[Automation guide](automation-component.md#keep-checkout-independent-of-the-preview-service).
The local composition also checked a dedicated integration key against the
actual Core. HTTP and MCP accepted the restricted key and rejected it after
revocation. The independent Automation process is awaiting Northflank source
access and deployment. [Setup](automation-component.md#connect-the-service-to-veyndo-core).

The native Flow editor and worker now use one Rust graph validator. The local
checkout suite ran both branches, resumed a persisted delay and replayed the
original steps without repeating the order mutation. [Flow graph contract](automation-component.md#flow-graph-contract).

## Knowledge catalog recovery, 8 November 2026

The local composition completed a native order and retained a catalog event
while independent Knowledge was stopped. After restart the new source reached
search and passed the evidence check. An overlapping first import and
withdrawal retried successfully, and replay left the withdrawn item out of
search. Hosted installation and capacity are still open.
[Component guide](knowledge-component.md).

## Checkout rollback rehearsal, 8 November 2026

Local tests prepared a normal cart and a Storyfront handoff, then stopped
the separate Checkout process. Core completed both purchases and reconciled
an earlier PayPal fixture payment. With confirmation still disabled, the
original receipt exposed capture and refund. Re-enabling confirmation
preserved the order and payment identity and let an existing draft resume.
The hosted routing switch remains open.
[Procedure and evidence](checkout-component.md#pause-and-resume-checkout-confirmation).

## A purchase without Core, 8 November 2026

The independent Checkout process now has local acceptance against a separate
Rust reference commerce host. The two processes use separate PostgreSQL
databases. Two concurrent attempts for the last unit leave one order and one
event. The JavaScript SDK recovers the original receipt after a lost response
and restart. The external storefront also completed the browser flow with
simulated payment, return to an empty cart and receipt recovery after reload.
Hosted acceptance remains open. [Browser example](checkout-component.md#external-reference-storefront).

## Embedded checkout recovery, 8 November 2026

Local signed PostgreSQL tests recovered the original order after the browser
notification was lost and read checkout status while another transaction held
the cart lock. When reopening raced a purchase, the result was the existing
order or a replacement transfer for the same cart. The browser fixture used
the Storyfront adapter and built native checkout at mobile and desktop widths.
It kept the bag during pending payment, cleared the purchased item after
capture, and retained it after cancellation.

Core `a3b6d76` is running on Northflank after a fresh PostgreSQL snapshot
and migration 112. The existing Experience `fb97774` opened its native
checkout in clean Chromium sessions at 1280 px and 390 px. From the
checkout button to the contact form took 803 ms and 805 ms, compared with
805 ms and 799 ms in two runs before the release. Scoped status reads
returned the original open test cart in 21 ms and 16 ms. An incorrect
recovery key was rejected. Returning before purchase kept the original
bag intact after reload.

These are individual timings for the public Lumen demo. The companion
Experience update and its Sandbox purchase, verified return, empty bag
and refund remain open. [Hosted release checklist](storyfront.md#accept-a-hosted-release).

## Checkout with current company and shop authority, 8 November 2026

The local native composition now verifies that changed company membership,
approval, budget, channel visibility and shop availability take effect after
a checkout review. A fresh approved purchase creates one order, reserves stock
once, runs one Flow and exposes its invoice to the customer. Repeated
confirmation returns the original receipt. The public Lumen checkout form
and open cart recovery also passed a separate smoke test. [Cases and timings](checkout-component.md#current-buyer-channel-and-company-authority).

## Service composition and rule extraction, 6 November 2026

SDK 0.3.0 is released with independently scoped service discovery and registered
read views in a bounded versioned layout. The native OpenUI workspace uses the
same layout admission after current domain/PII checks. Context changes abort reads
and discard late replies. [Contract and evidence](agentic-component-ui.md#shared-sdk-composition).

The next extracted domain is Automation: original deterministic rules now build
as an independent Rust library and HTTP/MCP evaluator. Local actual process/SDK
acceptance and private repository CI pass. The native integration test later
verified coupon pricing and the invoice Flow during an outage of the preview
service. Durable Flows run in Core. [Guide](automation-component.md).

## Independent commerce components, 5 November 2026

The complete platform now lives at [veyndo/veyndo](https://github.com/veyndo/veyndo).
Experience and Shopware Payments have moved into the same organization and remain
private. The new [JavaScript/TypeScript SDK](https://github.com/veyndo/sdk) exports
202 canonical native operation input contracts, HTTP/stateless MCP transport and
the existing guest app bridge. Eight independent wire tests, negative TypeScript
controls and Node 22/24 CI pass. A public native MCP catalog read also completed;
this does not constitute a new checkout or full-platform acceptance.

The first provider component now lives at [veyndo/marketplaces](https://github.com/veyndo/marketplaces).
It builds independently, exposes shared HTTP/MCP actions and has a working Node
SDK example. Its pinned source snapshot remains integrated into Veyndo. Standalone
wire tests, seven Rust tests and the real PostgreSQL/native marketplace fixture
pass, including order replay, stock, invoice/PDF and Flow effects. Independent
durable host storage and separately embeddable Studio UI remain open.
[Exact extraction evidence](evidence/marketplace-component-2026-11-05.md).

The [component task list](commerce-components.md) tracks the complete repository
split, deeper commerce domains, marketplaces and additional services, independent
API/MCP/SDK use and mandatory assembled-product regression. The
[component map](one-shop-components.md) shows the scope of each separate service.
The SDK retains uncertain tool/write outcomes; both Node CI versions pass. Core and migration
image publication now succeeds under `ghcr.io/veyndo` with their packaged smoke checks.
The Northflank GitHub organization connection is now saved for exactly the three
authorized repositories. Build-source remapping is recorded in the component
plan; complete hosted rollout acceptance remains open. The organization-aware
website proxy is now deployed: handbook, source links, assets and streamed video
ranges pass at <https://www.veyndo.ai/docs/>.
[Hosting and public documentation evidence](evidence/component-hosting-2026-11-05.md).

## Shared app persistence, 5 November 2026

The [Apps repository](https://github.com/veyndo/apps) now contains the native record
and job persistence as the independent Rust package `veyndo-app-storage`. Veyndo
uses that same pinned code. Subsequent releases also share record CAS/write/query
operations, model validation and action/callback admission through required host
ports, as detailed below. Authentication, full package lifecycle, history hooks,
reference ownership and signed database scope retain their native authority.
No production schema or role change is required for these extractions.

Independent PostgreSQL tests cover atomic job/outbox rollback, concurrent replay,
quotas, expired leases and reconnection. The integrated storage/jobs tests, 43
tenant isolation checks and native marketplace HTTP/MCP order, stock, invoice and
Flow fixture also pass. The first independent read host is described below; portable installation, writes and settings now have explicit profiles below;
complete lifecycle hosting and independent deployment remain open.
[Evidence and exact scope](evidence/app-storage-component-2026-11-05.md).

## Independent App job supervision, 6 November 2026

Apps 0.29.0 / Data service 0.5.0 supplies bounded job history/detail and approved
cancel/retry/resolve/archive through HTTP, MCP and the unchanged SDK, without Core.
Native Veyndo uses the same current-package/current-rights result redaction and
queued-event selector. The explicit schema-5 nonowner profile cannot enqueue or
forge worker input/results. Personal live authority, exact approval, original
leases/CAS and atomic events remain enforced. Actual worker execution, producer
provisioning and callback evidence retain their separate owners.
[Setup and SDK](app-job-supervision-service.md),
[acceptance](evidence/app-job-supervision-component-2026-11-06.md).

## Independent App package installation, 6 November 2026

Apps 0.28.0 / Data service 0.4.0 lets developers review and install a private data
App, configure its encrypted settings and use its records without Core, through
HTTP, MCP and the existing SDK. It uses the complete shared compiler, original
atomic installer and extracted native model installer. The explicit schema-4
profile adds immutable versions and protected usage accounting in fixed shared
tables. Current personal live administrator authority, exact digest/permission/
revision approval and original per-App row/byte budgets remain enforced.
Native Veyndo delegates model installation with its actual compatibility policy
on the original transaction. Native resource resolvers, jobs, restore and release
hosting remain open. [Setup and example](app-package-installation-service.md),
[acceptance](evidence/app-package-installer-component-2026-11-06.md).

## Independent encrypted App settings, 6 November 2026

Apps 0.27.0 / Data service 0.3.0 adds an explicitly enabled settings profile.
HTTP, MCP and the existing JavaScript SDK use the same declared partial-update,
encrypted CAS/package binding and secret-safe projection as native Veyndo. The
fixed identity owner must confirm a personal live administrator with current
apps.read, apps.manage and team.manage; machine keys and delegated agents cannot
supply these claims. A separate operator encryption key and explicit schema-3
migration grant only settings storage. Native package installation, private
stage restrictions and current verified administrator admission retain their
owners. Independent process and Linux container tests pass for two shops, current
identity/rights, encrypted partial updates, CAS races, late rollback, package
changes, key/binding rejection and reconnect. Four signed native HTTP/PostgreSQL
suites plus the actual App surfaces/secrets journeys and 74 App unit tests pass.
[Setup and example](app-settings-service.md),
[acceptance](evidence/app-settings-service-component-2026-11-06.md).

## Managed App Data writes, 6 November 2026

Apps 0.26.0 / Data service 0.2.0 adds an explicitly enabled write profile with
approved package-bound CAS changes, typed private records, original states,
retained historical rights and atomic outbox. HTTP/OpenAPI/MCP/SDK use the same
operation. The dedicated schema-2 profile checks exact restricted grants; default
read mode remains SELECT-only. Native Veyndo consumes the original shared hooks
while retaining its full field/reference/language/commerce admission.

Real process tests cover two shops, current rights, concurrent writes, rejected
states, late failure rollback, historical scopes/retention and reconnect. Full
independent native resource/jobs/restore/release hosting
remains on the component list. [Guide](app-data-writes.md),
[acceptance](evidence/app-data-managed-writes-component-2026-11-06.md).

## Independent App Data reader, 6 November 2026

Apps [0.25.1](https://github.com/veyndo/apps/releases/tag/v0.25.1) adds an independent Rust read service with HTTP, OpenAPI, MCP and
existing SDK support for private installed App data. A versioned fixed reader
schema, nonowner SELECT-only login, current OAuth merchant/action rights and signed
read-only database scope enforce the independent boundary. Native Veyndo uses the
same page preparation, field projection and original signing protocol.

Real process tests with two shops, a current identity endpoint and PostgreSQL pass,
including rights/revocation, deactivation, forged contexts, restricted startup and
SDK parity. Complete independent install/write/settings/jobs hosting and native
object resolver ports remain on the component list. No new public service or
production database cutover is claimed. [Read service guide](app-data-service.md)
and [dated evidence](evidence/app-data-reader-component-2026-11-06.md).

## Independent App Runtime service, 6 November 2026

Apps [0.24.0](https://github.com/veyndo/apps/releases/tag/v0.24.0) now includes a
standalone Rust server for bounded price/shipping/discount/validation simulations.
HTTP, OpenAPI and MCP use the same typed operation; the existing Veyndo SDK works
unchanged. Fresh fixed-endpoint OAuth introspection admits current subject,
workspace, audience, expiry and scope. Revocation takes effect on the next request.
It runs without Core or a database using supplied example data and explicitly
returns no applied effect. Native Veyndo continues to embed the same engine.

Local actual process/Fetch/SDK and container checks pass, alongside 116 model tests,
24 runtime tests, 74 native App units and seven affected HTTP/PostgreSQL modules.
Full standalone App data/installation hosting and hosted identity/deployment remain
separate tasks. [Run the service](app-runtime-service.md). [Runtime service acceptance](evidence/app-runtime-service-component-2026-11-06.md).

## Agentic service UI and independent checkout direction, 6 November 2026

The cross-component design now explicitly requires standalone service UI,
embeddable exports and agent-generated workspaces from the same definitions and
admitted operations. Source checks identify missing output/semantic contracts,
cross-service host navigation and common composition/generation. OpenUI, A2UI and
MCP Apps are planned adapters to one definition, not delivered parallel runtimes.
[Checked direction and component matrix](agentic-component-ui.md).

Checkout is an explicit independent Rust service/API/MCP/SDK/UI target in
`veyndo/checkout`. Its extraction preserves one authoritative stock/order/outbox
commit owner, current pricing/payment/approval boundaries and both standalone and
native/Storyfront purchase/return/cart/refund acceptance. It is not yet a released
standalone service. [Checkout boundary](checkout-component.md) and
[implementation tasks](commerce-components.md#checkout-independent-service-and-ui).

## Independent schema conversion and recovery, 6 November 2026

Apps [0.23.0](https://github.com/veyndo/apps/releases/tag/v0.23.0) now shares explicit
field migration, old-manifest/record recovery snapshots, model/record updates and
the existing schema event. Required host validation calls the native typed-field
and current content-language checks on the same installation transaction. Original
2,000-row, 4 MB snapshot and 16 MB retention bounds remain, with no silent pruning.
Exhausted record revisions now return a conflict without partial effects. The
complete installer keeps identity/trust/consent/reference admission and commit;
there is no new production schema or automatic historical rewind.
[Schema recovery evidence](evidence/app-schema-recovery-component-2026-11-06.md).

## Independent package state changes, 6 November 2026

Apps [0.22.0](https://github.com/veyndo/apps/releases/tag/v0.22.0) now shares the
original package activation/deactivation transaction, active-dependant check and
revision CAS. Required host hooks retain actual configuration-first locking,
current actor/consent/trust/dependencies/commerce/native-lifecycle admission and
connected frontend protection. The same lifecycle fences serialize installation,
state changes and active-package writers. Original error order, same-state revision
advancement and retained data/versions remain. No production schema change or new
event is introduced. [Boundary and tests](evidence/app-activation-component-2026-11-06.md).

## Independent app-record history, 6 November 2026

Apps [0.21.0](https://github.com/veyndo/apps/releases/tag/v0.21.0) now shares immutable
record snapshots and original historical read scopes, actor/source attribution,
bounded listing and managed restoration. Current read authority and the actual
normal writer are mandatory host ports. Veyndo retains current entity and field
projection, explicit review, expected revision, signed scope and caller transaction.
Restoration creates a new revision and its normal history/event; it never rewinds
clocks or substitutes an older package. Original 20 revisions per record and
16 MiB history per app remain enforced on the existing fixed table. No production
schema change or new endpoint is introduced. [Evidence and example](evidence/app-record-history-component-2026-11-06.md).

## Independent private Studio drafts, 6 November 2026

Apps [0.20.0](https://github.com/veyndo/apps/releases/tag/v0.20.0) now supplies the
actual actor-private mutable autosave/list/delete path. Core uses the same pinned
code and retains authenticated actor derivation, current developer rights, signed
SQL scope, actual private-environment admission and transaction commit/rollback.
Strict Manifest wire decoding, submitted locale/field values, 64 KiB input budget,
original advisory/row CAS fences and maximum 20 drafts remain unchanged. Concurrent
create/update and quota admission are serialized by PostgreSQL. No production
schema migration, install, immutable version change or publication is introduced.
[Validation and exact scope](evidence/app-private-drafts-component-2026-11-06.md).

## Independent App Studio versions, 6 November 2026

Apps [0.19.0](https://github.com/veyndo/apps/releases/tag/v0.19.0) now owns immutable
development snapshots and original serialized-byte digests, bounded active/archive
history, recoverable archival and the actual row-locked private-stage sequence.
Core retains environment ownership, current developer/actor rights, package/source/
language validation, explicit approval and the actual installer. Failed admission,
installation or build-state write rolls back the entire caller transaction.
Installed packages/data remain separate from recoverable Studio projects.
Mutable drafts are now shared in Apps 0.20.0 below this authority boundary.
Remaining lifecycle orchestration and standalone production identity/schema/API/MCP
remain open.
[Acceptance and exact scope](evidence/app-studio-versions-component-2026-11-06.md).

## Independent encrypted app configuration, 6 November 2026

Apps [0.18.0](https://github.com/veyndo/apps/releases/tag/v0.18.0) now owns encrypted
settings/transport metadata, internal resolution and the original rotation
transaction. Required host seal/open callbacks retain the existing platform key
owner. Native routes retain their existing administrator/session, consent,
declared-kind/settings, live-write and browser-redaction checks. AEAD binding, revision/package checks, shared webhook lock and atomic
outbox are shared; revision exhaustion returns a clear error. Independent version,
identity/schema/API/MCP hosting remain open. [Acceptance and exact scope](evidence/app-encrypted-configuration-component-2026-11-06.md).

## Independent durable app job workflows, 6 November 2026

Apps [0.17.0](https://github.com/veyndo/apps/releases/tag/v0.17.0) now owns bounded
job history/detail and the original merchant cancel/retry/resolve/archive
transaction. Core reuses it with current retry rights/input validation and response
redaction. Revision, uncertainty, lease cleanup, actor/package rebinding and atomic
outbox behavior remain connected to their existing owners. The executable
PostgreSQL example runs without Core and rolls back its synthetic work. Independent
identity, callback/evidence hosting and supported standalone schema/API/MCP remain
open. [Acceptance and exact scope](evidence/app-job-workflows-component-2026-11-06.md).

## Complete independent standard app compiler, 6 November 2026

Apps [0.16.0](https://github.com/veyndo/apps/releases/tag/v0.16.0), model 0.12.0,
now runs all 19 standard package validation stages in the original native order.
Core calls that same complete compiler and supplies required native policies for
fields, references, currencies, scopes, Wasm kind, native base, publisher trust,
namespace/network/read admission and UTC time. Standard domains cannot be omitted
through host before/after callbacks. The independent example compiles all 34
native packages; invalid metadata in every stage and denied policies are rejected.
APP-01 is complete; standalone identity/schema/API/MCP hosting remains tracked.
[Acceptance and exact scope](evidence/app-complete-compiler-component-2026-11-06.md).

## Complete portable app package contracts, 6 November 2026

Apps [0.15.0](https://github.com/veyndo/apps/releases/tag/v0.15.0), model 0.11.0,
shares the complete strict Manifest, canonical package fingerprints/signing messages
and passive artwork, payment-provider and publisher/dependency rules. Native Core
aliases that same type and supplies its original current operator-key verifier,
reserved namespaces/service pins and transactional installed-package authority.
The independent example reads all 34 native packages with unchanged fingerprints
and exercises real Ed25519 using synthetic keys, including tampering and revoked
key rejection. Actual payment execution keeps its existing owner.
[Tests and remaining independent-host scope](evidence/app-complete-package-component-2026-11-06.md).

## Shared order and quote lifecycle compiler, 6 November 2026

Apps [0.14.0](https://github.com/veyndo/apps/releases/tag/v0.14.0), model 0.10.0,
shares strict graph/snapshot types and bounded compilation. The independent
[example](https://github.com/veyndo/apps/blob/main/examples/native_lifecycles.rs)
compiles order quality review and quote preparation without Core or SQL. The
native product uses that same implementation with its canonical package digest,
base graph, scope catalogue and locale policy. Accepted orders retain their
original graph across package upgrades; current rights and real payment/delivery
and buyer decisions remain enforced by their existing owners.
[Checks and remaining service work](evidence/app-native-lifecycle-component-2026-11-06.md).

## Shared configuration and business preflight, 6 November 2026

Apps [0.13.0](https://github.com/veyndo/apps/releases/tag/v0.13.0), model 0.9.0 and
runtime 0.2.0, shares structured configuration/library selection, exact arguments,
typed hooks and frozen business snapshots/expected decisions. Native compilation
and actual example/checkout execution reuse the same implementation with canonical
host policies, current package/record checks and existing release owners.
The independent preflight validates and executes seven configuration and five
commerce cases without Core, SQL or inference.
[Evidence and remaining scope](evidence/app-business-contracts-2026-11-06.md).

## Independent bounded app runtime, 5 November 2026

Apps [0.12.0](https://github.com/veyndo/apps/releases/tag/v0.12.0) adds
`veyndo-app-runtime` 0.1.0: the actual core-Wasm/WIT executor with isolated stores,
limited fuel/memory/host calls and typed snapshots/results. Independent developers
can execute a commerce hook without Core or a database. Native `crates/apps`
supplies required verified resource admission and operator namespace configuration;
current rights, snapshots, cache, checkout and release stay with their owners.
[Evidence and remaining scope](evidence/app-wasm-runtime-component-2026-11-05.md).

## Shared native app views and behavior, 5 November 2026

Apps [0.11.0](https://github.com/veyndo/apps/releases/tag/v0.11.0), model 0.8.0,
shares localized native views/controls, geometry, editor bindings, bounded UI
behavior and its type checks. The native compiler consumes this same package with
required field policies and its verified public-read predicate. The existing
renderer/interpreter, current grants, action gateway, records and sandbox/release
remain attached. Developers can run the independent native editor example.
[Evidence and remaining scope](evidence/app-native-views-component-2026-11-05.md).

## Shared placement and HTTP contracts, 5 November 2026

Apps [0.10.0](https://github.com/veyndo/apps/releases/tag/v0.10.0), model 0.7.0,
shares strict app surface/named HTTP route types and grammar. Native admission
uses the same implementation with required policies for actual native views,
known team scopes and the existing verified read predicate. Current actor/context
surface grants, installed package checks, pinned UI, dispatch and complete native
view compilation retain their owners.
[Evidence and remaining scope](evidence/app-surface-contracts-2026-11-05.md).

## Shared object and graph contracts, 5 November 2026

Apps [0.9.0](https://github.com/veyndo/apps/releases/tag/v0.9.0), model 0.6.0,
shares product/customer/order/company binding declarations, AI tool/entity metadata,
strict graph mapping and bounded current-row projection. Native package validators,
authorized app lists and native object projections reuse the same implementation.
Current actor/object rights, immutable references, MCP/agent opt-in, scoped SQL and
verified configuration release retain their owners. Graph edges do not read target
records or become confirmed product claims.
[Evidence and remaining scope](evidence/app-object-graph-contracts-2026-11-05.md).

## Shared event and trigger contracts, 5 November 2026

Apps [0.8.0](https://github.com/veyndo/apps/releases/tag/v0.8.0), model 0.5.0,
shares strict event filter/delivery contracts, subscription and payload minimization,
UTC schedules and private webhook declarations. Native package validation and
actual event eligibility/projection now call those same rules. Required host
URL admission, actual pinned egress, signatures, current installed authority,
leased delivery, replay receipts, durable ticks and SQL stay connected to their
original owners. [Evidence and remaining scope](evidence/app-event-contracts-2026-11-05.md).

## Shared app settings and schema evolution, 5 November 2026

Apps [0.7.0](https://github.com/veyndo/apps/releases/tag/v0.7.0), model 0.4.0,
shares strict setting declarations, bounded partial updates, secret-safe browser
projections and the explicit schema evolution planner. Native settings and upgrade
review/install paths call those same functions. Rename/remove/convert/fill steps,
exact conversions, operational-record restrictions and core-extension binding
compatibility retain the existing rules. Encryption, package consent, current
administrator rights, recovery snapshots, reference/language validation and all
transactional writes remain attached to their native owners.
[Implementation and acceptance](evidence/app-evolution-settings-2026-11-05.md).

## Shared common app package compiler, 5 November 2026

Apps [0.6.0](https://github.com/veyndo/apps/releases/tag/v0.6.0) supplies the model
0.3.0 common package compiler used by native installation, Studio, agents, API,
MCP and release consumers. Package limits, declaration grammar, model/index and
configuration checks, action schema/privacy/Flow/job/payment/asset restrictions,
strict legacy Slot types and event names now have one component owner.

The required host extension checks still run before and after the common grammar
in their original order. Scope/reference/Wasm-kind policies come from trusted
native owners. Thirty-four independent model tests, 74 native app units, affected
PostgreSQL/API fixtures, Marketplace composition and the local payment-provider
fixture pass; all 34 public package fingerprints remain unchanged. Full typed
extension compilation, identity/lifecycle hosting and standalone API/MCP remain
open. [Evidence](evidence/app-package-compiler-2026-11-05.md).

## Shared atomic app installation, 5 November 2026

Apps [0.5.0](https://github.com/veyndo/apps/releases/tag/v0.5.0) supplies the original
installation transaction to the complete platform. Required host hooks preserve
compiler/trust, commerce/dependencies, checked schema migration, models, default
configuration and schedules. Tenant/package locks, quota, immutable versions,
package/version persistence and the outbox event share the original transaction.

Independent PostgreSQL tests and native installation/upgrade, private preview,
Studio, staging/release, signed package, model/job, tenant, visual-workspace and
Marketplace fixtures pass. Authentication, the complete package compiler and
remaining lifecycle, supported independent schema/service and hosted API/MCP are
still open. [Evidence](evidence/app-installation-component-2026-11-05.md).

## Shared app admission, 5 November 2026

Apps [0.4.0](https://github.com/veyndo/apps/releases/tag/v0.4.0) shares action and
callback scope rules through required trusted-host authority ports. Veyndo uses
its current authenticated context in those ports. Key creation still requires its
personal account, package approval and live-workspace checks; callback consent
and current rights remain separate facts for the existing verified predicate.

The component also owns the original scoped active-package lock/read and canonical
content fingerprint. Twenty-two independent model tests, 74 native app units and
the affected PostgreSQL/API/MCP suites pass. Existing fingerprints match all 34
public packages. Authentication, complete package lifecycle and separately hosted
API/MCP remain open. [Evidence](evidence/app-admission-component-2026-11-05.md).

## Pure app model component, 5 November 2026

Apps [0.3.0](https://github.com/veyndo/apps/releases/tag/v0.3.0) now includes the
independent Rust package `veyndo-app-model`. Veyndo uses its exact entity/field
types and shared declaration, action-schema, field, language, publication and
workflow checks. Native money/rich-content/reference rules remain behind required
host policy ports; current identity and object ownership stay with their owners.

Fourteen independent model tests, 74 native app unit tests and the affected
PostgreSQL/API/MCP suites pass. Canonical fingerprints of all 34 existing public
app packages are unchanged. The model crate has no SQL or network dependency.
Full package/identity authority and separately hosted API/MCP remain open under
MKT-03b. [Evidence and boundaries](evidence/app-model-component-2026-11-05.md).

## Shared record operations, 5 November 2026

Apps [0.2.0](https://github.com/veyndo/apps/releases/tag/v0.2.0) now owns record
revision checks, exact import replay, transactional writes/events and bounded
record pages with indexed filters and publication windows. Core uses the same
code through its existing lifecycle/history hooks and current admission.

Independent PostgreSQL and component CI pass. Native app storage, jobs, schema
changes, object extensions, isolation, visual editor publication/history/form
privacy and the marketplace order fixture pass with this version. The visual
workspace fixture now correctly expects unsafe reference URLs to be rejected
before reaching a model. MKT-03b remains open for complete model/identity
extraction and a separately authenticated API/MCP service.
[Scope and evidence](evidence/app-record-operations-2026-11-05.md).

## Versioned component host exchange, 5 November 2026

SDK 0.2.0 now exports the shared host contract and generated TypeScript inputs for
records, channel/product projections, exact paid-order snapshots and durable job
operations. Marketplace HTTP/MCP expose record list/save and synchronization with
an explicit request key. Independent hosts can use their own fixed route prefix.
Veyndo's callback reuses the original action gateway, actor permissions, quotas,
idempotency, package checks and transactional outbox. No second queue was added.

Independent HTTP/MCP/SDK tests and the actual Core/PostgreSQL marketplace fixture
pass, including duplicate/conflicting requests, missing job/PII capabilities,
revoked keys, foreign tenants, version mismatch and stale record revisions.
[Evidence and remaining durable-host work](evidence/marketplace-host-2026-11-05.md).

## Canvas editing context, 5 November 2026

Page design, product data and category data now have explicit actions and matching
save controls. Native data editing hides unrelated page tools and retains the
underlying page draft. Embedded product navigation responds to available width;
Shop design shares the resizable properties control with App Studio. Selected
element fields appear before general app metadata. Current local browser checks
and focused regressions are tracked in the [Canvas workflow](visual-workspace-canvas.md) and [acceptance](evidence/canvas-editing-2026-11-05.md).
Public Core `04cbac2e` is running from build `heady-finger-159`. Its ready replica
passed the public product save/reload/return check; the temporary test name was
restored afterward. Native category editing and the updated online guide also
passed the public check.

## Actual PayPal Sandbox acceptance, 4 November 2026

Provider activation problems now have exact safe diagnostics in the shared
payment history and command feedback in all four Studio languages. The actual
local Core/private/PostgreSQL check confirms current merchant access, foreign
shop denial, zero captured money and the existing saved-method lifecycle. The
private 1.6.6 service is healthy in Sandbox. Actual PayPal account tests were
deferred at the user’s request; no new external acceptance is claimed.


The separate native SDK purchase **RAC-a98f4546** completed with popup approval,
return, basket zero after reload and exact EUR 0.01 + EUR 58.99 refunds. The first
hosted saved-method check returned PayPal `NOT_ENABLED_TO_VAULT_PAYMENT_SOURCE`;
provider feature activation, actual reuse/revocation and invoice approval remain
in progress. Targeted local invoice and vault flows pass, including native PDFs,
Email Delivery/Flow, durable recovery and restricted customer/database authority.


The private payment service **1.6.6** is online in Sandbox with its restricted
database runtime, migrations 003/004 and encryption key configured. Public Core
**db0e00c9** is running with one ready replica. The native shop captured
**EUR 59.00** and completed **EUR 0.01 + EUR 58.99** refunds. Original Storyfront
captured **EUR 59.90** through its embedded checkout and actual PayPal SDK, then
completed **EUR 0.01 + EUR 59.89** refunds. The original Storyfront bag stayed
empty after return and full page reload. Native provider return and empty basket
also passed. Studio displays the provider capture, fees and both refunds.

The SDK locale, embedded loading and provider-appended return fragment fixes are
published. This accepts the observed PayPal Sandbox wallet paths, not Live or
all-method parity. Saved methods and invoice provider acceptance remain separate.
[Current screenshots and exact scope](shopware-payments-acceptance.md#actual-paypal-sandbox-purchases-and-refunds-4-november-2026).

## Public checkout recheck, 3 November 2026, 22:39 UTC

Core `e1dde810` is publicly running after its migration-only job completed.
Original Storyfront order **RAC-fb039310** passed the nested native checkout and
private simulated card payment for **EUR 59.90**, returned to the Experience and
retained an empty original bag after reload. Native Studio then confirmed a
one-cent refund and the exact EUR 59.89 remainder; another provider-status refresh
retained **refunded**. The browser required recovery of a paused document response
and a retry of the same payment session, without creating another order.
The hosted private runtime remains **1.4.0**. This recheck does not accept the
pending saved-method or invoice rollout.
[Screenshots and exact acceptance](shopware-payments-acceptance.md#public-recheck-after-core-upgrade-3-november-2026).

## Saved customer payments, 3 November 2026, integrated source

Contract 1.6.0 adds explicit save consent, account-bound second purchases and
immediate customer revocation through the existing native ledger and jobs.
Provider tokens stay encrypted in the private service. Checkout/account controls,
HTTP/MCP operations and a minimized Flow event share current identity checks.
Local Rust/PostgreSQL tests cover foreign/guest denial, delayed confirmation and
restart without duplicate capture. Running the hosted-mode simulation transport
locally also passes PayPal/card save, repeat purchase, revoke and refund with no
external calls. The Core and private service changes are merged into main.
Core migration 110 has completed publicly. Private migrations 003/004, its encryption key, versioned service configuration and the private runtime upgrade completed on 4 November. Actual provider saved-method testing remains separate.
[Workflow, storage and rollout](payment-saved-methods.md).

## Deferred invoice checkout, 3 November 2026

Contract 1.5.0 adds private invoice details before provider creation,
immutable recipient instructions, durable pending review and same-key/webhook
recovery. Local native Rust/Core/PostgreSQL and 17-method simulation checks pass.
The recipient display supports four languages and narrow embedded checkouts.
Native invoice PDFs and the opt-in Email Delivery 1.3.0 template now share the
validated immutable recipient evidence. Automatic and Flow-triggered messages
passed the actual local encrypted Rust queue test, with no external mail.
Hosted migrations and rollout completed on 4 November; actual provider invoice testing remains separate. [Customer flow, rights and recovery](payment-invoice-checkout.md).

## Payment transaction details, 3 November 2026

Contract 1.4.0 adds read-only owned provider transactions, exact fees/net amounts
and a payment-only projection of durable native history. Orders and payment
management share the same disclosure, HTTP/MCP operation and current read rights.
Actual local Rust/Core/PostgreSQL checks pass, including no ledger mutation and
no exposed customer/card/bank fields. Actual PayPal Sandbox capture, fee and completed-refund details were observed on 4 November.
[Usage and validation](payment-transaction-details.md).

## Payment capture expansion, 3 November 2026, local acceptance

Core and private Rust service support partial/multiple capture, per-capture
refunds, remainder void, exact balance displays and versioned capture timing.
Native local-service and independent hostile-receipt checks pass. Hosted configuration and deployment completed on 4 November. Actual provider immediate capture and partial/full refunds passed for the two wallet orders; multi-capture, authorization and void still need their own provider acceptance.
[Merchant guide](payment-capture-management.md) · [Provider acceptance](shopware-payments-acceptance.md).

## Public release of 4 November 2026

The public Core release `db0e00c9f43e4ee45a9129e3aa7caba41a8dd766`
(4 November) introduced the shared canvas, localized media captions,
guided shop setup, assistant layout and shared payment contract. Feature
walkthroughs below retain their actual local or public acceptance scope. The
separate private Rust Shopware Payments service is hosted in PayPal Sandbox, with a dedicated database and restricted runtime login. Both test shops have a server-verified Sandbox seller connection. Original Storyfront purchase, return and refund acceptance
are tracked in the payment guide.

## Persistent Ask Veyndo sidebar (3 November 2026, public acceptance)

The contextual assistant stays beside native Studio views, carrying the selected
entity/app and reusing the same conversation, saved runs and proposal owner. It
opens checked native destinations and composes working views through OpenUI with
native data. Collapsing preserves the editor draft. The public configured model
read selected product `bag`, answered Cognac/EUR 169, prepared the correct filtered
Products grid, opened its genuine product editor and navigated back to that exact
product while retaining the conversation. No commerce data was changed. A first
public mismatch was corrected; old inconsistent proposals are now blocked.
Local desktop/phone/dark-mode checks and 21 targeted UI, nine Rust and 52 native
HTTP/provider checks cover the affected path and rights.
[How to use it](agentic-workspace.md#ask-veyndo-beside-your-work) ·
[Public screenshots and acceptance](evidence/persistent-copilot-2026-11-03.md).

## Configurable merchant reports (3 November 2026, public acceptance)

Shop today and personal workspace areas share reports for ordered revenue,
orders, average value, refunds, top products, channels, observed visits,
conversion and purchase stages. Users select period, grouping, timezone, currency
and channel scope; add, arrange and resize charts/tables; save private revisioned
preferences and export authorized aggregates. HTTP and MCP share one Rust owner.
Native tests cover actual simulated checkout/POS, consent withdrawal, current
rights, isolation, private layout conflicts, historical dates and channel attribution.
Four targeted report UI tests and the related 18-test UI group pass. Desktop and
phone layouts are checked in Chrome. The final presentation image is deployed with one healthy replica and zero restarts. Public native acceptance confirms a simulated
EUR 169.00 checkout, matching sales/product/channel/consented conversion reports,
saved independent views, actual CSV export and private stage separation.
[Guide and exact metric semantics](merchant-reports.md) ·
[Observed public journey](evidence/merchant-reports-2026-11-03.md).

## Shared visual canvas (2 November 2026, publicly delivered)

Shop design and App Studio share a zoomable overview with bounded mounted previews,
collapsible tools and contextual direct editing. App placements lead into their
existing view; native product/category handoffs retain the page draft. The app
agent dock accepts screenshots and URLs, exports selected context to coding agents
and previews a proposal before adoption. Existing native versions, private previews,
permissions and selected publication remain authoritative.
[Illustrated workflow](visual-workspace-canvas.md) ·
[Native and browser acceptance](evidence/canvas-workspace-2026-11-02.md).
PR 258 is deployed on the public Core. The authenticated public shop/app overview,
native product handoff, graphical button behavior, contextual Codex task export
and immutable app version save passed after rollout. The website guide and actual
captures are published; image-provider and selected-release fixtures retain their
separate local scope.

## Merchant assistant layout (2 November 2026, local acceptance)

Welcome, source actions and input share one column in full Studio and the
contextual drawer. Empty product sidebars and the duplicate CSV control are
removed. Short actions preserve the original bounded prompts and access checks.
Local Chrome checks cover desktop, tablet, phone, landscape, French labels,
keyboard focus and draft handoff; 43 targeted UI tests pass.
[Illustrated workflow and acceptance scope](agentic-workspace.md#a-connected-conversation-surface).
The current public Core includes this source. The responsive assistant walkthrough remains the local acceptance above.

## Hosted payment service and original Storyfront (3 November 2026, public acceptance)

The independent private Rust payment service is online in simulation, with its own
logical database and restricted runtime login. The public original Lumen Storyfront
created order **RAC-ef438264** for **EUR 59.90** through the actual embedded native
checkout and nested provider form. After explicit test confirmation, the native
ledger showed captured payment. Returning updated the original bag to zero items;
it remained empty after reloading the original Storyfront.

Native Studio then refunded **EUR 0.01** and the exact **EUR 59.89** remainder.
The order and a fresh provider reconciliation showed **refunded**. Card, SEPA and
Klarna settings saved after the scoped settings payload repair. This public browser
journey accepts card simulation; other methods retain their separately named local
acceptance. [Screenshots and observed result](shopware-payments-acceptance.md#public-original-storyfront-purchase-and-refund-3-november-2026).

## External refund reconciliation (3 November 2026, local acceptance)

Provider-initiated completed refunds now use the same native receipt claims,
payment/order state and outbox. Signed capture-link notifications resolve their
original provider order; duplicate receipts, wrong amounts/currencies and native
job mismatches are rejected. Both actual Rust services and the independent Core
provider fixture passed against local HTTP PSP responses. This is additional
local acceptance, not an actual external test-account or complete parity claim.
[Evidence and remaining external prerequisite](evidence/payment-refund-reconciliation-2026-11-03.md).

## Shopware Payments acceptance (2 November 2026)

The private provider and current public Core pass local synthetic purchase,
authorization/void, pending/partial/full refund and recovery checks. Connector
1.1.0 adds exact USD/JPY amounts and refunds while retaining historical EUR 1.0.0.
The embedded provider form gains a bounded loading state, scoped readiness and
presentation-only reload. Actual local Chrome purchases on desktop and at 390px
use the private SEPA form, return to the shop and show an empty native bag. Their
partial and remaining full refunds also pass through the merchant API. External
provider browser acceptance and full original feature parity remain open. The
private service has now been publicly deployed in simulation.
[Current journeys and concrete remaining work](shopware-payments-acceptance.md).

Version 1.2.0 adds an explicit hosted simulation mode and replaces the public
placeholder with the 17-method contract. Local concurrent method, native checkout,
refund, cancellation and restart checks pass. A local Chrome SEPA purchase and a mobile card purchase
show payment confirmation, return and an empty native bag, followed by exact
partial/full refunds. The independent hosted service is running and the synthetic merchant account is
connected. The original public Storyfront card purchase, return, empty bag after reload and
full refund passed on 3 November. See the [shared service
contract](payment-provider-api.md#shared-shopware-payments-service-version-120).

## Shared image captions (2 November 2026, source and local acceptance)

Product media, Shop design image/hero blocks and App Studio image controls now
share a localized caption editor with explicit AI proposal review. Native
renderers display captions separately from alternative text. The shared operation
uses central inference, owned/bounded image evidence, current rights and enabled
shop languages. Product aggregate and app-document revision/sandbox owners remain
unchanged. [Caption and Canvas workflow](visual-workspace-canvas.md) ·
[acceptance evidence](evidence/media-captions-2026-11-02.md).
The shared Canvas is now implemented and covered by the acceptance record above.
The current public Core includes these caption controls. The caption generation and localized save walkthrough remains local; real-model wording quality has its own acceptance.

## Guided shop setup, source and local acceptance (2 November 2026)

An optional welcome and **Set up your shop** sidebar entry now connect six explicit
review areas: basics, products, design, checkout, legal information and a test.
The first step saves company name, contact email and address through the existing
native settings form. The other areas lead to existing tools. Saved personal
progress supports pause/reopen and an active live shop return banner. Controls
support EN/DE/FR/ES; AI help uses the existing assistant with bounded current step
context. Completion records the user's review.

Local acceptance includes 17 targeted UI tests, four native model/context tests,
real HTTP/PostgreSQL progress, history, MCP readback, revision and isolation checks,
two independent controllers with stale progress/reload recovery and fresh layout
preservation, and an actual browser company save, explicit step progression and
pause/reopen.
[Illustrated guide, source owners and precise verification scope](shop-setup.md).
This source is included in the current public Core. The guided setup walkthrough above remains local; a fresh hosted walkthrough and real provider acceptance are separate checks. Historical public
releases below retain their original scope and dates.

## Platform scope

The main platform contains native Veyndo commerce, apps, agents, storefronts and
inward shop migration. Original Shopware runtime compatibility and the bounded
native PHP-plugin translator are retained only on the separate
[`experiment/shopware-compatibility` branch](https://github.com/sthamann/veyndo/tree/experiment/shopware-compatibility).
Their app, controller, images and dedicated checks are removed from the main
platform. Shared sandboxed app documents and operational-record release controls
remain in the generic app system. No production data or running service is changed
by the source extraction. Existing Shopware source-import adapters and PHP price
comparison fixtures remain part of migration and native verification.

[Complete architecture, app system and AI overview](platform-overview.md).

## Connected commerce follow-ups

The [dedicated implementation checklist](plans/2026-10-30-connected-commerce.md)
tracks all 13 areas from the Fall 2026 comparison. The first delivery links
applied agent proposals to private customer tests and detecting outdated test
configuration. Saved results now appear beside native release diffs with a direct
return to the exact test. Main also includes a bounded home/content page overview
and the first-product WebMCP operation. Native PostgreSQL/HTTP checks, targeted UI
tests, component previews and an actual local browser cart/checkout-review path
are recorded in the [implementation evidence](evidence/connected-commerce-2026-10-30.md).
PRs 248–250 are integrated. On 30 October at 14:11 CET the existing release
workflow deployed Core `d56d6633`; its instance and public health check passed,
and the hosted Studio served the new frontend. The public saved-customer repeat
stopped a EUR 1.00 buyer before purchase and completed one EUR 19.90 simulated
purchase for the EUR 25.00 buyer, with current configuration evidence.

The release review opens the actual current sandbox shop in the saved profile's
channel and language, with desktop/mobile widths and a fresh configuration check.
An actual public Chrome journey completed a second EUR 19.90 simulated purchase
inside that native preview, returned to the collection and verified the empty bag.
[Public captures and exact acceptance](evidence/connected-commerce-2026-10-30.md#public-release-preview-and-completed-browser-purchase).
Native and local browser checks also cover selected publication while retaining
orders, stock and unselected changes. Automatic recorded customer-agent browser
journeys remain open.

The product preview increment and later shared Canvas are now included in the
2 November public Core. The earlier PR 251 deployment stopped at Northflank's
GitHub synchronization step on 30 October; that historical blocker does not
describe the current running release. The dated acceptance records retain
their original workflow scope.

## Verification cadence

Complete tests and coverage run daily at 02:17 UTC or on manual dispatch.
Ordinary pushes and PRs run short structural/governance checks; a green `verify`
on those events is not a fresh full-suite acceptance. Publishing an image retains
its packaged-runtime smoke check. [Cadence and exact scope](testing.md#daily-full-verification-and-short-per-change-checks).

## Current product films and screenshots

The [feature guide](features.md) and current workspace/workshop guides now use the
[2 November product screenshots and ten animated workflows](assets/product-tour-20261102/README.md).
They show the compiled native product with fictional local data. The capture run
completed a simulated coat purchase, a fictional cash sale, a saved private app
record, CSV product creation, selected product publication and explicit product
restoration. Animations are edited screenshot sequences with static frame links.
Original dated public/provider evidence remains unchanged; these illustrations
are not a new hosted-provider acceptance run.

The four [product films](video-tours.md) now use the same actual **2 November**
interface captures. They cover the shared platform, product work, a saved product
advisor app and contextual AI, including the new shared Canvas and Shop knowledge
workspace. English subtitles, silent 1080p output, downloadable VTT/SRT captions
and editable projects are shared by README, documentation, public website and
the bilingual Team hub. Current galleries use the same dated source library.
Earlier videos remain explicitly archived with their original capture dates.
[Media sources, checks and publication](evidence/product-media-2026-11-02.md).

## Product editing improvements

The product editor uses a compact header, grouped sections and a mobile selector.
Price and tax fields are grouped with expandable optional conditions. Gallery images
can be reordered by dragging or inspector controls, and variant creation opens from
the existing family overview. Category assignments now use searchable translated
paths and retained selections; channel choices explain inactive/private state and
explicit catalogue restrictions. These use the same native product saves, current
permissions and enabled content languages.
[Product workflow and screenshots](product-management.md#product-detail-workspace),
[scoped native browser checks](evidence/product-workspace-2026-10-29.md),
[category/channel consumer checks](evidence/product-assignments-2026-10-30.md).

Product content editing now groups optional identifiers/shipping flags and exposes
Preview directly beside visual/Markdown editing. Creating an own rich translation
retains the displayed source text, and empty rich content is consistent with the
product page. [Scoped content checks and captures](evidence/product-content-2026-10-30.md).

Product SEO now has a single-language form, automatic product-text defaults,
per-field inheritance and a search preview using the same metadata/path resolution
as the storefront. Invalid slugs and UTF-8 field limits are explained before saving.
Actual native save/reload and page metadata match; stock is retained.
[Scoped SEO checks and captures](evidence/product-seo-2026-10-30.md).

Specifications now separate localized product details, shared technical properties
and structured dimensions. Regional specification keys resolve independently from
plain product text; a preview includes the effective inherited values. Safe row
creation and duplicate-name checks retain existing values before native saving.
[Scoped specification checks](evidence/product-specifications-2026-10-30.md).

Manual product recommendations now retain readable selections across searches,
allow explicit ordering and use the selected content locale. The product page
renders native product cards through current cart/channel admission, with bounded
reads and no stale buyer-context results. Actual native save/reload, link opening
and deactivate/reactivate checks pass locally.
[Recommendation journey](evidence/product-recommendations-2026-10-30.md).

The recommendation release **`3ff4b3cd` (PR #245)** was observed publicly on
30 October at **07:59:55 CET**, in image `intrepid-verse-6271`, after fresh snapshot,
successful migration and Core readiness. The hosted private stage and product
revision 6 were retained without modifying hosted products.
[Release evidence](evidence/product-recommendations-2026-10-30.md#public-release).

The specification release **`7eeafda7` (PR #244)** was observed publicly on
30 October at **07:26:08 CET**, in image `ordinary-rake-9060`, after fresh snapshot,
successful migration and Core readiness. The three groups retained the signed-in
private stage, product revision and saved state without hosted product mutations.

The SEO release **`b595992e` (PR #243)** was observed publicly on 30 October at
**06:58:45 CET**, in image `gifted-bed-5657`, after a fresh snapshot, successful
migration and Core readiness. The new form and preview retained the signed-in
private stage, product revision and saved state without mutating hosted products.

The content-editing release **`a9b48d18` (PR #242)** was observed publicly on
30 October at **06:27:25 CET**, in image `mammoth-thread-2908`, after a fresh snapshot,
successful migration and Core readiness. The hosted Studio retained the signed-in
private stage, product revision and saved state while opening the new content preview.

The category/channel release **`eae42b39` (PR #241)** was observed publicly on
30 October at **05:59:45 CET**, in image `delicate-twist-6266`, after a fresh snapshot,
successful migration and Core readiness. The public Studio retained its signed-in
private stage/product revision, selection during zero-result searches and readable
main-channel name. Hosted products were not mutated by that public observation.

## 29 October connected platform work

The eight approved follow-ups use the existing native owners, authorization,
versioned definitions and private publication path. Their source changes are
merged with complete required CI:
[PR #225](https://github.com/sthamann/veyndo/pull/225),
[#226](https://github.com/sthamann/veyndo/pull/226),
[#227](https://github.com/sthamann/veyndo/pull/227),
[#228](https://github.com/sthamann/veyndo/pull/228),
[#229](https://github.com/sthamann/veyndo/pull/229) and
[#230](https://github.com/sthamann/veyndo/pull/230).

| Outcome | What was actually exercised |
| --- | --- |
| Faster verification | Independent native partitions, exactly-once suite admission and same-source coverage collection retain all final floors. The observed native critical chain fell from 37m13s to 31m18s. [CI evidence](evidence/parallel-verification-2026-10-23.md). |
| Agent-composed Studio views | A real model selects registered native grid, detail and intake components. Pin/reload, current rights, actual editor navigation and private CSV creation pass locally and publicly. [Public journey](evidence/platform-followups-hosted-2026-10-29.md), [contracts](evidence/composed-workspace-2026-10-29.md). |
| Description-led app creation | Actual consultation app generation, product relation, file upload, status, team setting, private records, selected package publication and restoration as a new version pass locally. The original merchant brief also generates and saves the native package with the actual public model; public preflight, sandbox installation, private upload, status update and full reload retain the actual record. [Full app journey](evidence/guided-app-2026-10-29.md), [public app acceptance](evidence/platform-followups-hosted-2026-10-29.md#public-description-led-app-generation). |
| App upgrade admission | Saved data, explicit migrations, examples, current Flow actor rights and active payment consumers participate in the ordinary native installation check. The browser refuses an incompatible update and retains records through a compatible one. [Upgrade evidence](evidence/app-upgrade-2026-10-29.md). |
| Customer profiles and browser comparison | The same saved English/German profiles run before and after a stock repair; the actual browser completes the German simulated purchase and returns to an empty basket. Durable stop/resume and private/live separation are checked separately. [Browser evidence](evidence/customer-browser-2026-10-29.md). |
| Connected shop/app designers | Actual palette insertion, drag repositioning, arrows, deletion and undo pass in the browser. The agent follows the selected section; real screenshot analysis produces three reviewable page-style proposals and saves one private revision. [Designer evidence](evidence/designer-2026-10-29.md). |
| Inward WooCommerce migration | An actual disposable WooCommerce source supplies eight supported areas. Interrupted Rust service recovery, exact replay and content comparison pass, followed by a native browser purchase and empty basket. [Source evidence](evidence/woocommerce-source-2026-10-29.md). |
| Restore and operational chain | An isolated local restore matches all 150 public tables. Existing Rust services complete simulated capture/refund, actual local SMTP, invoice and separate cancellation, followed by strict system/tenant scope checks. Apple callback configuration is saved and publicly admitted. [Restore evidence](evidence/restore-drill-2026-10-29.md), [public observations](evidence/platform-followups-hosted-2026-10-29.md). |

A local database restore remains distinct from a hosted disk-snapshot restore.
Apple's ordinary account form now loads for both Veyndo entry domains; an
actual authenticated Apple sign-in and return remain separately unobserved.
The current public artifact and latest merchant journey are recorded below.

The 23 October release expands selected Lean guarantees to **63 policies / 149
properties**, splits their Rust/Lean owners and tightens Cargo dependency checks.
The subsequent shared discount repair and batched marketplace order localization
also pass complete required CI: **322 Rust tests**, **816 frontend tests**, native
database integration and coverage gates.
[Verification, modularity and release evidence](evidence/formal-modularity-2026-10-23.md).

Release checks report the complete frontend result independently of native
integration. Documentation and website changes outside the packaged runtime also
skip unrelated container builds. Main documentation/frontend checks now start
while an earlier native run continues; only native work shares a queue.
The same required tests, coverage policy and source/report checks remain in force.
[Measured CI results and main scheduling](evidence/parallel-verification-2026-10-23.md)
and [image publication scope](testing.md#image-publication-scope).
These CI improvements are merged through PR #217; the runtime and dated public
journeys below retain their accepted versions.

## What is online now

The actual public homepage also runs the current four-language explanation and
29 October app/customer screenshots. Its existing Experience owner deployed
`5c1afc2` (`wild-party-5333`) at **17:08:29 CET**; English/German copy, current
proof links and the app image were checked on the live page. The handbook and
README are published from their separate public Core owner.
[Homepage ownership and observed rollout](evidence/platform-followups-hosted-2026-10-29.md#actual-public-homepage-owner).


The gallery/variant release **`3425ddcf` (PR #240)** was observed publicly on
29 October in image `educated-water-3744`. Its snapshot-backed workflow finished
at **20:41:42 CET**, with a successful migration and running Core. The browser
retained the signed-in private stage and product revision, and showed the new
variant entry and gallery controls. This is a scoped editing observation.

The product pricing release **`dd03e76b` (PR #238)** was observed publicly on
29 October after the snapshot-backed workflow completed at **20:12:55 CET**.
Image `hungry-flame-954` passed migration and readiness. The actual public Studio
showed the new price/tax groups and retained the signed-in private stage, product
revision 6 and stock 2. These observations concern product editing, not a repeated
complete checkout acceptance. The preceding **`69fd4568` (PR #234)** release fixed
column controls inside narrow installed-app tables.

The preceding functional release **`d65bc050` (PR #232)** also passed complete
main CI. The original public model request creates and saves the native
consultation package; installation review under the restricted database
connections passes. The installed private product view retains an actual
consultation request, private file and updated status after a full browser
reload, including the subsequent UI rollout.

The preceding same-day releases passed public native working-view/CSV intake,
saved customer scenarios, designer drag/drop, URL-based design proposals, private
revision adoption and a subsequent German simulated purchase with an empty basket
after return and reload.
[Current public screenshots, exact orders and source versions](evidence/platform-followups-hosted-2026-10-29.md).

### Previous dated releases

The 23 October functional change **`7bd37916` (PR #211)** was delivered as
Core image `befitting-river-8632` on **23 October at 18:05:26 CEST**. Its serialized
release completed at **18:07:11 CEST**, after a fresh snapshot, successful migration
job and health-checked rollout. Marketplace order import now resolves all admitted
line names in one query while retaining localization, tenant isolation, frozen
amounts, stock locks and replay behavior. Public simulated order **`RAC-7cf70dc0`**
completed afterward for **EUR 59.00**, including **EUR 9.42 VAT**, with the German
lamp name. Return, full reload and the reopened cart confirmed zero items and
retained the disabled personalization choice.
[Exact CI, query-plan and public release evidence](evidence/external-order-batching-2026-10-23.md).

The preceding Core image `dynamic-garden-8477`, source **`363181dd` (PR #209)**, was deployed on
**23 October at 15:14:51 CEST** and completed its health-checked rollout at
**15:16 CEST**, after a fresh snapshot and successful migration job.
Its acceptance observed one running instance, passing health checks and zero restarts.
The shared allocator preserves exact cent rounding for large baskets, and app
price increases reject overflowing totals before changing a quote.
Public simulated order **`RAC-b8059d75`** completed afterward for **EUR 349.00**,
including **EUR 55.72 VAT**, with its German product name. Return and full reload
retained an empty cart and the existing privacy choice. This is a fresh native
checkout acceptance; the dated Storyfront and authentication observations below
retain their original dates.
[Exact CI and public release evidence](evidence/formal-modularity-2026-10-23.md#discount-repair-complete-ci-and-public-rollout).

Core and Studio now include editable catalogue-based test customers from
[PR #203](https://github.com/sthamann/veyndo/pull/203), alongside the connected
customer-scenario, catalogue-preparation, app-diagnostics and visual-shopping
release. Image `loyal-line-5143`, source `2bb5a99f`, activated on **22 October at
19:55 CEST** after a fresh snapshot and successful migration-only job. The public
German-Studio / French-only-channel journey completed two private simulated
purchases and an exact-budget refusal. Reload and reuse retained the original
profiles and orders; the 390 px mobile view fits without horizontal overflow.
The [complete required CI run](https://github.com/sthamann/veyndo/actions/runs/39824617289)
passed on the final source, including all 816 frontend tests and the native
database integration. PR #203 merged normally as `35755608`; its complete Git
tree is identical to the publicly accepted `2bb5a99f` tree.
The regular main release then completed at **20:39 CEST**: image
`jovial-steel-7373`, a second fresh snapshot, successful migration job and a healthy
Core instance with zero restarts. The saved cohort remained available after reload.
[Exact runtime and browser evidence](evidence/customer-scenarios-2026-10-22.md#public-catalogue-profile-acceptance).

The preceding catalogue/privacy release was accepted on the same date; its
[earlier exact evidence](evidence/merchant-journey-2026-10-22.md#public-delivery-and-acceptance)
remains available.
The separate Experience service was observed running `b7c29ea6` on 23 October,
including the new film project/subtitle downloads and the earlier four-language
homepage's simulator, catalogue-preparation and visual-shopping entry. The
23 October formal release does not change its original Storyfront pin or checkout
code. The prior combined release, [PR #191](https://github.com/sthamann/veyndo/pull/191),
passed the public two-account company purchase and original embedded Storyfront
purchase/return/empty-cart checks. The approver inbox and reopened orders show their
accepted app configuration. The original embedded journey was repeated against
both final public services on 22 October: `RAC-b39c3fe0`, EUR 59.90, receipt return
and empty original Bag after reload. Native incognito input loaded the iframe on
its first open; an earlier separate extension-controlled tab still timed out.
[Final acceptance and retained counterexample](evidence/customer-scenarios-2026-10-22.md#public-acceptance-after-the-final-rollout).

The connected merchant workspace now supports these concrete journeys:

- Attach a CSV in the conversation, carry a product description or URL into the
  private source workflow, edit the preview and publish selected native products.
- Complete a purchase, return to an empty cart and retain the original revocable
  privacy choice without answering the same prompt again.
- Describe a collection task; prepare a native category, selected product changes,
  translations and a landing page in a private workspace; review and publish the
  chosen changes together.
- Create and configure an app, edit its records, preview privately and publish a
  selected package without publishing unrelated test data.
- Configure a desk with material and dimensions; save the selection, obtain an
  independent company approval and buy. Reorder at the current price while the
  original order retains its accepted configuration.
- Turn completed native work into an event-driven Flow draft with explicit input
  mapping, limits and a fresh personal review before execution.
- Compare a saved rule with an unsaved draft on recorded order-placement inputs,
  with the same native interpreter and no changes to existing orders.

## Private customer scenarios

The customer simulator is online on existing durable agent tasks: one to six
editable fictional profiles, bounded concurrent native shopping, exact budgets,
saved observations, resume/stop and before/after comparison. Designer, installed
sandbox apps and migration targets open the same workbench.
[Usage and exact scope](customer-scenarios.md). **Test customers from my catalogue**
now prepares three editable suggestions from visible channel products, without
customer records or an additional model call. Preview, adoption and test start
are separate actions. Profiles use the channel's enabled shopper languages even
when Studio uses another interface language. Public acceptance used the actual
configured model, exact-budget refusal, Germany/Austria purchases and the earlier
private notebook stock change. The connected catalogue
preparation grid, actionable app-reference diagnostics and visual shopper selection
are included in the combined public artifact; [implementation and browser evidence](evidence/customer-scenarios-2026-10-22.md#connected-catalogue-and-app-follow-through).

## Public acceptance

| Journey | What was observed | Evidence |
| --- | --- | --- |
| Native checkout after import batching | Public simulated order `RAC-7cf70dc0` completed on the new Core for EUR 59.00 with EUR 9.42 VAT and the German lamp name. Return, full reload and reopened cart confirmed zero items. The separate marketplace callback fixtures measured one translation query for 1, 20 and 24 lines, including strict signed tenant scope. | [23 October import release](evidence/external-order-batching-2026-10-23.md#public-purchase-after-rollout) |
| Native checkout after the discount repair | Public simulated order `RAC-b8059d75` completed on the new Core for EUR 349.00 with EUR 55.72 VAT and the German desk name. Return, full reload and the reopened cart confirmed zero items. Exact three-line discount allocations and frozen order values passed both native CI database modes separately. | [23 October discount release](evidence/formal-modularity-2026-10-23.md#discount-repair-complete-ci-and-public-rollout) |
| Catalogue-based test customers | German Studio prepared three French profiles from the channel's only notebook. The EUR 28.89 profile stopped; Germany and Austria orders completed for EUR 28.90 and EUR 29.14 with the stored French product name. Private orders increased from four to exactly six. Reload, profile reuse and 390 px mobile layout passed. | [Public profile preparation and purchases](evidence/customer-scenarios-2026-10-22.md#public-catalogue-profile-acceptance) |
| Visual shopping, catalogue preparation and app diagnostics | Final public cards showed the actual notebook and holder, EUR 63.40 together. Removal survived detail/back; restore retained cart zero. Native purchase `RAC-eb78b7d7` completed for EUR 28.90 including EUR 4.61 VAT; return/reload retained an empty cart and privacy rejection. Five-language readiness opened the correct media editor; app diagnostics retained draft protection. | [Final combined release acceptance](evidence/customer-scenarios-2026-10-22.md#public-acceptance-after-the-final-rollout) |
| Private customer scenarios | Three agents stopped at stock zero; after restoring private stock, two native EUR 28.90 orders completed while the EUR 1.00 buyer still stopped. Exact profiles and saved comparison survived reload. | [22 October simulator acceptance](evidence/customer-scenarios-2026-10-22.md#public-rollout-and-customer-scenario-acceptance) |
| Catalogue from the conversation | Actual composer CSV attachment, editable two-product preview, private save, publication of only the named chair, retained private side table and native image editing. Description and URL handoffs retained the current sandbox. | [22 October public journey](evidence/merchant-journey-2026-10-22.md#public-delivery-and-acceptance) |
| Purchase privacy continuation | Public simulated order `RAC-65c8482b`, EUR 59.00, German product name and EUR 9.42 VAT. Return and full reload retained an empty cart and the prior optional privacy rejection; settings remained editable. Native expiry, revocation, concurrency and company-identity cases also passed in CI. | [Public purchase and tests](evidence/merchant-journey-2026-10-22.md) |
| Collection preparation and selected publication | The configured model prepared five connected steps for two selected products. The same task resumed without duplicating its category. Reviewed Italian translations and the landing page were published together; a EUR 49.90 purchase retained the Italian product name. | [Collection and release history](evidence/release-history-through-2026-10-21.md#21-october-connected-collection-preparation-runs-publicly) |
| Personal workspace and generated app | Current editor context, saved private guidance, editable product filters, two approved native category steps, reload continuation and a generated English/German care-note app with retained records and central settings. | [Workspace browser evidence](evidence/agentic-workspace-2026-10-20.md) |
| Configured company purchase and reorder | First order `RAC-f117d21d`: Walnut Select, 260 × 80 cm, EUR 78 surcharge, EUR 427 total. After a material change, saved-list reorder used Walnut Select Plus, EUR 98 surcharge and EUR 447 total. The final all-browser repetition `RAC-34c09fc1` used separately signed-in buyer/approver sessions; approval and reopened orders displayed those exact values. Return/reload retained an empty cart; the original order still shows its older material and price. | [Public steps and screenshots](evidence/furniture-browser-2026-10-21.md#public-two-account-browser-acceptance-after-the-combined-release) |
| Repeat completed work | A completed task opened as an inactive Flow draft. After explicit activation, one real product update prepared a fresh review; approval created exactly one hidden native category. Completion survived reload and the category stayed private. The test Flow is inactive again. | [Flow browser evidence](evidence/flow-native-work-2026-10-21.md#reusing-completed-work-public-acceptance) |
| Compare recorded rule cases | A EUR 49.90 frozen case did not match the saved EUR 100 threshold and did match the draft EUR 1 threshold. Editing cleared stale results; reload retained the saved revision and unchanged order count. Desktop and 390 × 844 mobile Studio passed. This is condition comparison, not complete historical checkout repricing. | [Rule comparison](rule-history-comparison.md) |
| Repair missing product content | The assistant identified missing German text/media on one selected private product. A scoped translation was reviewed and applied; price and stock stayed unchanged. No completed image-generation claim. | [Product gap evidence](evidence/product-gaps-2026-10-21.md) |
| Original Storyfront embedded checkout | After both 22 October public deployments, the first iframe open loaded normally and `RAC-b39c3fe0` completed for EUR 59.90 with a German lamp name and EUR 9.56 VAT. Receipt return and full reload retained an empty original bag. No retry, user manual test or separate checkout navigation. Earlier extension-controlled tabs had paused/blank document loads. | [Current release purchase and screenshots](evidence/customer-scenarios-2026-10-22.md#public-homepage-follow-through), [21 October acceptance](evidence/storyfront-checkout-2026-10-21.md#final-combined-release-first-load-purchase-and-empty-cart-reload) |
| Native app extensions and workflows | Visual product fields, retained data on upgrade, native grid/filter integration, selected publication and distinct old/new order workflows were accepted publicly. | [Product fields](evidence/native-app-fields-hosted-2026-10-17.md), [app workflows](evidence/native-app-workflows-hosted-2026-10-17.md) |
| Inward agentic commerce | Native UCP transfer purchase, private Shopify variant intake, app declaration diagnostics and original embedded checkout passed. | [18 October acceptance](evidence/agentic-commerce-hosted-2026-10-18.md) |
| Native POS and documents | Fictional POS sale, native invoice/PDF and guarded app-bound completion passed on 17 October. Physical printers and real settlement were not part of that acceptance. | [Buyer/POS evidence](evidence/buyer-pos-hosted-2026-10-17.md), [PDF follow-up](evidence/receipt-pdf-hosted-2026-10-17.md) |
| Browser entry and retained sessions | Public Google entry, workspace selection and single-use Studio handoff repeated on 22 October; reload after rollout retained the authenticated workspace. Password sign-in/reload/logout last passed publicly on 16 October. Apple callbacks saved on 29 October; both public entry routes pass redirect admission. Actual Apple sign-in remains separate. | [22 October evidence](evidence/merchant-journey-2026-10-22.md), [browser session contract](browser-sessions.md) |

## App system and architecture

| Area | Implemented foundation | Remaining boundary |
| --- | --- | --- |
| App storage | Shared bounded records, references, indexes, settings and immutable packages; four fixed physical tables replace per-app physical tables. Public legacy-data migration was verified. | Capacity depends on measured workloads; shared storage is not a promise of unlimited throughput. [Storage model](app-data-storage.md) |
| Native object extensions | Versioned product/customer/order/company fields feed native details, grids, exact filters and permission-aware operations. Product lifecycle passed publicly; the other object types have local/CI coverage. | Broader arbitrary object types and every external protocol need their own contract and acceptance. [Extension contract](app-core-extensions.md) |
| Sandbox and app lifecycle | Private previews, current rights, version/digest checks and selected configuration publication use the same native owners. Material upgrades preserve historical orders. | Arbitrary Rust/TypeScript source compilation and hosting are not established by managed app packages. [App system status](app-system-status.md) |
| Agents and model tools | Durable checkpoints, leases, cancellation, reviewed native writes, distinct revocable identities, model allocation limits, emergency stop and OpenAI/Claude/Ollama tool protocols. | Real provider quality and invoiced cost are separate from fixtures and conservative allocations. [Controls](agent-authority-controls.md), [durable work](durable-agent-runs.md) |
| Authorization and database isolation | Current tenant/actor rights, separate restricted SQL roles, strict startup and native API/MCP operation checks. | Every new operation must retain those controls; an earlier audit is not whole-system certification. [Hosted database enforcement](evidence/database-enforcement-2026-10-15.json) |
| Events and workers | Separate cognition/apps/flows/audit checkpoints, durable traces, bounded workers, fenced retries and per-tenant admission. | Fleet throughput, failover and large-catalogue limits require representative measurement. [Rust service ownership](rust-services.md) |
| Contracts, boundaries and money | Generated operation input contracts, five real workspace libraries, exact money primitives and original PHP differential checks. | Response/domain DTOs and root-handler extraction remain incomplete; compatibility calculation paths still contain `f64`. [Hardening owners](platform-hardening.md) |
| Prompts and evidence | Versioned prompt files with IDs/digests; actual provider/admission and injection cases in the registered tests. | Passing admission checks does not establish semantic model quality for every merchant task. [Testing](testing.md) |

## Proposed next improvements

The 22 October merchant catalogue and privacy continuation changes are online and
accepted as described above. The connected image/translation progress view, app-reference diagnostics and
editable visual shopper selection are included in the current public release.
The first measured import improvement now resolves names for a 24-line order in
one query instead of 24. The same query uses existing indexes in a test shop with
200,059 products. Further throughput measurements and shared order-persistence
work remain separate. [Import verification](evidence/external-order-batching-2026-10-23.md).
[Concrete architecture improvements discussed with Claude](architecture-followups-2026-10-22.md)
are proposals, separate from this implementation.

## What remains to finish

1. **Isolate the remaining controlled-browser iframe failures.** A fresh private
   session now completes first load, purchase, return and empty-cart reload with
   native browser input; a normal-window first-open countercheck also passes.
   Earlier extension-controlled tabs reported paused/blank
   documents on the same deployed code. Preserve both observations; the cause of
   those earlier pauses and a broader reliability rate are not yet established.
2. **Complete Apple login configuration.** The new `start.veyndo.ai` callback
   previously returned `invalid_request: Invalid web redirect url`. Both new
   domains and callbacks are now saved in the existing Service ID; both public
   entry routes pass Apple's redirect admission. An actual authenticated Apple
   sign-in, return, reload and logout must still be observed.
3. **Accept the separate hosted migration service.** The Rust application and
   five source protocol fixtures reach private native products, media, pages,
   customer/address records, history, reviews and coupons. Saved mapping/comparison
   and reviewed cutover controls exist. Hosted gateway/callback setup and one
   complete public source-to-purchase journey remain open. [Migration guide](agentic-migration.md)
4. **Accept external integrations at their real destination.** Vercel, Klaviyo,
   HubSpot, Contentful and Algolia apps, Shopware 6 inward product intake and
   existing Shopify/WooCommerce/Slack routes have local fixtures. Actual provider
   activation, Nexus execution and external Vercel checkout need their own
   recorded outcomes. [Integration guide](service-integrations.md)
5. **Measure remaining operational claims.** Real provider payment/mail/refund,
   recovery from a hosted snapshot, large-catalogue/multi-worker throughput, complete
   historical checkout repricing and isolated arbitrary-source builds are not
   established by the public demo journeys. Current payment testing deliberately
   remains simulated. The isolated local restore and local Rust SMTP/provider
   chain are now recorded above. [Ordered follow-ups](connected-merchant-followups.md)

The earlier fresh-cart privacy regression is fixed and accepted in the public
native purchase above. Same-buyer company continuation, expiry and withdrawal
were additionally checked through actual native PostgreSQL transactions in CI.

## Start testing

1. [Take the first shop tour](first-tour.md).
2. [Build and privately test an app](app-tutorials/README.md).
3. [Review and publish selected changes](workbench.md).
4. [Understand the shared architecture](production-architecture.md).

The [dated release history](evidence/release-history-through-2026-10-21.md) retains
older versions and their exact acceptance limits. Implementation notes belong in
[CHANGELOG](../CHANGELOG.md), verification contracts in [Testing](testing.md), and
measured capacity in [Benchmarks](benchmarks.md).
