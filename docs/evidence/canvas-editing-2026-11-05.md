# Canvas editing acceptance, 5 November 2026

## Checked behavior

The actual local Rust Core with isolated PostgreSQL and the production frontend
build was exercised in Chrome with synthetic data. No production content was
changed for these local checks.

- A product opened from the scene board without page navigation, page save or
  page design controls. The native editor saved its German name as revision 2;
  reopening retained the name. Returning while dirty opened the discard dialog,
  and cancelling retained the edit.
- A category opened in the same workspace, saved its German description and
  returned to the scene board.
- The home page accepted a German heading change through its selected element
  properties. Explicit page save and reload retained it in the rendered preview.
- The shared properties separator resized with arrow keys. The narrow product
  editor exposed its section selector at 1024px, where the available editor width
  was about 767px. Media navigation worked. The 390px mobile view had no document
  overflow and retained its section selector.
- App Studio selected its form, edited its title and a field label and saved
  version 0.1.1. The contextual agent showed that form, placement and de-DE.
  No inference quality claim is made by opening that sidebar.

## Verification

Targeted component checks cover native handoff admission, hidden page tools,
unfinished edits, selected scene labels, retained page undo, real Manifest edits,
read-only catalogue controls and 3D media upload admission. The TypeScript and
production build, frontend architecture, EN/DE/FR/ES localization, source inventory,
documentation hygiene and reviewed-source registry passed. The Impeccable source
detector found no issues in the scanned changed surfaces; responsive browser
inspection provided the visual checks. Light and dark Studio colors use the same
existing theme tokens; storefront preview colors remain owned by the shop design. The daily full suite is unchanged.

Screenshots in the [visual guide](../visual-workspace-canvas.md) show the local
synthetic acceptance shop. Public deployment is recorded separately in status.md.
