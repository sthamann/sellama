# Guided shop setup

[`PRODUCT.md`](PRODUCT.md) defines this scoped extension of the existing Studio.
It inherits the incumbent design system and native owners.

`SetupProvider` reads and updates only the optional `setup` field in the existing
actor-private `/api/studio/workspace` preference. It merges into a fresh record
and preserves CAS, the layout, goals and current personal/shop identity. Compare
the saved setup baseline before merging: another tab's progress triggers a
reloadable conflict; unrelated fresh layout changes are retained. Native
settings, publication, commerce and agent operations keep their existing owners.

`SetupWizard` shows an optional first-run welcome for an unconfigured personal
workspace in a shop without orders. A stable **Set up your shop** navigation
entry reopens it. The six review areas lead to existing settings, catalogue,
site-builder, environments, legal and order views. `SetupBanner` keeps a return
path visible during active live-shop setup. It is not displayed in a sandbox.

`SetupBasics.tsx` reuses `settings/useSettingsDraft`, `CompanyField` and
`SettingsSaveBar` for inline native company name, contact email and address editing.
The existing settings owner validates and saves company data; setup progress does
not create a second copy of it.

`useSetupFacts` reads only current, permitted native data. Availability does not
mean verification: progress counts the user's explicit reviews, not readiness
for production. A completed guide does not certify legal compliance, providers
or a checkout. The AI action uses the existing context-aware merchant assistant.
The native
`src/agent_runs/context.rs` owner admits bounded current setup view context and
rejects a supplied tenant field; generated operation schemas share that contract.
No provider configuration, automatic publication or parallel onboarding executor.

The state is bounded and validated by `src/studio/personal/model.rs`; existing
workspace RLS, revisions and history apply. No tables or new API operations.
UI vocabulary is in `setup-i18n.ts` and `step-i18n.ts` (EN/DE/FR/ES).

[User guide and local acceptance](../../../../docs/shop-setup.md).
