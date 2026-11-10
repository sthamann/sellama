# Reproduce the million-product commerce measurement

The [published benchmark page](https://sthamann.github.io/veyndo/benchmarks.html)
contains the current bounded million-product workloads and the earlier full-catalog
baseline comparison. Raw JSON includes every measured latency, errors, source and
binary metadata. These are local synthetic HTTP/PostgreSQL measurements, not
production capacity or an LLM speed claim. The browser clips are separate feature demonstrations.

The later [read-context optimization](read-performance.md) has its own matched
debug-build comparison and raw report. It does not replace this release-build
million-product measurement; its six-product improvement percentages have not
been demonstrated at that scale.

## Mixed shop traffic and worker restart

On 10 November 2026, a local debug build of Core ran with PostgreSQL, a separate
app worker and the independent Connector built from its own repository. The
isolated shop had 200,000 synthetic products. It served 240 catalog requests,
48 simulated checkout confirmations and 16 assistant requests in parallel.
The model fixture waited 80 ms per call. All mail went to a loopback SMTP sink.

| Operation | Samples | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: |
| Catalog page | 240 | 9.94 ms | 15.21 ms | 16.30 ms |
| Checkout confirmation | 48 | 30.31 ms | 43.73 ms | 49.42 ms |
| Assistant reply | 16 | 323.70 ms | 346.42 ms | 356.55 ms |

Core accepted the first order while the worker was stopped. After restarting
the worker, the test matched one invoice and one delivered mail to each order.
Replaying each purchase returned the same order ID and stock decremented once.
The timings include test-side request overhead and the initial worker pause
coordination for checkout. Cart preparation, import, real model and payment
provider latency, and Northflank capacity are outside this measurement.

Build `target/debug/veyndo` and the independent Connector binary first. Use a
local PostgreSQL container with disposable credentials and a user that can
create temporary databases. Set `DATABASE_URL`, `DB_CONTAINER` if using a
non-default container, and `CONNECTORS_BINARY` to the absolute Connector binary
path. The test writes `mixed-commerce-load.json` in `TEST_ARTIFACT_DIR` when set.

```sh
VEYNDO_MIXED_LOAD=1 python3 scripts/email_tests.py \
  Contracts.test_independent_connector_and_worker_complete_native_checkout
```

### Run the same load through independent Checkout

A repeat using [pinned Core, Checkout and Connector builds](evidence/composed-release-rehearsal-2026-11-10.md#compare-the-two-purchase-routes-under-load)
measured checkout p95 at 55.63 ms on the native route and 2051.50 ms on
the independent route. Eight independent purchases retried after admission
refusal. Both runs verified 48 orders and their matching invoices and mails.

The [isolated Northflank comparison](evidence/composed-release-rehearsal-2026-11-10.md#hosted-paired-load)
used the running Linux executables and the same 48 purchases per route.
Checkout p95 was 430.84 ms native and 3195.01 ms independent, with 27
retries across 11 independent purchases. The test co-located the services
and PostgreSQL inside a private job.


Set `CHECKOUT_TEST_BINARY` to the absolute path of the independent Checkout
binary in addition to the configuration above.

```sh
DEMO_CATALOG=legacy-furniture VEYNDO_MIXED_LOAD=1 python3 scripts/email_tests.py \
  Contracts.test_independent_checkout_and_connector_recover_order
```

Two sequential local debug runs used separate disposable shop databases, the
same 200,000 product fixture and the same load. Each prepared 48 carts, then
used twelve concurrent purchase clients, four catalog readers and one
assistant client. The separate Checkout run reused one signed-in test buyer
across 48 carts and sessions. Its client retried a confirmation only on an
explicit retryable HTTP 429 with a bounded `Retry-After`, using the original
session and reviewed order. The assistant client submitted a fresh question
if Core rejected its previous sources as stale.

| Measurement | Native Core checkout | Independent Checkout |
| --- | ---: | ---: |
| Checkout confirmation p50 | 40.83 ms | 37.65 ms |
| Checkout confirmation p95 | 51.77 ms | 10,046.54 ms |
| Purchases needing retry | 0 of 48 | 8 of 48 |
| Total confirmation retries | 0 | 12 |
| Catalog p95, 240 reads | 17.68 ms | 13.53 ms |
| Assistant p95, 16 replies | 354.69 ms | 645.88 ms |
| Assistant source refreshes | 0 | 2 |
| Worker restart to final SMTP receipt | 1.97 s | 10.30 s |

Both runs committed 48 distinct orders, recovered the same IDs on replay and
decremented stock once per cart. Each order had one invoice and one SMTP
delivery. The independent route admits four relays per shop to reserve room
for callbacks into Core. Its p95 includes the five-second waits prescribed by
the server. The time to the final mail includes orders that completed after
the worker restarted. These are local observations with simulated payments,
a model fixture and a local SMTP recipient. Hosted capacity uses a separate
test.

### Shorter wait after a refused Checkout request

Core now returns `Retry-After: 1` when local or cluster admission refuses an
independent Checkout request before it reaches the Checkout service. The four
relay slots per shop still reserve Core capacity for callbacks. A lost or
uncertain confirmation still follows the original receipt recovery path.

Repeating the local debug test with the same workload brought confirmation
p95 from **10,046.54 ms to 2,040.01 ms**. Median confirmation was **39.31 ms**.
Eight orders still needed a retry, twelve in total. Each of the 48 purchases
again had one order, one stock decrement, one invoice and one SMTP delivery.

### Absorb a short burst before refusing a relay request

The next local comparison used the same 200,000-product fixture, twelve
concurrent purchase clients, 240 catalog reads, sixteen assistant requests
and an app worker restart. Both runs used debug builds, PostgreSQL 17,
simulated payments and a loopback SMTP recipient. Only Core relay admission
changed between the two runs.

| Checkout confirmation | Before | With bounded waiting and lease handoff |
| --- | ---: | ---: |
| p50 | 41.62 ms | 107.22 ms |
| p95 | 2,047.84 ms | 129.65 ms |
| p99 | 2,056.12 ms | 140.28 ms |
| Orders requiring a retry | 8 of 48 | 0 of 48 |
| Total retries | 12 | 0 |

Both runs kept one order, stock decrement, invoice and mail per purchase.
The median rose as requests waited briefly at Core. The longer waits caused
by client retries disappeared in this run. Core still caps running relays and
returns the same pre-dispatch refusal when local or cluster capacity runs out.
The native route on the updated Core completed its own 48-order run at a
47.28 ms p95 with zero retries. The recovery, worker restart, capture and
refund fixtures passed on that same Core build.
[Relay limits and recovery contract](checkout-component.md#route-a-test-shop-through-private-checkout).

The [matched Northflank comparison](evidence/composed-release-rehearsal-2026-11-10.md#hosted-relay-admission-comparison)
used the running Linux executables. Independent confirmation p95 fell from
4,078.00 ms to 1,717.01 ms. Retries fell from 30 to 9. These are measurements
from a single isolated job with simulated payments and loopback SMTP.

## Isolate the database

Use a separate checkout and database. The fixture command deletes products and
translations **only in two newly registered synthetic benchmark shops**. It refuses
the default development container/port. Never point it at a production database.

Requirements: Rust stable 1.96+, Docker, Python 3.10+, Node 22+ for the storefront.
The benchmark itself uses only Python's standard library and Docker's PostgreSQL
client. No model download or payment-provider account is needed.

```sh
export DB_PASSWORD='choose-a-local-benchmark-password'
export MERCHANT_TOKEN='choose-a-local-benchmark-merchant-token'
DB_PORT=15490 docker compose -p rust-commerce-performance up -d --build --wait postgres
export DATABASE_URL="postgres://commerce:${DB_PASSWORD}@127.0.0.1:15490/commerce"
export BIND_ADDR=127.0.0.1:8791
cargo build --release --locked
BOOTSTRAP_MODE=migrate target/release/veyndo
BOOTSTRAP_MODE=serve PROCESS_ROLE=http target/release/veyndo
```

Keep that server running. In another terminal, in the same checkout:

```sh
python3 scripts/benchmark.py --prepare rust-commerce-performance-postgres-1 \
  --large-products 1000000
python3 scripts/benchmark.py --requests 2000 --rounds 1 --concurrency 16 \
  --arrival-rate 500 --output .run/benchmark.json
```

The fixture file contains credentials and stays in ignored `.run/`, mode 0600.
The report contains no credentials. Keep fixtures identical for a before/after
comparison; do not run `--prepare` again between builds. Stop the old server before
starting the next binary at the same address. Do not build, record video or run
other load tests during the accepted comparison runs.

Commit the source before building and measuring. The report records its revision,
binary hash and script hash. Do not use a partial diff to describe new/untracked
modules. Keep the same dataset and commercial behavior for a before/after test.

Start the independent outbox worker in another terminal with the same private
database environment before measuring:

```sh
BOOTSTRAP_MODE=serve PROCESS_ROLE=memory-worker target/release/veyndo
```

The accepted million-product measurement uses these two independent processes.
The worker consumes real committed events during the checkout workload. Diagnostic
counter writes remain enabled. No response cache is added to bypass PostgreSQL.

## What is timed and checked

- Physical fixture: 6 and 1,000,000 root products in separate synthetic shops;
  each root has a German translation. This is not one million simulated URLs.
- Default 50-product cursor pages (the small shop returns 6); product detail;
  localized exact-SKU and common-term substring search; a validated 20-line cart;
  fresh durable order placement. Every endpoint includes actual HTTP and DB work.
- Fixed arrivals of 100 and 500 requests/second, 16 load-generator workers.
  The 100/s run uses 1,000 requests per read and 500 checkouts; the 500/s run uses
  2,000 per read and 1,000 checkouts. These offered rates are not maximum capacity.
  Latency starts at the scheduled arrival, including client queue time. Admission
  is capped at 64 pending client jobs; a client rejection is an error.
- One validated warm-up request per worker per workload, excluded from timing.
  At 100/s, each read lasts about 10 seconds and checkout 5 seconds; at 500/s,
  each read lasts about 4 seconds and checkout 2 seconds. These are bounded probes,
  not a soak or saturation test.
- Every response validates shape, translation, prices or cart totals. Checkouts
  use fresh carts and idempotency keys. Every returned order ID, including 16
  checkout warm-ups in each run, is verified directly in PostgreSQL.
- Timing includes new local HTTP connections, full response reads and JSON
  validation. Python threads share the host with the application and Docker.
- Raw samples retain successful per-request latencies and all failures. Percentiles
  use nearest rank. A failed warm-up aborts the run; errors are not successes.
- Release build, host hardware, Docker resources, PostgreSQL version/durability
  settings, source revision and hashes are recorded. No LLM or external payment
  provider is contacted. Payment is explicitly simulated.

The earlier 1,000-product comparison remains in `benchmark-before.json` and
`benchmark-after.json`. It measured full catalog responses, closed-loop traffic
and median results over three rounds. The current API returns bounded pages;
**do not treat its smaller response as a like-for-like full-catalog speedup**.
The old raw reports and failure diagnostics remain published rather than being
replaced by the new contract. That original test used body-free catalog POSTs;
the new test sends JSON criteria and validates the complete body handling.

The physical SQL-generated fixture does not measure a production bulk-import API,
variant-heavy catalogs, embeddings, AI retrieval or relevance on a real assortment.
A separate 120-variant fixture, multilingual searches and concurrent cart edits
are checked by `scripts/scalability.py` in CI against real PostgreSQL.

## Observed limits and fixes

The first 100/s million-product run exposed an OR/subquery that scanned the entire
shop for a 20-line cart. Client admission rejected 634 scheduled requests; successful
cart reads had p95 645.256 ms. The final direct indexed SKU/parent lookup reached
100/s with p95 14.693 ms and no errors on the same workload. Both raw runs are
published. Search also needed JIT disabled for application sessions and custom
plans for common/rare terms; repeated mixed queries were checked before measuring.

The final two runs contain 19,500 measured requests with no errors and 1,532 unique
persisted orders including 32 warm-ups. The higher offered rate achieved roughly
497–499 requests/s depending on workload; it is not a saturation finding.

## Limits and cleanup

The current report covers one powerful Apple M3 Ultra workstation, PostgreSQL 17
in Docker, warm caches and these bounded fixtures. It does not measure production
operations, WAN latency, cold database/machine starts, a many-shop fleet, real-money payments,
LLM generation or comparative Shopware performance. Repeat it on your deployment
hardware and realistic workloads before making a capacity promise.

Stop only the benchmark server you started, then stop the isolated database:

```sh
docker compose -p rust-commerce-performance down
```

The volume is retained for inspection. Remove it only when its synthetic data is
no longer needed.
