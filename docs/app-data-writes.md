# Independent App Data: managed writes and history

Create and update private App records from your own application or agent through
HTTP, MCP and the existing JavaScript SDK. App Data service 0.2.0 adds an explicitly
enabled write profile alongside the existing restricted reader. Veyndo embeds the
same original mutation, workflow and retained-history implementation.

## One reviewed change

1. Read the installed private list action to obtain its current `packageDigest`
   and the record's current `revision`.
2. Submit the selected private save action with that digest, revision, typed fields
   and explicit `approve: true`.
3. Current OAuth merchant/action rights are checked afresh. One signed transaction
   locks the package and record, validates fields and state changes, captures
   history, writes the record and appends the minimized event.
4. A successful response contains the new revision. A version or package conflict
   requires a fresh read and review. An uncertain network response is resolved by
   reading the current state before retrying.

```js
const page = await client.tool('apps.records.read', {
  app:'cases', action:'list_cases', query:{}
});
const saved = await client.tool('apps.records.write', {
  app:'cases', action:'save_case', packageDigest:page.packageDigest, approve:true,
  input:{id:'case_1', revision:0, fields:{title:'New case', reference:'stable', status:'new'}}
});
const history = await client.tool('apps.records.history', {
  app:'cases', action:'list_cases', id:saved.id
});
```

HTTP uses `/v1/records/write` and `/v1/records/history` with these same inputs.
MCP additionally requires explicit opt-in on the installed action. Confirmation
never grants authority: writes require current `apps.read`, `apps.manage` and the
selected action's primary/additional permissions. Caller identity, tenant, grants
or package definitions cannot be supplied in the body.

## Deliberate host setup

The default `APP_DATA_MODE=read` keeps schema 1 and its SELECT-only login. The
operator can explicitly apply `data-service/sql/enable-writes.sql` as the original
migration owner, then start `APP_DATA_MODE=write`. This version-2 upgrade adds two
fixed application tables, history and outbox, to the four original application
tables; the two fixed scope-authority tables remain. App/model/shop creation
produces no new SQL objects.

The serving login remains nonowner, without superuser, RLS bypass, role inheritance
or schema rights. Its grants are limited to record insert/field-and-revision
update, immutable history insert/read/retention cleanup and event insertion.
Package row-lock permission is paired with a rejecting RLS write check, so it
cannot actually modify packages. Models and installation remain operator-owned.
Startup rejects missing or excessive privileges and never runs a migration.
[Complete setup and contract](https://github.com/veyndo/apps/blob/main/data-service/managed-writes.md).

## Shared behavior and supported model policy

The first write profile supports private declarative App-owned records with
strings, integers, booleans, JSON, exact decimal strings, dates, choices, field
validation and App-owned states/immutable fields. History retains the original
20-version and 16 MiB App bounds. Historical reads require both current rights and
the scopes retained with that version; projection uses current declared fields.
Actor/source come from the authenticated host context.

Models needing native product/customer/order/company resolution, assets, language,
currency, rich-content, relation, index/unique or commerce policies are rejected
until those actual owners are connected. There are no permissive fallback
validators. Native Veyndo keeps its complete existing field/reference/language/
commerce admission and does not use this portable profile as a replacement.

Native `src/apps/record_write.rs` now delegates its original state/history hooks to
Apps `src/managed_hooks.rs` on the same transaction around the existing mutation
and outbox owner. This keeps normal native App functionality while making the
portable operation independently usable.

[Acceptance](evidence/app-data-managed-writes-component-2026-11-06.md) records the
actual environments and tests. Full independent installation, settings, jobs,
native resource policies, historical restore, sandbox publication and standalone
Flow/outbox dispatch remain on the [component list](commerce-components.md).
