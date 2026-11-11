# Build a Product Guide for the shop and Studio chats

The Product Guide adds a product card to the shopper's conversation and a
separate table for the merchant. Both views read from the installed app. Use it
to show product care to the shopper while the merchant keeps editorial notes
and priorities in Studio.

## Install and prepare two records for each view

1. Open **Apps** in a disposable shop. Choose **Import app package**, select
   the [Product Guide manifest](../extensions/apps/assistant-examples/mcp-app.json)
   and review its version and declared access. Use a private environment first.
2. Pick an active product in the test channel. In the app's product tab,
   add two guide records tied to that product. Use the two values below for
   the care type.
3. Open **App data** and add two private merchandising records. The example's
   Product care and Private merchandising notes collections are named
   separately. The `save_merchant_entry` action also works through the merchant
   API. Use the same product ID and a different record ID for each entry.
   Keep private notes out of the public `entries` model.

| Model | Segment | Example title |
| --- | --- | --- |
| `entries` | `standard` | Everyday care |
| `entries` | `priority` | Special care |
| `merchandising` | `standard` | Check the current photography |
| `merchandising` | `priority` | Review the care description |

The action payload has an `id` and `fields`. The fields are `product_id`,
`title`, optional `body` and `segment`. Use the shop's main language for
the initial title and add translations as needed.

## Try it in both conversations

In the shop preview, ask for the product guide for the chosen product. Change
the care filter. Choose **Use filter in chat** to carry the selection into your
next editable message. When a result references an available product, the
Veyndo host can open its variant picker and show a cart preview with current
price and delivery. The shopper confirms the cart change separately.

In Studio, ask for the merchandising notes for the same product. Filter by
priority. Ask the assistant to prepare a change to the care description.
Review the saved proposal and its original product revision before applying
it. The app's table is read-only. The Studio host owns the proposal and its
approval. Publish the reviewed app version only when the shopper preview
and the merchant view both behave as intended.

## Reuse the tool and view in another host

The hosted Lumen check exercised both filters with the real model and verified
that a public request could not open private merchandising notes.
[Observed result and current repair scope](status.md#product-guide-in-both-live-conversations).

When an initial tool call already selects a priority, the view keeps that
restriction. Ask for all priorities first to use the selector yourself. The
selector can narrow the original query; it cannot remove its product or other
fixed filters. **Use filter in chat** updates a draft and never submits it.

Run the [SDK example](../extensions/apps/assistant-examples/product-guide.mjs)
from a Node 22 project with `@veyndo/sdk` installed. When working directly
with an SDK checkout, set `VEYNDO_SDK_MODULE` to its absolute
`src/index.js` path.

```sh
VEYNDO_URL=http://127.0.0.1:8787 \
VEYNDO_SHOP=your-test-shop \
VEYNDO_PRODUCT=your-product-id \
node product-guide.mjs
```

Use a server-side `VEYNDO_STUDIO_TOKEN` for the optional merchant check.
The example negotiates MCP Apps, discovers each registered resource and
checks both filters through the matching read tool. It also checks that a
shopper cannot open the merchant view. It makes no changes.

A chat host loads the returned HTML resource in a sandboxed frame, sends the
initial tool arguments and result, and mediates subsequent tool calls. Use
the host's supported MCP Apps bridge for that lifecycle. A host that only
supports text can still use the tool result. OpenUI can render a generated
product comparison alongside these views using the same catalogue facts
and reviewed cart operations.

The native view uses the negotiated host theme with paired text and background
colours. Hosts can send `theme: "light"` or `theme: "dark"` in `hostContext`
and update it with `ui/notifications/host-context-changed`. An unrecognized
theme value or a message from another window/origin cannot restyle the view.
View references tell the agent what the host offers; they do not certify that a
browser rendered it or that a customer completed an interaction.

## Let agents discover the valid filters

Tool discovery describes `filter.product_id` and `filter.segment`, including
the `standard` and `priority` choice values. Translated text and unindexed
fields are excluded from a generic native-list filter. The host derives this
metadata from the installed model using Apps model 0.14.0; it does not alter
the immutable package or create database indexes. Explicit app-authored filter
schemas stay intact. The original data owner still checks every actual query.
JavaScript clients receive this metadata through the existing SDK:

```js
const { tools } = await client.tools();
const guide = tools.find(t => t.name === "app.example_agent_results.list_entries");
const fields = guide.inputSchema.properties.filter.properties;
// Use these actual fields and choices for controls or the agent's tool schema.
console.log(Object.keys(fields), fields.segment.enum);
```

[MCP Apps lifecycle](https://apps.extensions.modelcontextprotocol.io/api/documents/Overview.html) ·
[OpenUI storefront example](https://github.com/veyndo/sdk/blob/main/docs/nord-atelier.md).
