# Shared media captions

- `MediaCaptionEditor.tsx` edits the selected content language and reviews a bounded AI proposal. Image, language, content and request changes discard stale responses. The native product, page or app editor owns saving, revision and publication.
- `caption-i18n.ts` contains EN/DE/FR/ES interface copy; enabled content locales come from `ContentLanguage`.
- `captions.css` fits existing media inspectors without a second workspace or AI conversation owner.

Captions are visible text, separate from accessibility alt text. `merchant.media.caption` uses central inference, current assistant permission and enabled shop locales. Context-only proposals are explicitly labelled. No generation call saves or publishes content.
