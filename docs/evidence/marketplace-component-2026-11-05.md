# Marketplace component extraction, 5 November 2026

## Delivered source and integration

Upstream: [veyndo/marketplaces](https://github.com/veyndo/marketplaces), commit
`edc49f56945c1543f56b132f7f660e1f34a462c7`. Original history was preserved by splitting
`extensions/apps/marketplaces` from Core commit `5364c139`; the source and split
commits are recorded in the component provenance. The original license is retained.

The provider now has its own Cargo manifest/lock, source-only Docker build, CI,
maintainer and security guidance. It imports no Veyndo crate and has no SQL access.
Veyndo composes the same Cargo package and Studio sources through a reviewed,
checked-in vendor snapshot. No submodule checkout or runtime source download is
required. The upstream repository owns edits; the snapshot is not a second fork.

`components.lock.json` records the commit and every file hash. The structure gate
checks content, missing/extra files, forbidden links and the exact owner directory.
Mutation tests reject changed content, removals, additions, symlinks, another
repository, mutable branch names and traversal paths. Cargo boundary controls also
reject adding Core or SQL as a provider dependency.

## Observed tests

| Check | Result |
| --- | --- |
| Independent Cargo tests | Seven passing tests: provider prerequisites, exact money, mappings, source address/quantity, foreign event batches and fixed destinations. |
| Standalone actual binary | HTTP and MCP actions against an independent in-memory host, without Core/PostgreSQL. Same saved mapping/state, invalid credentials, foreign tenant, missing input and unapproved import rejection pass. |
| Published SDK | Node example installed SDK 0.1.1 from its release archive; initialize and actual prepare tool pass. French main-language content falls back correctly for a fifth enabled language, Italian; amount remains 1299 minor units. |
| Native connected fixture | Real isolated PostgreSQL, actual Core binary and independently compiled provider gateway. Amazon/eBay/Kaufland fixture sync, native leased jobs, localized overrides, paid import, concurrent replay and service restart pass. |
| Native order effects | Exact source tax/money, guest snapshot, one stock decrement, one order event, Flow side effect and native invoice/PDF pass. Disabled channel and foreign tenant are denied. |
| Native translation regression | One translation lookup for 1/20/24 order lines. Fifth/short locale, variant inheritance, NULL/blank names, immutable replay and atomic concurrent stock pass. |
| Component CI | [Run 42033200277](https://github.com/veyndo/marketplaces/actions/runs/42033200277) passed Rust, SDK/host integration, Docker build and packaged runtime smoke, non-root UID 65532 and no Python. |
| Core integration checks | Targeted package tests, 19 Cargo boundary mutation controls and source structure/localization/inventory checks pass. |

The local connected fixture used the existing Core binary dated 4 November because
Core behavior was unchanged. The Marketplace binary was compiled from the extracted
source. These are focused marketplace checks, not a fresh full-platform browser
or real-provider acceptance.

## Remaining work

The component still delegates records, leases and atomic paid-order intake to the
existing host callback contract. The standalone fixture host is not durable storage.
A supported independent durable adapter, full generic host SDK contracts, separate
Studio UI package, refunds and final composed browser acceptance remain tracked in
MKT-02 through MKT-05. The original native permissions, installation consent and
sandbox fences remain in the Veyndo gateway.

The service MCP endpoint is for trusted server gateways with configured tenant
access. Customer/merchant/agent clients retain the host's current actor checks;
service credentials must never be sent to a browser. No live seller requests,
new payment acceptance or production redeployment are implied by this extraction.

## Update the pinned source

```sh
# Review and test a clean upstream checkout at the exact commit first.
python3 scripts/component_sources.py --import-source marketplaces \
  --checkout /absolute/path/to/marketplaces --commit <40-character-commit>
python3 scripts/component_sources.py
python3 scripts/testing/component_sources_test.py
cargo test --locked -p veyndo-marketplaces
```

Then run the connected marketplace fixture and review changed build/source inputs.
Component history and license stay in the upstream repository and source snapshot.
