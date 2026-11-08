# Checkout composition under catalog traffic

Measured locally on 8 November 2026 using actual Rust Core and Checkout debug
builds, signed PostgreSQL connections and synthetic identity and provider
fixtures. The composed quote called the same native Commerce quote operation
through the local fault-injection proxy used for the response-loss test.

Three paired batches each sent 64 quotes per path. Four quote workers shared
the shop with four catalog readers. Both paths used the same cart, expected
minor-unit total, legal version and payment method. Each quote and catalog
response was checked.

| Operation | Requests | Errors | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native quote | 192 | 0 | 39.6 ms | 49.1 ms | 52.1 ms |
| Quote via Checkout | 192 | 0 | 41.9 ms | 51.1 ms | 61.7 ms |
| Catalog with native quotes | 306 | 0 | 11.4 ms | 16.3 ms | 18.8 ms |
| Catalog with composed quotes | 324 | 0 | 11.3 ms | 15.7 ms | 18.6 ms |

With Checkout stopped, 32 catalog calls and 32 native quote calls passed.
The composed route stopped serving quotes as expected. The first composed
quote after readiness returned the original quote in 23.4 ms. This figure
measures the call after readiness. Service startup is a separate interval.

The same development composition passed the concurrent last-unit purchase,
lost reply, exact receipt recovery, capture and refund against local provider
fixtures. It also passed independent Outbox subscriber failure, cold restart
and retry. An audit projection failed without blocking the other subscribers.
The repaired projection appeared once after the authorized retry.

The figures describe a single synthetic shop with a local service hop. They
do not establish a Northflank capacity limit, a production performance target,
actual provider behavior or end-to-end Storyfront provider acceptance.
The next measurement uses the same workload against a released isolated
deployment with service, pool, queue and worker telemetry.
