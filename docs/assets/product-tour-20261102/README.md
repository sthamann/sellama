# Current product screenshots and animated workflows

Captured **2 November 2026**, in Chrome, from the compiled Veyndo Commerce frontend
and native Rust/PostgreSQL service at commit
`b1f2269b7a29ef1059edb34db07c0654b02a8a93`. Later changes through
`4b4a658058a2210d9d935f40da81ea57efee262c` change documentation only.
All people, accounts, company details, products and orders are fictional.
Desktop images use 1440 × 1000; narrow images use 390 × 844.

These are actual browser screenshots, not generated product mockups. JPEG copies
preserve the complete viewport and are compressed for documentation. The GIFs
are edited sequences of captured interface states, with reading holds. They are
not continuous recordings or response-time measurements. Individual static
frames are available below for readers who prefer them.

## Observed actions

- Follow-up captures replace two loading states with fully loaded native product recommendations and AI boundary controls. Two complementary products were saved for the wool coat in a separate fictional shop.
- Native wool-coat size selection and a completed simulated order
  `RAC-e06eca89`, followed by an empty bag.
- A fictional cash register sale `RAC-78508d60` and its native saved order.
- A private coat-content edit, selected publication and a separate explicit
  restore to a new product revision. Product inventory remains outside content
  restoration.
- An immutable Product advisor build and a private, product-bound care record
  saved through the actual native app renderer.
- A synthetic CSV care-brush product created only in the selected sandbox.
- A private care guide reviewed and published for synthetic customer answers.
- Flow canvas action/branch changes were explored as an unsaved draft.
- The agent panels, grid prompt and provider settings were opened without making
  model or external provider requests. Email delivery stays disabled. Qdrant is
  not configured in this local capture environment. No printer or payment
  provider certification is claimed by the images.

## Animated workflows and static frames

- [Variants cart](variants-cart.gif): [product detail](product-detail.jpg) → [product variant l](product-variant-l.jpg) → [checkout details](checkout-details.jpg)
- [Checkout](checkout.gif): [checkout details](checkout-details.jpg) → [checkout review](checkout-review.jpg) → [checkout complete](checkout-complete.jpg)
- [Product languages](product-languages.gif): [product general](product-general.jpg) → [product language de](product-language-de.jpg) → [product language fr](product-language-fr.jpg)
- [History restore](history-restore.gif): [product history](product-history.jpg) → [product history confirm](product-history-confirm.jpg) → [product restored](product-restored.jpg)
- [Knowledge publication](knowledge-publication.gif): [knowledge private](knowledge-private.jpg) → [knowledge review](knowledge-review.jpg) → [knowledge published](knowledge-published.jpg)
- [Flow canvas](flow-canvas.gif): [flow canvas](flow-canvas.jpg) → [flow branch](flow-branch.jpg)
- [Channel wizard](channel-wizard.gif): [channel wizard](channel-wizard.jpg) → [channel catalogue](channel-catalogue.jpg) → [channel review](channel-review.jpg)
- [App design](app-design.gif): [app overview](app-overview.jpg) → [app designer](app-designer.jpg) → [app elements](app-elements.jpg) → [app agent](app-agent.jpg)
- [App preview](app-preview.gif): [app preview empty](app-preview-empty.jpg) → [app preview saved](app-preview-saved.jpg)
- [Selective release](selective-release.gif): [private product change](private-product-change.jpg) → [selected release](selected-release.jpg) → [release history](release-history.jpg)

## Source and maintenance

[The manifest](manifest.json) records the capture timestamp, native revision,
viewport, source URL, animation frames and file checksum. Source URLs are local
synthetic contexts and contain no credentials. The images illustrate controls
and the stated local actions; public delivery and provider acceptance remain in
[current status](../../status.md).

The feature guide and current workspace guides use these captures. Exact older
worked examples remain dated archive links. Their old files and hashes are not
relabelled as current screenshots. Replace an image when its actual owner
changes, and update its caption and this manifest in the same change.
