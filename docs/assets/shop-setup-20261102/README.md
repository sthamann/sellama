# Guided setup captures

Captured 2 November 2026 from the actual local Rust service and built Studio in a
synthetic, isolated `atelier-demo` shop. Source branch:
`feat/shop-setup-assistant-20261102`. Images are browser captures, not mockups.

- `welcome.png`: optional welcome and six-area route, desktop 1440 × 1000.
- `desktop.png`: Products step after explicit company review, desktop 1440 × 1000.
- `mobile.png`: the same Products step at 390 × 844, with horizontal step navigation
  confined to its own rail. Main content had no horizontal overflow.

The browser journey saved synthetic company settings through the existing native
form, advanced a step, paused and reopened the saved step, and followed the native
catalogue link with a return banner. A second actual browser tab could not replace
a newer review; reloading recovered the newer step. At 390px, Products → Design
revealed the active rail item automatically (scrollLeft 243, item within the rail).
The guide completion and restart controls were exercised with synthetic progress.
Captures show source/local acceptance, not
public deployment, provider acceptance or a completed purchase. Payments are
simulated. The guide records personal reviews, never automatic readiness approval.
