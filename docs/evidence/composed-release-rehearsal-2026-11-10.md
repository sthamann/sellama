# Composed release rehearsal

On 10 November 2026 a fresh PostgreSQL 17.11 cluster started Core, the
independent Checkout and Connector, and an app worker on Darwin arm64. Each
journey provisioned a fresh Core database, a Checkout session database and a
standalone Connector database. The latter two used dedicated runtime roles.
Cargo built the three binaries from the sources below with `--locked`.
The worker used the same Core binary in its `app-worker` role.

## Resolve the release inputs

| Component | Source used to build | Runtime and contract |
| --- | --- | --- |
| Core | [Veyndo at `a3d9b8d3`](https://github.com/veyndo/veyndo/commit/a3d9b8d3c4648841f92d4e8aa283c4d4b810f9ec) | 0.5.0. Store API, merchant orders, receipts, app gateway and Flow Builder. The migration ledger runs through `112-hosted-checkout-recovery`. |
| App worker | Same source as Core | Same native order outbox and versioned Flow definitions. The worker opens the migrated database in serve mode. |
| Checkout | [Checkout at `eaa34f27`](https://github.com/veyndo/checkout/commit/eaa34f27386e0de2b34de6085fef78ac237943e9) | 0.1.0. Session API under `/v1/sessions` and OpenAPI at `/openapi.json`. Checkout database schema marker `veyndo-checkout-sessions`, version 1. |
| Connector | [Connectors at `fc36cad5`](https://github.com/veyndo/connectors/commit/fc36cad517533a18922966c7f3aa2322860ce19c) | 0.1.0. Standalone namespace profile, pinned `contract/actions.json` and schema emitted by the binary. |

The Core and worker source used locally has the same tracked runtime inputs
as the hosted Core `99b0aec6` and worker `687bbae8`. The hosted deployments
report those two distinct build revisions. Northflank also reported the
Checkout and Connector source revisions listed above. These observations
identify source and build provenance. The rehearsal used local Cargo
binaries. Rebuilding and booting the full set of production OCI images with
resolved digests, hosted runtime configuration and every supporting service
remains a separate release gate.

The input fingerprints below are SHA-256. For the two independent schemas,
hash the stdout of the corresponding binary with `--print-schema`.

```text
Core Cargo.lock         8b5ea57ffffaf8c19e6671af92cda0a0cd470c06bb0d769789de04f0afff9f75
Core components.lock    27888ec784bd2d1a4541f398e6cf65db00c2634737793edb4a98cd7d21d26233
Core migration 112      7282172a7c6edceedc6e639d9e8592d389c32af45ef1f8362dab522a67f806de
Checkout Cargo.lock     caf1b66985a1f63e49757358ecbf09ca48899cb4df5a03017a4ad08dae352cdf
Checkout schema         d9ba0fbc7902fff8e77fcce01fb19c443fb61069fc13c767c2de3e1af496c541
Connector Cargo.lock    c26f89bf44307374d61a98ee7dd156cda21facbe5abe88c3a119b646d42da4c0
Connector actions       18238ab8cb67a1c5d56bacc5206b645ade124eaec61656ed1016f8fd54294a5f
Connector schema        a16139728207f4222676702663ef3466dee1396363ecefcecd14c917b118b83d
```

## Run the recovery checks

Build Core using `cargo build --locked --bin veyndo`, Checkout using
`cargo build --locked --manifest-path service/Cargo.toml`, and Connector using
`cargo build --locked`. The run used Cargo and Rust 1.99.0. In a Veyndo checkout
that includes the new regression, make the pinned Core executable available
at `target/debug/veyndo`. Use a disposable PostgreSQL cluster and the
[Connector test configuration](../connector-component.md#verify-the-complete-shop).
For the direct native runner, set `TEST_PSQL` to the local executable.
Set `MERCHANT_TOKEN` and `PLATFORM_SECRET_KEY` to disposable test values.
Then run:

```sh
DEMO_CATALOG=legacy-furniture \
CHECKOUT_TEST_BINARY=/absolute/path/to/veyndo-checkout-service \
CONNECTORS_BINARY=/absolute/path/to/connectors \
python3 scripts/email_tests.py \
  Contracts.test_independent_checkout_rollback_and_worker_restart \
  Contracts.test_independent_checkout_capture_drives_invoice_mail_and_refund
```

| Interruption | Observed recovery |
| --- | --- |
| Client discards a successful confirmation body | A restart of independent Checkout followed by the original confirmation returns the committed order. The shop has one order and one stock decrement. |
| Independent confirmations are paused and the app worker is stopped | The paused route returns HTTP 503. The original customer still reads the same order and invoice. A distinct native cart can buy, and repeating that purchase returns the same second order. There are two orders and two stock decrements. |
| The worker restarts and independent confirmations resume | The pending native order gains one invoice and one loopback SMTP delivery. Resuming the separate route and replaying the first confirmation preserves both orders, the first invoice and the total of two messages. |
| A separate payment fixture delays verified capture | Before capture, no invoice or mail is produced. After capture, the configured Flow generates one invoice and one matching Connector/SMTP receipt. Replaying the refund keeps the original payment, order, invoice and stock effect. |

This is a rollback of purchase routing. Database schema downgrade and a
failure inside the uncommitted Core transaction are separate tests. The
fixtures cover neither hosted mail delivery nor provider uptime or capacity.
The [release checklist](../commerce-components.md#release-acceptance-order)
tracks those separately.


## Compare the two purchase routes under load

The same pinned binaries ran the two existing mixed traffic tests in
separate disposable shops. Each run used 200,000 synthetic products,
240 catalog reads, 48 simulated purchases and 16 assistant requests.
Each test verified one stock decrement, one invoice and one SMTP receipt
per purchase. The assistant used a local model fixture.

| Purchase route | p50 | p95 | p99 | Purchases retried | Total retries |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native | 33.33 ms | 55.63 ms | 58.86 ms | 0 / 48 | 0 |
| Independent | 35.65 ms | 2051.50 ms | 2070.54 ms | 8 / 48 | 12 |

The median differs by 2.32 ms in this run. The slower independent
confirmations include the explicit retry waits when admission is refused.
A low median therefore does not describe what every buyer experienced.
See the [paired test commands](../benchmarks.md#run-the-same-load-through-independent-checkout).
The measurements are for local debug binaries. They do not establish the
same percentiles or the capacity of the deployed services.

For the hosted comparison, use a dedicated fixture deployment or isolated
test tenant with enough inventory and independent Checkout enabled for the
test tenant only. Keep image digests, database placement, replica counts,
concurrency, fixture data and request schedule fixed between the two runs.
Record pre-forward refusal counts and retry waits separately from accepted
request latency. Compare the purchase attempts with committed orders,
stock allocations and the outbox after each run. Report provider callback
capacity as a separate workload.

## Northflank rehearsal with deployed executables

A follow-up on 10 November used a separate Northflank project in Europe
West with one manual job, no public ports, no linked production secrets,
and no production database. The Linux x86-64 job used the
`nf-compute-200-4` plan and a fresh Debian PostgreSQL 17.11 cluster.
`fsync`, `synchronous_commit` and `full_page_writes` were enabled.
Core, Checkout, the app worker and Connector ran as separate processes
inside that job and used loopback addresses. Checkout and Connector had
separate databases and dedicated runtime roles.

The executables were copied from the four running services. Their SHA-256
checksums matched both the production container files and the files started
in the test job. Core and its worker had different build revisions and
byte-identical executables. The rehearsal code was pinned to Core
`76ca4eb2c13ed257a408c42462018ab4205ece2b`.

| Service | Deployed source revision observed | Executable SHA-256 |
| --- | --- | --- |
| Core | `76ca4eb2c13ed257a408c42462018ab4205ece2b` | `485b851124edddf174d094441e32beb65fab256910bb7f280487a3f0da0916d8` |
| App worker | `687bbae83dd3c5c07d3bf97009fb2f07e2d2510c` | `485b851124edddf174d094441e32beb65fab256910bb7f280487a3f0da0916d8` |
| Checkout | `eaa34f27386e0de2b34de6085fef78ac237943e9` | `be10b8fe602248796ba0bd224819ccf0a180d809d442f7e5b8d226c8a20b9120` |
| Connector | `fc36cad517533a18922966c7f3aa2322860ce19c` | `a4de4879de28fae10b4b31171b9536449c67c0913619371f15e8d49e1603c8d7` |

Both recovery tests above passed. The run recovered the original order
after response loss, preserved its invoice during the routing pause and
processed a distinct native order when the app worker restarted. The
payment fixture completed capture, invoice, mail and refund. The job
exited with code 0 at 12:19 UTC.

### Hosted paired load

Each arm used a fresh test shop with 200,000 synthetic products, 48
purchase confirmations, 240 catalog reads and 16 assistant calls. The
same driver used up to 12 purchase clients, four catalog clients and one
assistant client concurrently. Both arms matched each of the 48 orders
to one stock decrement, one invoice and one loopback SMTP message.

| Route | Confirm p50 | Confirm p95 | Confirm p99 | Orders with retries | Total retries | Worker restart to last mail |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Native | 260.48 ms | 430.84 ms | 540.24 ms | 0 / 48 | 0 | 10.54 s |
| Independent | 222.44 ms | 3195.01 ms | 4171.13 ms | 11 / 48 | 27 | 13.45 s |

The independent confirmations include the wait after a retryable HTTP
429. The 3.20 s p95 is buyer-visible time in this driver. The sample does
not separate that wait from accepted-request processing or isolate
provider callback throughput. Since the services share one job, these
numbers exclude the service-to-service network and separate resource
limits of the production deployment. The purchase and SMTP tests use
fixtures and do not establish provider availability or mailbox arrival.

To repeat the job, copy only the approved executable files from the
active containers and verify their checksums again in the test container.
In a disposable `postgres:17-bookworm` job install Python, cryptography and
OpenSSL, start PostgreSQL on loopback, and run the recovery commands
above followed by the [two mixed traffic tests](../benchmarks.md#run-the-same-load-through-independent-checkout).
On Debian Python 3.11 invoke the suite with the script directory after the
standard library so `scripts/platform.py` cannot shadow Python's module:

```sh
python3 -P -c 'import runpy,sys; sys.path.append("scripts"); runpy.run_path("scripts/email_tests.py", run_name="__main__")' \
  Contracts.test_independent_checkout_rollback_and_worker_restart \
  Contracts.test_independent_checkout_capture_drives_invoice_mail_and_refund
```

The complete hosted gate still needs pulls by OCI digest, the full set
of services with their own deployments and a separate provider callback
capacity test. An executable checksum covers the program file used here.
It does not cover the libraries, startup configuration or filesystem of
its production image.

### Hosted relay admission comparison

The follow-up used the same isolated Northflank job plan and PostgreSQL
settings as above. The Core executable came from running build
`workable-river-5946` at [`9ed1c0bb`](https://github.com/veyndo/veyndo/commit/9ed1c0bb2613a2ad1eca9847c2d4e1b14f987ab7).
Its SHA-256 was
`8bcfb2db2ec2f9aa6c61950b863db5a871a0cdc15ad1e887e272164a1004c992`.
The job checked this fingerprint before execution. It used the original
Core executable from the preceding table as the baseline and ran the
same Worker, Checkout and Connector executables for all three arms. The
Worker stayed on `687bbae8`, Checkout on `eaa34f27`, and Connector on
`fc36cad5`. Set `APP_WORKER_TEST_BINARY` to an absolute Worker binary
path to reproduce that distinction with the existing test.

Each arm used a fresh test shop, 200,000 synthetic products, 48 purchase
confirmations, 240 catalog reads, 16 assistant requests and a worker
restart. The new Core runs in the public shop. The test workloads ran in
separate databases inside the isolated job with simulated payments and
loopback SMTP.

| Route and Core | Confirmation p50 | Confirmation p95 | Confirmation p99 | Orders with retries | Retries |
| --- | ---: | ---: | ---: | ---: | ---: |
| Independent, before | 269.03 ms | 4,078.00 ms | 4,202.43 ms | 11 / 48 | 30 |
| Independent, with bounded waiting | 476.62 ms | 1,717.01 ms | 1,924.65 ms | 9 / 48 | 9 |
| Native, updated Core | 226.34 ms | 298.18 ms | 380.77 ms | 0 / 48 | 0 |

Each purchase committed one order and one stock decrement and produced
one invoice and one SMTP fixture receipt. The independent p95 improved
by 58% while its median rose. The test includes the buyer's retry wait.
The updated Core also passed route pause, worker restart, lost
confirmation recovery and provider-fixture capture and refund. Local
Chromium passed the desktop pre-dispatch retry and mobile lost response
scenarios, preserving the original receipt and empty cart after reload.

The isolated run `fb6f5c9a-b2c7-4629-b1fe-80e0710347ae` completed at
13:02 UTC. It used the production executables with fixture credentials.
The later [separate service placement test](#compare-the-checkout-routes-across-separate-services)
measured both demo purchase routes. Provider callback load remains open.

## Match the deployed builds to image manifests

At 13:50 UTC, Northflank's deployment API reported these source revisions
and build IDs for the active services. For each build, the build log
reported exactly one distinct manifest digest pushed to the managed
registry. The image library reported each matching build tag ready. Core and
the app worker use the same build service with different build IDs. The
recorded digests identify the images to use in the next rehearsal.

| Service | Deployed source | Northflank build | Pushed image manifest SHA-256 |
| --- | --- | --- | --- |
| Core | `333f604592a7a2ba3d3a2de808ca6947e1a3ea57` | `joyful-turn-9296` | `3364bd60d7049343e5784a5c93ffbfa3dea8e0eb387c1c7b15d9878331538bf3` |
| App worker | `687bbae83dd3c5c07d3bf97009fb2f07e2d2510c` | `last-mine-6458` | `a2c15af0b71c8bf2b0e6d85370659cf1368834cae956b1ec149020e2b07e2a21` |
| Checkout | `eaa34f27386e0de2b34de6085fef78ac237943e9` | `puffy-soup-2325` | `8524590889e27bc2163058b97b5966265f8c9525028d519515101a09d365de1e` |
| Knowledge | `874534dd80425f741d7b1a749b64281efda62340` | `sleek-belief-4263` | `df734b6fcd415f81d48f0aa3eae83afa27676ddcb7c7214b8c283aaf55bab16c` |
| Connector | `fc36cad517533a18922966c7f3aa2322860ce19c` | `mint-meeting-7629` | `4ffb567056f7a6187d0e2a579532a6a9f840ac8e1fa33218ca5398dcb621cdef` |
| Payments | `4946228a4033c99b4399f0d1d1fb6ca696f11187` | `bold-flower-2375` | `05bd0e1cb994e90d8594648b1d1cbaf2da897a92d0ab0375046a4093b80a8b37` |
| Automation | `c4e50f6151d2beb1f4db19565235347040d287c7` | Imported source revision tag | `31c04335a7db0fade07ce0d090a1e75281aedd3688397319064853f303f9e9ca` |

Automation uses the imported image version
`sha-c4e50f6151d2beb1f4db19565235347040d287c7`. The deployment points to
the exact import record, which the image API reported ready for Linux amd64
with the digest above.
[Northflank image metadata API](https://northflank.com/docs/v1/api/project/images/get-image).

The first digest-pinned lookup returned 403 from the private registry with
the current Northflank session. The table establishes build provenance from
Northflank metadata. The clean boot requires registry read access, verified
image pulls, empty databases migrated at startup, healthy instances, and
payment and mail traffic routed to fixtures. Then repeat the purchase,
response-loss recovery, worker restart and routing rollback with the same
assertions for order, stock, invoice and mail.
[Northflank image retrieval](https://northflank.com/docs/v1/application/build/pull-images-from-Northflank).

## Boot the original Core and Worker images

The private Northflank release lab started the original Core build
`joyful-turn-9296` and App Worker build `last-mine-6458` by their exact
Northflank build IDs. Only the lab could reference the build service during
setup. The two runtime containers had no public ports and used synthetic
credentials. Their executable fingerprints matched the previously recorded
Core `8bcfb2db…` and Worker `485b8511…`.

The separate PostgreSQL 17 fixture database had zero tables in the public
schema before Core started. After bootstrap it had 104 migration ledger
entries, including `112-hosted-checkout-recovery`. Core returned HTTP 200 on
`/health`. The fixture used Core's automatic bootstrap with the test database
owner. The Worker ran in `serve` mode with `PROCESS_ROLE=app-worker`.

| Test | Observed result |
| --- | --- |
| Discard the first successful native order confirmation and retry it | The retry returned the original order. The test shop had one order and stock moved from 80 to 79. |
| Start the separate Worker | Its order Flow created exactly one invoice for the original order. |
| Stop the Worker and place a second simulated order in a new fixture shop | Core returned the original second order on retry, decremented its stock once and left its invoice pending. |
| Resume the pinned Worker and recheck both orders | Each shop still had one order, one stock decrement and one invoice for its original order. |

The test used simulated native payment and the order Flow for invoice
generation. Northflank denied the independent Checkout build reference
from the lab with HTTP 403. The complete image-level purchase through
independent Checkout, payment and Connector remains open. The next run
replaced the database owner at runtime with two restricted roles.
The lab's runtime services were paused after the run, and the temporary
build access was removed.
[Northflank cross-project build access](https://northflank.com/docs/v1/application/build/share-builds-across-projects).

## Run the original images with restricted database roles

The same original Core and Worker images ran as separate private Northflank
services against another empty PostgreSQL 17 database. A one-shot Core
migration job used the database owner and applied 103 migration ledger
entries with demo seeding disabled. The database then reported signed
scope enforcement active with distinct system and tenant logins. Core and
the Worker ran with `BOOTSTRAP_MODE=serve`, `DB_RLS_REQUIRED=true` and
`DB_SCOPE_REQUIRED=true`. Neither received the migration connection or a
staged exception. See [the database role setup](../authenticated-database-scope.md#coordinated-deployment).

| Test | Observed result |
| --- | --- |
| Give the fixture system login `TRUNCATE` and start the original Core image | Startup exited with code 101 and reported an unsafe runtime role. Core passed health after the grant was revoked. |
| Buy from two separate fixture shops and discard each first successful confirmation | Retrying returned the original order in each shop. Each had one order and stock moved from 80 to 79. |
| Query the other shop's orders and invoice records in both directions | A foreign shop header was denied with HTTP 403. Searching for the other shop's receipt within the caller's shop returned an empty result. |
| Run the signed-scope probes with the actual tenant login | Forged scope, actor and signature attempts failed. The role could not read signing keys or private identity data, change the schema or write to managed projections. |
| Resume the Worker after Core has dispatched both orders | Each order gained exactly one invoice. Reading the receipt and retrying again after the Core restart preserved the order, stock and invoice. |

Core must run an outbox consumer for this setup. The initial
`PROCESS_ROLE=http` configuration accepted the purchases and left the
invoices pending. Changing Core to `PROCESS_ROLE=all` with
`APP_WORKER_ENABLED=false` dispatched both committed orders while the
separate `app-worker` was still paused. Resuming that Worker processed the
two Flows. The test used native simulated payments and checked invoice
generation. Provider payment, mail delivery and independent Checkout and
Connector images remain separate checks.

## Connect the Payments adapter and replay a callback

Core at [`3195dd4c`](https://github.com/veyndo/veyndo/commit/3195dd4c217caafe60f9c7a94396d79691f2e74f)
ran on Darwin arm64 with a separate app worker. Checkout at `eaa34f27`,
Connector at `fc36cad5` and Payments at `4946228a` were built from their
pinned sources with Cargo's lockfiles. Checkout and Connector used their
own databases and logins. A migration process initialized a separate
Payments database before the restricted Payments login opened it. The
only external interfaces in this run were a loopback payment provider
fixture and a loopback SMTP receiver.

The registered independent checkout and mail journey used the actual
Payments adapter with the private repository's provider fixture. The
client discarded the first checkout response and recovered the same
order and attempt after restarting Checkout. Before verified capture
there was no invoice or mail. Payments rejected a forged callback,
accepted repeated deliveries of the same event, and also handled a
separate event for the same payment. The completed run had one capture
request at the provider fixture, one order, one stock decrement, one
invoice and one SMTP message matched to the Connector receipt by
Message-ID. Replaying the full refund preserved the original receipt and
made one refund request at the provider fixture.

The private Payments repository's existing native checkout regression
also checks repeated approval callbacks. The fixture does not call an
actual payment provider or deliver to a public mailbox.

### Start the original Checkout, Payments and Connector images

Northflank rejected the cross-project image reference for Checkout.
Three manual jobs in the images' source project could start the exact
build IDs instead. Each had an empty runtime environment, no public
listener and a 90-second deadline. The jobs checked the program file
fingerprint inside the running image. Checkout and Connector also
executed their schema command successfully.

| Service | Build | Northflank job run | Executable SHA-256 |
| --- | --- | --- | --- |
| Checkout | `puffy-soup-2325` | `fa9c97fd-49f5-4487-bef0-d5bdf2db4f49` | `be10b8fe602248796ba0bd224819ccf0a180d809d442f7e5b8d226c8a20b9120` |
| Payments | `bold-flower-2375` | `711cd0b9-fcb7-433f-aa08-a586bf148734` | `79f68bb3b7801cebb923f5b196616152d6c154003590f19158a8f39b7cbb1653` |
| Connector | `mint-meeting-7629` | `81662e5d-3df2-4212-b90f-6e989d306266` | `a4de4879de28fae10b4b31171b9536449c67c0913619371f15e8d49e1603c8d7` |

These manual jobs checked startup only. The later
[five-workload rehearsal](#run-five-separate-workloads-on-northflank)
connected the services with private fixture databases.

### Release the simulated invoice correction

The Payments simulation deliberately omits the provider risk session
identifier. Invoice approval now accepts that simulated session and
keeps the identifier mandatory for provider invoice confirmation. The
Payments CI uses the current Core contract for safe diagnostics on
saved payment failures. The complete Payments workflow passed with
disposable PostgreSQL. It includes repeated approval callbacks, saved
method revocation, all 17 simulated methods, and receipt replay after a
service restart.

Northflank deployed build `luminous-ink-2350` from `1b52f500` without a
schema migration. Its image manifest digest is
`sha256:95a11b66220fa52cdc6c1823e02b4a73e2ef05f0c99ac8ce703679cb2c937eea`.
The old replica retired and the active provider endpoint reported
`status: ok`, `mode: sandbox` and implementation version `1.6.6`.
Core health and the Lumen storefront also responded. The hosted check
verified service readiness. The payment and invoice behavior was
verified against provider and simulation fixtures in CI.

## Run five separate workloads on Northflank

On 10 November the original hosted builds ran as private Northflank
services in their source project. The workloads referenced the existing
builds directly. PostgreSQL 17 held four fresh databases. The Core and
app worker shared the Commerce database through distinct restricted
system and tenant logins. Checkout, Payments and Connector each had
their own database and login. The test verified that each login could
connect only to its assigned database and lacked superuser, role
creation and row-security bypass rights. Core's signed database scope
was enforced. The two one-shot migration jobs finished before the
application workflows started.

| Workload | Northflank build | Source revision |
| --- | --- | --- |
| Core | `zippy-foot-5455` | `c783c6158f2078692cb15e16b98cd097f100d522` |
| App worker | `last-mine-6458` | `687bbae83dd3c5c07d3bf97009fb2f07e2d2510c` |
| Checkout | `puffy-soup-2325` | `eaa34f27386e0de2b34de6085fef78ac237943e9` |
| Payments | `luminous-ink-2350` | `1b52f5005a954a2780153af8ee63fde7c7cc3e33` |
| Connector | `mint-meeting-7629` | `fc36cad517533a18922966c7f3aa2322860ce19c` |

All listeners were private. The test resources had synthetic credentials
and no links to production secret groups or databases. A temporary test
helper forwarded fixed loopback fixture addresses to the private
services and received synthetic mail on the Connector's loopback
interface. The services used the existing commerce, payment and mail
contracts. This run shared the provider project network with production.

| Exercise | Observed result |
| --- | --- |
| Independent Checkout with simulated demo payment | Discarded the successful confirmation body, restarted Checkout on a new instance and replayed the original confirmation. One order and one stock decrement remained. The next shopping cart was empty. The completed cart remained readable for receipt recovery. |
| Native purchase with the separate Payments service | The simulated capture settled after the adapter's signed notification, without browser reconciliation. An invalid approval nonce and a forged notification were denied. Two valid replays left one notification in Core's inbox and one simulated provider order. |
| Paid order through the app worker and standalone Connector | Before capture the order had no invoice. The completed Flow ran its invoice and confirmation actions once. The Connector receipt and the SMTP listener recorded the same Message-ID once. An unauthenticated action returned 401 and a foreign shop request returned 403. |
| Refund and replay | The original attempt reached `refunded` for the full amount. Repeating the same refund preserved the order count, stock, invoice and one delivery. |

The independent Checkout run used the demo payment. The capture, refund
and mail run used the native purchase route with the separate Payments
simulator. The strict Core profile reserves the separate Checkout provider
route for the actual PayPal Sandbox. The [public Lumen pilot](../status.md#private-checkout-live-in-the-lumen-test-shop)
records the native and Storyfront journeys through that provider. This
private rehearsal used no external payment account or inbox. All six
temporary services, including PostgreSQL, were paused after the test.

## Compare the checkout routes across separate services

The Northflank load test used the Core, App Worker, Checkout and Connector
builds from the five-workload rehearsal above. Each ran as one private
service. The measurement client ran in a separate container in the same
Northflank project. PostgreSQL 17 held three fresh databases, with signed
database scope active in Core. The two synthetic shops each had 200,000
products. All services used test credentials and the SMTP receiver was local
to the Connector container.

Each run issued 48 purchase confirmations from 12 clients alongside 240
catalogue page requests from four clients. The native route used guest
carts. The independent route used one signed-in synthetic customer and the
same set of product positions and stock levels. Each run used the demo
payment and prepared its carts before the timed portion. Confirmation
timings include wait and retry time. Retries kept the original purchase
request and honoured the server's retryable 429 and `Retry-After`.

| Route | Confirmation p50 | Confirmation p95 | Confirmation p99 | Catalogue p95 | Orders retried | Retries |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Native | 495.29 ms | 589.72 ms | 605.53 ms | 364.27 ms | 0 / 48 | 0 |
| Independent | 656.90 ms | 3,109.45 ms | 4,013.84 ms | 186.23 ms | 12 / 48 | 17 |

Each shop recorded 48 distinct orders. Replaying each confirmation returned
its original order. The 48 purchased products each went from 20 units to
19. The 199,952 other synthetic products retained 20 units. Each route
generated 48 invoices and 48 completed Connector delivery jobs. The SMTP
receiver recorded 96 distinct Message-IDs across both routes.

The independent path needs further work on latency under contention. Twelve
confirmations retried after admission refused the original request. This
run used one replica per service, omitted model calls and measured the
simulated purchase path. The earlier co-located comparison used a different
profile with assistant traffic and a worker restart. Provider callback
capacity and production throughput remain open. All six test services
including the client and PostgreSQL were paused after the run.
