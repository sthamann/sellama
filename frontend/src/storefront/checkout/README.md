# storefront/checkout

One-page customer identity, authoritative quote review and provider handoff.

- `CheckoutPanel.tsx`: owns draft/review lifecycle, modal locks and confirmation.
- `CheckoutApproval.tsx`: B2B approval after native delivery/payment review, then read-only refresh of the exact cart. Purchase remains blocked for missing approval/budget; changed quotes reset review.
- `CheckoutDetails.tsx`: native form, customer account, addresses and selection.
- `CheckoutIdentity.tsx`: existing login/register and customer contact controls.
- `SavedPaymentChoice.tsx` and `useSavedPaymentMethods.ts`: current-account consent, redacted instrument choice and native revocation; no provider tokens in browser state.
- `CheckoutMethods.tsx`: destination-aware delivery/payment radio choices.
- `CheckoutSummary.tsx`: actual item media, quantity/coupon, totals and discounts.
- `CheckoutPurchase.tsx`: single explicit review/purchase action in the persistent dock.
- `CheckoutProgress.tsx`: accessible data/review/completion steps.
- `OrderCompletion.tsx`: actual accepted order snapshot and scoped payment recovery.
- `OrderConfetti.tsx`: finite decorative CSS celebration with reduced-motion support.
- `checkout-order.ts`: tenant/channel/cart transport, current customer session, reviewed revision/cents and replay key. The shared `customer-session.ts` owner supplies the same identity used by all Store API requests; current B2B grants are rechecked by the server.
- `independent-checkout.ts`: opt-in signed-in test purchases through the separate service, with exact native cart revision, amount and legal review. The storefront still displays the original Commerce receipt.
- `PaymentSession.tsx`: verified status, bounded polling, provider return and recovery.
- `../styles/checkout.css`: responsive checkout layout and touch/focus states.

[Checkout contract and proof boundary](../../../../docs/checkout.md).
Run frontend build, tests, architecture/localization and coverage checks.
Coverage includes untested source; file presence does not mean full coverage.
