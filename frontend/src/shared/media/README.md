# Shared media captions

- `MediaCaptionEditor.tsx` edits the selected content language and reviews a bounded AI proposal. Image, language, content and request changes discard stale responses. The native product, page or app editor owns saving, revision and publication.
- `caption-i18n.ts` contains EN/DE/FR/ES interface copy; enabled content locales come from `ContentLanguage`.
- `captions.css` fits existing media inspectors without a second workspace or AI conversation owner.

Captions are visible text, separate from accessibility alt text. `merchant.media.caption` uses central inference, current assistant permission and enabled shop locales. Context-only proposals are explicitly labelled. No generation call saves or publishes content.

`product-media.ts` owns the shared typed image/model distinction and scoped
model URLs. `ModelViewer.tsx` loads the pinned viewer on demand, with localized
controls and error recovery. `model-decoder-disabled.ts` excludes an unused
WebAssembly decoder; native admission requires uncompressed embedded GLB.
`model-i18n.ts` owns interface and accessibility strings.
