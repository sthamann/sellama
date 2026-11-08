# One shop, composable parts

Run Veyndo as a complete shop, or start with the capability you need. A retailer can use its storefront, POS and merchant Studio together. A developer can integrate a marketplace gateway, run app logic or use the SDK with an existing commerce system.

## How one shop works

Commerce owns the catalogue, prices, stock and orders. Checkout coordinates the buyer's session and asks that owner for the current quote and the purchase. Commerce commits the order, stock allocation and event in one transaction. The receipt can be recovered by retrying the original purchase.

The storefront and Studio use that same shop identity and transaction boundary. Provider calls run through durable jobs. Knowledge and reporting can be rebuilt from their sources. They add context and visibility without joining the purchase transaction. Agents use the same admitted operations as the team and prepare changes for review where approval is required.

```mermaid
flowchart LR
  UI["Storefront, POS, Studio and agents"] --> C["Commerce"]
  UI --> Q["Checkout sessions"]
  Q -->|"Current quote and purchase"| C
  C --> DB[("Orders, stock and events")]
  DB --> W["Workers and provider adapters"]
  DB --> K["Knowledge and reporting"]
```

## Choose a starting point

The four public development repositories are linked below. The other links explain the component's contract and its place in the complete shop. Some have separate builds or access-controlled source, and some are still domains in the product repository. The [implementation plan](commerce-components.md) tracks each extraction and the [current status](status.md) records what has been released and tested.

| Component | What it owns and where to start |
| --- | --- |
| Commerce | The complete shop, Studio, checkout transaction, inventory, orders, rights and shared API. [Repository](https://github.com/veyndo/veyndo) · [Run it locally](quickstart.md) |
| SDK | JavaScript and TypeScript clients for Veyndo's HTTP and MCP interfaces, including separately scoped services. [Repository and examples](https://github.com/veyndo/sdk) |
| Apps | App manifests, bounded Wasm execution and common storage for records, settings and jobs. [Repository](https://github.com/veyndo/apps) · [Runtime guide](app-runtime-service.md) |
| Marketplaces | Provider mapping, listings and imported orders for Amazon, eBay and Kaufland. A compatible commerce host owns inventory and order creation. [Repository](https://github.com/veyndo/marketplaces) · [Merchant guide](marketplaces.md) |
| Checkout | Buyer review, checkout sessions and recovery of the original result. The commerce host owns prices, stock and the final purchase. [Contract](checkout-component.md) · [Storyfront recovery](storyfront.md#responsibilities-and-contracts) |
| Policies | Shared pricing, promotion and rule decisions. The native product applies them using current facts. [Verification scope](formal-verification.md) |
| Automation | Evaluates rules from supplied facts. The shop's Flow and event owners handle execution and effects. [Component guide](automation-component.md) |
| Knowledge | Source documents, product context, retrieval and evidence for the agent. [Shop knowledge](knowledge-workspace.md) |
| Catalog AI and agents | Import, enrich and translate catalog data. Agents prepare revision-bound proposals within their grants. [Catalog and agent workflows](agentic-commerce.md) · [Agent rights](agent-authority-controls.md) |
| Simulator | Runs isolated shopper scenarios so teams can compare changes before release. [Simulator](customer-scenarios.md) |
| Canvas and Experience | Visual shop editing and the original Storyfront experience use their own presentation. Commerce supplies catalog and checkout operations. [Canvas](visual-workspace-canvas.md) · [Storyfront](storyfront.md) |
| Connectors and Migration | Provider adapters handle delivery and integration work. Migration reads source shops and hands reviewed imports to the target shop. [Connectors](connectors.md) · [Migration](agentic-migration.md) |
| B2B and EDI | Companies, budgets and approvals govern purchasing. EDI normalizes partner documents for the same purchasing workflow. [B2B](b2b-commerce.md) · [EDI](edi.md) |
| POS | Cashier workspace and register protocol. Sales and refunds use the host's inventory, order and receipt rules. [Register guide](pos.md) |
| Shipping | Package, label, tracking and return contracts for independent carrier apps. [Shipping guide](shipping-workflows.md) |
| Reports | Sales, traffic and channel measures derived from authorized shop data. [Reports guide](merchant-reports.md) |
| Payments | The provider contract connects account setup, payment attempts, verified callbacks and refunds to the native order. [Payment API](payment-provider-api.md) · [Shopware Payments acceptance](shopware-payments-acceptance.md) |

## What we check when components work together

Compare the same commerce operation through both entry points under equivalent load. Check the actual quote and receipt as well as latency. Stop a dependency and check which shop operations still work. Test repeated calls, lost responses and recovery with the same purchase identity.

The [benchmarks](benchmarks.md) explain which paths, workloads and environments were measured. Local synthetic results and public reachability checks are reported separately from hosted capacity and provider acceptance.

[Checkout composition measurements, 8 November 2026](evidence/checkout-composition-performance-2026-11-08.md).
