# Component hosting and public documentation: 5 November 2026

## Organization connection

With explicit user approval, Northflank's GitHub application is linked to the
`veyndo` organization for exactly `veyndo/veyndo`, `veyndo/experience` and
`veyndo/shopware-payments`. The installed app's repository selection and the actual
Northflank connected-repository view both show these three repositories. The SDK,
Apps and Marketplace repositories are not included in this installation.

The existing Core build, Experience and Payments source mappings now name those
transferred repositories. Build configuration, existing CI/CD choices and running
versions were retained during this mapping step. Payments starts its already
enabled normal build; this is not acceptance or deployment of new payment behavior.
Complete composition/runtime cutover remains separate under ORG-07.

## Deployed website repair

The private Experience repository's reviewed PR 85 fixes the fixed handbook/media
origin and explicit CSP after the organization transfer. Its required application
CI passes; its review records 254 local tests plus type, structure, localization
and production client/Team builds. Source remains in the private repository.

The existing Northflank service successfully cloned the newly linked repository,
built exact commit `fb97774c1ed82f7a8186a17e3727e4e5eb97b06b` as
`max-beginner-2585`, and deployed it. After initial instance readiness, the public
website serves the current handbook instead of the previous upstream 404.

Observed public checks:

- Homepage, Team, SaaS entry and Experience entry return HTTP 200.
- `/docs/commerce-components.html` returns HTTP 200.
- `/docs/evidence/app-installation-component-2026-11-05.html` returns HTTP 200
  and contains exact Apps source commit `b30e5a71a6d3e8323a8a74d26468eff4b1395841`.
- All actual favicon, logo, CSS and JavaScript references from that document
  return HTTP 200 with appropriate MIME types. Browser navigation renders its
  heading, chapter navigation, source link and ownership table.
- The public video `/docs/assets/showcase/release.mp4` honors
  `Range: bytes=0-1023` with HTTP 206, a matching Content-Range and 1024 bytes.
  The response does not relay upstream Set-Cookie. A second showcase recording
  also responds with the requested byte range.
- The documentation CSP explicitly includes the new `veyndo.github.io` media
  origin. GitHub Pages publication for composed commit
  `a5466d46498bf57cabbfacfad6d1f2a5cdf2d58c` succeeds in
  [run 42065745039](https://github.com/veyndo/veyndo/actions/runs/42065745039).

These are public documentation/entry and media transport checks. They do not
repeat authenticated onboarding, the complete checkout, provider payments or
device-specific playback acceptance. The comprehensive historical alias/link and
media compatibility audit stays open under ORG-06b. New Apps code is published and
integrated in the complete repository; this website repair is not a claim that
all running commerce services have adopted the latest Core source.
