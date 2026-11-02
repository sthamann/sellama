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

[PR 258](https://github.com/sthamann/veyndo/pull/258) merged as
`f079e294362e3cc5c522615652d493661427e950`. Main quick verification, the
smoke-tested packaged image, migration image and documentation deployment passed:
[quick checks](https://github.com/sthamann/veyndo/actions/runs/41466420823),
[packaged runtime](https://github.com/sthamann/veyndo/actions/runs/41466420779),
[migration image](https://github.com/sthamann/veyndo/actions/runs/41466420817),
[website](https://github.com/sthamann/veyndo/actions/runs/41466420981).

The existing Northflank main workflow
`25831be9-0954-44c0-bac8-1677b61bb583` built that exact commit, completed snapshot
`26-11-02-150522-backup`, passed the native migration job and deployed Core with
one ready replica. Total duration was 12m55s; backup took 45s, migration 14s and
Core deployment 1m11s. Public `/health` returned `status: ok` with PostgreSQL and
simulated payment after deployment.

Actual public Chrome acceptance used the existing synthetic **Veyndo Completion
Lab 15 Oct** and a private environment. It covered the authenticated start-to-Studio
handoff, shared shop overview, opening the real product editor, an existing advice
app template in the new placement overview, selected-button actions and its existing
graphical click-handler editor. The public contextual agent exported a real Codex
task containing `view: workspace`, `selected: save`, `language: de-DE`, `channel: *`
and the current Manifest digest. Saving the native immutable app version returned
**Version saved**, with one release record. The package was not installed or
published to the live shop by this acceptance.

The public illustrated guide loaded all three actual capture assets. The wider
reference-image/provider fixture and selected-publication tests remain the local
native acceptance described above. Public UI checks do not establish external
model design quality or an additional real-payment acceptance.

[Public shop overview](../assets/canvas-workspace-20261102/public-shop-overview.png) ·
[Corrected expanded task](../assets/canvas-workspace-20261102/agent-export-contained.png).

The public task check exposed intrinsic CSS grid expansion when the full task
was opened: content grew to roughly 3,982 px inside a 324 px dock. The shared
agent panel and task-transfer grid now use shrinkable tracks; long task tokens
wrap. A fresh actual local native export with 68,205 characters keeps the dock
at `clientWidth = scrollWidth = 324`, with no overwide descendants. At a 390 px
phone viewport, document width stays 390 and the dock stays 357 px without
horizontal overflow. The rebuilt frontend and formatting passed; the independent
finish review returned `ship` for this focused containment correction. The
linked corrected-task capture is local; the public overview is captured after
the first rollout.
