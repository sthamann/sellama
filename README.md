<p align="center">
  <img src="docs/brand/veyndo-readme.svg?v=commerce-20261102" alt="Veyndo Commerce: build commerce with AI." width="100%">
</p>

<div align="center">

# Veyndo Commerce

**An AI native ecommerce platform built in Rust.**

[![Quick checks](https://github.com/veyndo/veyndo/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/veyndo/veyndo/actions/workflows/verify.yml)
[![Documentation](https://github.com/veyndo/veyndo/actions/workflows/pages.yml/badge.svg?branch=main)](https://veyndo.ai/docs/)
[![Working prototype](https://img.shields.io/badge/status-working_prototype-189EFF)](#current-boundaries)
[![Sustainable Use License](https://img.shields.io/badge/license-Sustainable_Use-189EFF)](LICENSE)

[Try a shop](https://start.veyndo.ai/start) · [Watch the overview](docs/video-tours.md) · [Build an app](docs/app-tutorials/README.md) · [Read the docs](https://www.veyndo.ai/docs/)

</div>

Build a shop and extend it with agents and a visual app editor. People and
agents use the same products, orders, permissions and versioned changes.

**[Current status](docs/status.md) · [Release checklist](docs/commerce-components.md#release-acceptance-order) · [Benchmarks](docs/benchmarks.md)**

## What you can do

| Work | What connects it |
| --- | --- |
| **Work with an agent** | Use the contextual sidebar to answer questions, open native views and compose working UIs. [AI workspace](docs/agentic-workspace.md#a-connected-conversation-surface), [catalogue](docs/product-management.md#preparing-a-catalogue-together). |
| **Bring your shop** | Inspect sources, review variants and import into private previews with the [Migration Assistant](docs/agentic-migration.md). |
| **Build the business** | Describe an app with forms, uploads, settings and views. Connect materials and dimensions to company approval, checkout and reorder. Visual editing and coding agents share one versioned definition. [App Studio](docs/app-studio.md), [configurator](docs/furniture-configurator.md), [object extensions](docs/app-core-extensions.md). |
| **Shape the shop** | Design shop pages and app placements on one zoomable canvas. Drag elements, retain drafts and compare AI proposals. Add multilingual image captions and [3D product models with variant materials](docs/product-3d-models.md). Storyfront powers Experiences. [Visual design](docs/personal-workspace-and-shop-design.md). |
| **Automate the work** | Repeat reviewed work as a Flow and compare rule drafts with recorded order inputs before saving. [Automation](docs/automation.md), [reusable work](docs/personal-workspace-and-shop-design.md#repeat-completed-work-as-a-flow), [rule comparison](docs/rule-history-comparison.md). |
| **Shop by intent** | Describe a gift, budget or comparison; edit the visual selection with real product cards, then use native variants, app configuration and checkout. [Shopper workspace](docs/ui-experience.md#standard-storefront-and-customer-account). |
| **Test before release** | Let fictional customers test private proposals with native baskets and simulated purchases. Review outcomes and preview before publication. [Customer simulator](docs/customer-scenarios.md). |
| **See what works** | Build sales and conversion reports. [Merchant reports](docs/merchant-reports.md). |
| **Stay in control** | Current roles, private sandboxes, immutable versions, saved-data upgrade checks and selected publication govern changes. [Security](docs/security.md). |

[![Veyndo: AI commerce in 1:56](docs/assets/showcase/product-films-20261102/veyndo-ai-commerce.jpg)](https://www.veyndo.ai/docs/video-tours.html)

**Films:** [AI commerce · 1:56](docs/assets/showcase/product-films-20261102/veyndo-ai-commerce.mp4) · [Concept · 1:12](docs/assets/showcase/product-films-20261102/veyndo-concept.mp4) · [Product workspace · 1:36](docs/assets/showcase/product-films-20261102/veyndo-workspace.mp4) · [Product advisor app · 1:24](docs/assets/showcase/product-films-20261102/veyndo-app-platform.mp4). English subtitles, no sound.

Captured on 2 November with demo data and simulated payments.
[Latest public journey and screenshots](docs/status.md#current-product-films-and-screenshots) · [Film sources](docs/assets/showcase/product-films-20261102/README.md).

## Try one complete round

**Hosted:** [create a standard shop](https://start.veyndo.ai/start) or
[create a Storyfront Experience](https://experience.veyndo.ai/).
[Live acceptance](docs/status.md#public-acceptance) ·
[Five-service rehearsal](docs/status.md#five-original-images-together-on-northflank).

**Container tour:** Git, Docker Compose and OpenSSL; no local Rust/Node build.

```sh
git clone --depth 1 https://github.com/veyndo/veyndo.git
cd veyndo
./scripts/try.sh
```

Open `http://127.0.0.1:8788/`. Select a product, place a simulated order, inspect it
in Studio, change a product in a private sandbox and review a selected release.
[Complete tour and pinned image](docs/first-tour.md).

**Develop from source:** Rust stable 1.96+, Node.js 22+, Docker Compose, Python 3
for verification tooling. Run `./scripts/dev.sh` and open
`http://127.0.0.1:8787/#merchant`. Runtime commerce and connector services use Rust.
[Setup](docs/quickstart.md) · [Source owners](docs/source-map.md).

## Explore the platform

| Area | Start here |
| --- | --- |
| AI Commerce Components | [Component map](docs/one-shop-components.md) · [Checkout integration](docs/checkout-component.md#commerce-host-ports-in-core) · [Knowledge](docs/knowledge-component.md) · [Automation](docs/automation-component.md) · [Connectors](docs/connector-component.md) · [Hosted versions](docs/cloud-releases.md#verify-the-hosted-lumen-composition) · [Update one component](docs/cloud-releases.md#prepare-a-core-release-candidate) |
| AI shopping channels and inward shop imports | [Cart transfer, consent and shop imports](docs/agentic-commerce.md) |
| Catalogue, orders and payments | [Setup](docs/shop-setup.md) · [Payments](docs/shopware-payments-acceptance.md) · [Saved methods](docs/payment-saved-methods.md) · [Invoices](docs/payment-invoice-checkout.md) · [Administration](docs/admin-workflows.md) |
| Countries, languages, currency and taxes | [International commerce](docs/international-commerce.md) · [Currencies](docs/currencies.md) |
| POS, B2B, EDI and marketplaces | [POS](docs/pos.md) · [B2B](docs/b2b-commerce.md) · [EDI](docs/edi.md) · [Marketplaces](docs/marketplaces.md) |
| Apps, settings, storage and private releases | [App platform](docs/app-platform.md) · [Build five apps](docs/app-tutorials/README.md) · [Storage and runtime](docs/app-data-storage.md) |
| Agents and shared operations | [Agentic interfaces](docs/agentic-component-ui.md) · [Agent identities & limits](docs/agent-authority-controls.md) · [MCP workshop](docs/agent-workshop.md) · [UCP B2B](docs/b2b-ucp-negotiation.md) |
| Operation and verification | [Architecture](docs/production-architecture.md) · [Integrations](docs/service-integrations.md) · [Testing](docs/testing.md) · [Proof boundaries](docs/formal-verification.md) |

The searchable [handbook](https://veyndo.ai/docs/) has EN, DE, FR and ES navigation.

## Current boundaries

Veyndo is an experiment platform, not established production infrastructure.
Native SDK and Storyfront PayPal Sandbox purchases, return, empty basket
and partial/full refunds have [dated acceptance](docs/shopware-payments-acceptance.md). Live payments,
each OAuth provider, disaster recovery and capacity require separate evidence. Selected Lean proofs cover named
pure policies, not the whole system. Source builds, app lifecycle completeness and
operational controls are tracked explicitly in [the current status](docs/status.md).

[First contributions](docs/early-contributors.md) · [Contribute](CONTRIBUTING.md) · [Discussions](https://github.com/veyndo/veyndo/discussions)
· [Report an issue](https://github.com/veyndo/veyndo/issues/new/choose) · [Changelog](CHANGELOG.md).

## License

Source-available under the **[Veyndo Sustainable Use License 1.0](LICENSE)**.
Run and customize your own stores, brands and apps. Competing shop platforms,
white-labeling and managed commerce/SaaS for independent merchants require a
separate written commercial license. This is not an OSI-approved open-source
license. Earlier MIT versions retain their rights; third-party terms remain intact.
[License examples](docs/licensing.md) · [Third-party notices](THIRD_PARTY.md).
