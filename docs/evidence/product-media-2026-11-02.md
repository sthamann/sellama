# Current product media, 2 November 2026

## Source and captures

The public Core is on `f35024ada3239d6ca676d7962943fb03c2da9163`. Its runtime and
frontend sources are unchanged from captured native build
`b1f2269b7a29ef1059edb34db07c0654b02a8a93`; later changes concern documentation and
media. Individual feature/provider acceptance remains in [current status](../status.md).

The [capture library](../assets/product-tour-20261102/README.md) contains 95 actual
Chrome screenshots and ten edited GIF sequences. The feature guide and current
workshop pages use these dated images. A follow-up review inspected all 95 stills
for loading/error text and replaced two incomplete states: product recommendations
and AI boundaries. The former follows an actual native save of two related products
for the fictional wool coat; the latter shows loaded controls with manual approval
retained. No external model or provider was invoked.

The first capture run completed a synthetic purchase, cash sale, app record save,
CSV creation, selected content publication and explicit content restoration.
Source manifests record dimensions, timestamps, URLs and hashes. Those local
actions do not replace the dated public checkout/provider acceptance.

## Four current films

| Film | Duration | Connected work |
| --- | --- | --- |
| AI commerce | 1:56 | Merchant context, intake, knowledge, design references, Canvas, app assistance and fictional customer scenarios |
| Concept | 1:12 | A wool coat, merchant tools, personal workspace, saved app record, Canvas and native simulated order |
| Product workspace | 1:36 | Content, captions, SEO, related products, variants, private design, publication and restoration |
| Product advisor app | 1:24 | Placements, visual editing, coding assistance, settings, relations, actions and saved care guidance |

[Watch or download](../video-tours.md) ·
[Encoding and sources](../assets/showcase/product-films-20261102/README.md).

All 29 UI chapters use actual 2 November screenshots. They are editorial still
sequences with reading holds, English titles and burned-in subtitles. Separate
WebVTT/SRT tracks and editable HyperFrames projects are included. Captions describe
the visible source, not an invented model response. Earlier dated films and exact
workflow evidence remain archived.

## Verification

- Composition, runtime and sampled layout checks pass for all four films.
- Beat, phone and seam sheets were reviewed. An independent review found a heading
  collision and an app-creation picture in a chapter about an existing app. Both
  were corrected and the updated frames inspected.
- Final MP4s are 1920 × 1080, 30 fps, H.264 High Level 4.1, YUV420p, without audio.
  Every frame passes full decode; `moov` precedes `mdat` for progressive playback.
  Manifests retain duration, size and SHA-256.
- Website copy supports all four interface languages. The Team hub retains matching
  German and English catalogues. Image date and native-test origin stay explicit.
  Native controls, on-demand loading and caption downloads remain available.
- Gallery keyboard navigation covers products, knowledge, apps and Canvas, including
  wrapping and the matching handbook destination. Existing Team retry checks remain.

The standard SaaS/Experience entry also receives six current short workflow
previews and twelve current posters from the same dated GIF/screenshot library.
They retain the source holds and English interface, pass full decode and use
H.264/YUV420p with progressive playback. Existing dated original Storyfront
example captures remain explicitly dated examples.

The complete handbook build/check passes 364 pages, 357 Markdown sources and
40,035 local link/asset references. Short structure/localization/source-inventory
and README/status hygiene checks pass. The separate website checks pass 254 tests;
the focused gallery/Team checks pass eight tests. The design detector reports no
findings on the changed source surfaces. Actual local Chrome playback reaches
`readyState=4`, 1920 pixels and 77 seconds without a media error. The mobile Canvas
gallery has `scrollWidth=innerWidth=390`. These are scoped publication checks.

## Delivery

The public docs, README and static gallery were published in
[PR 264](https://github.com/sthamann/veyndo/pull/264), merged as
`14f86499bf65ab0e39363290617d3da349d41687`.
[Pages run 41499997340](https://github.com/sthamann/veyndo/actions/runs/41499997340)
completed successfully. The actual root homepage, four-language marketing copy,
SaaS previews and both Team languages were published from private Experience
PR 84, merged as `aa344b5217b428cbb72cc0dc7d0d6ad55c2800e9`.
Both private CI runs passed, including the actual original Storyfront image boot,
PostgreSQL and runtime integration checks. Linux test ordering exposed a fixture
closing the shared storage connection before access regressions; that teardown
now belongs to process exit. All 33 route/access regressions pass together.

Northflank built the unchanged original native packaging as `great-produce-4187`
in 1 minute 42 seconds and deployed that exact merge. The existing service reports
Running, 1/1 instances. No new service, database access or provider was added.

Public verification after rollout on 2 November:

- [Homepage](https://www.veyndo.ai/?locale=de-DE),
  [German Team](https://team.veyndo.ai/#tours),
  [English Team](https://team.veyndo.ai/en.html#tours),
  [feature guide](../features.md), [status](../status.md), this handbook and the
  main-branch README serve the refreshed content.
- All four films on each of the homepage, Team host and handbook have the exact
  manifest SHA-256. All twelve MP4 deliveries answer range requests with HTTP 206,
  the correct `Content-Range` and `video/mp4`.
- All four homepage films reached `readyState=4`, 1920 decoded pixels and more
  than 15 seconds of real playback without a media error, then were paused.
  The Team play control starts real frames; its Canvas chapter seeks to 56 seconds
  and continues playback. The handbook's native player also plays successfully.
- The public Canvas gallery selects its real current shop overview, loads the
  1440-pixel capture and has no horizontal overflow at either 390 or 2560 pixels.
  The handbook video page also fits 390 pixels. The English Team page displays
  four current films and its 2 November capture dates without broken loaded images.
- Older recordings remain explicitly dated archives or original example captures;
  they are not relabelled as current native UI. These browser and encoding checks
  do not claim a new physical iOS/Safari device test or external payment acceptance.
