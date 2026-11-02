# A visual workspace for shops and apps

The useful Canvas idea is a shared overview of real pages, followed by direct work
on one selected page or element. The working product and the next design direction
are deliberately separated below.

## Working now: image captions in the existing editors

**Products → Media**, **Shop design → select an image or hero → Edit**, and
**App Studio → Design → select an image** expose an **Image caption** field.
Choose an enabled content language in the existing editor language selector.
Missing/null translations inherit the shop's main language; an explicitly empty
caption stays empty. Captions appear below the image. Accessibility alternative
text remains separate. Rich document images preserve captions in their existing
`title` attribute and display them in Preview and the storefront.

**Suggest with AI** uses the shared native `merchant.media.caption` operation,
current `assistant.use` permission and central inference configuration. Review or
edit the suggestion and choose **Use in draft**, then save through the native
editor. Generation itself saves and publishes nothing. The operation is also
available through the ordinary MCP registry and generated input contracts.

Owned product assets and bundled public fashion images provide decoded, bounded
image evidence. Public HTTPS images use the existing DNS-pinned, public-only fetch
policy with no redirects. Credentials and private-network destinations are denied.
Images are reduced to a PNG thumbnail before inference. When pixel evidence is
unavailable, the review explicitly says that the suggestion uses current content.
An App Studio image has no selected app-record image in the design inspector, so
its caption suggestion uses the app/image description rather than invented pixels.

Changing image, language, current text or request scope discards a pending proposal.
Revoked UI access hides generation; native authorization still runs on every call.
Product captions remain part of the product aggregate. Page captions stay inside
the site-builder app document. App images use the existing localized `Block.text`.
No new database table, runtime, executable markup or publication mechanism is added.

## Next: one overview, consistent tools

The following design changes are **proposed**, not a shipped Canvas replacement.
They build on the current real storefront previews, page overview, drag/drop,
resizable app panels and contextual agent drawers.

| Area | Concrete change | Acceptance |
| --- | --- | --- |
| Shop overview | Show home, product, collection and content templates on a zoomable board. Keep channel, language and draft context in one top bar. | Open any tile into the real renderer; preserve unsaved edits when returning to the overview. Bound previews to visible tiles rather than loading the entire catalogue. |
| Direct editing | Select a visible element, edit text in place and use one small move/duplicate/delete toolbar. Open the inspector only when its settings are needed. | Keyboard and touch perform the same insertion/reorder operation; visible drop targets identify the exact insertion point. |
| App overview | Show the app's selected placements together, for example product detail, checkout and merchant view. Open a placement using the same selection model. | One app version owns all placements; switching views retains edits and enforces each surface's existing rights. |
| Contextual agent | A collapsible right dock receives the selected page, block, channel, language and revision. Accept a URL, screenshot or a written instruction. | Show proposed changes on the actual preview, retain original evidence, review the diff and apply through the current native sandbox/CAS path. |
| App behaviour | Connect a selected button/form to the existing graphical flow/action tools from its inspector. Keep fields and app settings adjacent to the view that uses them. | A visual connection and coding-agent change edit the same typed contract; neither widens installed actions or rights. |

The first connected slice should be **overview → select a page → edit an image and
caption → preview on mobile → review a sandbox release**. This is a smaller,
verifiable improvement than replacing every editor with a new free-form runtime.
Storyfront Experiences retain their original editor and commerce connection.

## Reference and verification

Shopify documents the side-by-side overview, pan/zoom, fullscreen editing and
selection-aware Sidekick in [Canvas navigation](https://help.shopify.com/en/manual/online-store/themes/canvas/navigating)
and [Canvas customization](https://help.shopify.com/en/manual/online-store/themes/canvas/customizing).
These inform the proposed workflow, not a claim of complete feature parity.

[Local caption acceptance](evidence/media-captions-2026-11-02.md) records the tested
source, storage, renderer and provider-fixture boundaries. See also the
[existing shop design guide](personal-workspace-and-shop-design.md),
[product media](settings-media.md) and [app workspace](app-studio-workspace.md).
