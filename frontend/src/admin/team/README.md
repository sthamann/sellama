# admin/team

Personal accounts, memberships, roles, invitations and scoped developer access.

Files and their individual responsibilities are listed in [the generated source inventory](../../../../docs/module-inventory.md). Each file starts with its contract summary.

## Modules

- [`AccessManager.tsx`](AccessManager.tsx): Fine-grained team overrides, revocable invitations and personal session inventory.
- [`PersonalAccountForm.tsx`](PersonalAccountForm.tsx): PersonalAccountForm: focused account-form view with explicit typed inputs and callbacks.
- [`UsersManager.tsx`](UsersManager.tsx): Users Manager: Personal accounts, memberships, roles, invitations and scoped developer access..

## Verification

Run `npm run build`, `npm test`, `npm run test:coverage` and `npm run architecture` from `frontend/`. Coverage includes untested source files; a module in this folder is not automatically fully tested. See the root [testing guide](../../../../docs/testing.md) for backend integration and coverage limits.

`PermissionPicker` groups the canonical supplied scopes by their task area, with readable labels, technical IDs, current selection counts and search. `permission-groups` and `permission-picker.css` are shared with integration-key management; neither changes the authorization registry or grants.

`CreateWorkspace` owns only the inline creation form and editable identifier
suggestion. `UsersManager` submits through the native personal account API and
retains the selected shop on rejection. Invitations use controlled current role
options, preserving Viewer as the default through asynchronous loading.
`AccessManager` reuses Developer's `IntegrationKeys` instead of a second key form.
The key manager imports its own styles, so direct Team entry is fully styled.
