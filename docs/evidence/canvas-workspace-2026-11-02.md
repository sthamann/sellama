# Shared visual workspace acceptance, 2 November 2026

Scope: standard shop design and declarative App Studio. The source reuses native
page/app documents, domain editors, central inference and existing release owners.
It introduces presentation navigation and context/reference transport, not another
app runtime, table family, job queue or publication owner.

## Native acceptance

The existing `scripts/app_generation.py` suite passes against a real local Rust
server, isolated PostgreSQL database and synthetic model HTTP provider:

- Invalid selected elements fail before a model call; configured language and
  all-channel app scope are checked against the supplied Manifest.
- A valid decoded PNG request larger than 64 KiB reaches the actual image-provider
  transport through the bounded developer HTTP route.
- Private-network references are unavailable. Credential URLs and non-raster
  uploads are rejected. Raw references never become executable markup.
- Coding-agent HTTP export and canonical `developer.task` MCP carry selected
  context. Read-only API identities cannot generate/export developer work.
- Immutable versions retain source status, URLs and digests after reload, without
  raw pixels or HTML. New permissions and accepted business contracts remain
  protected against hostile model edits.
- Native immutable save, real private preview, record upload/save/reload, explicit
  staging, selected package publication and a simulated order review pass.

Two Rust unit cases cover selected-context validation and redacted provenance
roundtrip. Existing Lean verification and negative mutation checks retain their
original kernel boundary; they do not prove a model, HTTP provider or UI correct.

## UI acceptance

65 targeted frontend cases pass across shared scene navigation, native page drafts,
app construction, proposal review, restoration, behavior and schema previews.
They include independent unfinished pages and undo retention, stale environment
replies, candidate preview without adoption, native app save/stage/release,
archive/restore and the visible insertion target when a drop ends on canvas chrome.
The full platform suite remains the daily workflow rather than a per-commit run.

Actual local Chrome actions use a synthetic merchant and private environment:

1. Open the shared shop overview containing home, product, category and content.
2. Open App Studio, edit a placement, add and duplicate a button and add a message
   through its graphical click-handler editor.
3. Attach a screenshot, prepare a real native Codex task and inspect its visible
   export: selected `button_2`, `workspace` view, German content language, one image
   and the exact edited typed handler are present.
4. Save a new immutable app version and confirm the native save result.
5. Drag a palette item before the form, observe its actual first position, then
   undo. The original implementation incorrectly appended on an intervening
   canvas drop; the fixed journey and targeted regression both pass.

The separate three-placement advice package is synthetic demonstration content,
saved through the native build API. App overview scenes explicitly use schema/
sample previews; the functional private preview remains a separate native action.

Desktop 1440 × 1000 and phone 390 × 844 checks passed. The narrow page width
remains exactly 390 px; the unscaled editor handoff keeps a 44 px touch target.
The mobile dock scrolls into reach on opening. Tablet 768 × 1024 with French
interface labels and landscape 844 × 430 also retain exact viewport containment.
An independent Impeccable finish review returned `ship` after reviewing the five
actual captures and the connected implementation. The manual design detector
reported no findings.

Screenshots are [actual local captures](../assets/canvas-workspace-20261102/README.md).
They do not establish external model quality, live provider charging or permanent
original-design asset storage. Product/category handoffs open native data editing;
arbitrary new product/category layout templates are outside this change.

## Delivery

Local acceptance is recorded above. Public image, CI and website delivery must be
verified independently before claiming this source is available online.
