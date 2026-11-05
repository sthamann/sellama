# Veyndo: current status

Updated 5 November 2026. Start here for the public product, observed journeys and
remaining delivery work. Source code, passing tests and a successful public
journey are tracked separately. The 4 November PayPal journeys use the actual provider Sandbox; earlier purchases retain their stated simulation scope.

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
API/MCP/SDK use and mandatory assembled-product regression. Knowledge and the other
planned services have not yet completed standalone extraction. SDK 0.1.1 additionally
retains uncertain tool/write outcomes; both Node CI versions pass. Core and migration
image publication now succeeds under `ghcr.io/veyndo` with their packaged smoke checks.
Hosting repository relinking still awaits final organization app authorization;
the merged website proxy fix is not deployed yet. The handbook is available at
<https://veyndo.github.io/veyndo/docs/> during that transition.

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

## Current public release

The public Core release `db0e00c9f43e4ee45a9129e3aa7caba41a8dd766`
(4 November) is running publicly. Its source includes the shared canvas, localized media captions,
guided shop setup, assistant layout and shared payment contract. Northflank
reports one ready replica with no restarts after the latest rollout. Feature
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
