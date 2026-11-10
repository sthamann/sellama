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
