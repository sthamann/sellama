/** Discover and exercise the Product Guide's installed MCP App from another host. */
import assert from "node:assert/strict";

const { VEYNDO_URL, VEYNDO_SHOP, VEYNDO_PRODUCT, VEYNDO_STUDIO_TOKEN } = process.env;
assert.ok(VEYNDO_URL && VEYNDO_SHOP && VEYNDO_PRODUCT,
  "Set VEYNDO_URL, VEYNDO_SHOP and VEYNDO_PRODUCT for your installed guide");
const { createClient } = await import(process.env.VEYNDO_SDK_MODULE || "@veyndo/sdk");
const settings = { baseUrl: VEYNDO_URL, shop: VEYNDO_SHOP, mcpApps: true };
const publicTool = "app.example_agent_results.list_entries";
const privateTool = "app.example_agent_results.list_merchant_entries";
const mimeType = "text/html;profile=mcp-app";

async function openGuide(client, toolName, expectedField) {
  const hello = await client.initialize();
  assert.ok(hello.capabilities.extensions?.["io.modelcontextprotocol/ui"]);
  const { tools } = await client.tools();
  const tool = tools.find(({ name }) => name === toolName);
  const resourceUri = tool?._meta?.ui?.resourceUri;
  assert.ok(resourceUri, "Install the Product Guide and enable its declared view");
  const filter = tool.inputSchema.properties.filter;
  assert.equal(filter.additionalProperties, false);
  assert.deepEqual(Object.keys(filter.properties).sort(), ["product_id", "segment"]);
  assert.deepEqual(filter.properties.segment.enum, ["standard", "priority"]);
  const { contents: [view] } = await client.resource(resourceUri);
  assert.equal(view.mimeType, mimeType);
  const definition = view._meta["ai.veyndo/definition"];
  assert.equal(definition.toolName, toolName);
  assert.equal(definition.productReference, expectedField);
  return { tools, resourceUri };
}

async function checkFilters(client, name, resourceUri) {
  for (const segment of ["standard", "priority"]) {
    const filter = { product_id: VEYNDO_PRODUCT, segment };
    const { elements } = await client.tool(name, { filter, limit: 10 }, { resourceUri });
    assert.ok(elements.length, `Add at least one ${segment} record for ${VEYNDO_PRODUCT}`);
    assert.ok(elements.every(({ product_id, segment: actualSegment }) =>
      product_id === VEYNDO_PRODUCT && actualSegment === segment));
    console.log(`${name}: ${segment}, ${elements.length} matching records`);
  }
}

const shopper = createClient(settings);
const publicGuide = await openGuide(shopper, publicTool, "product_id");
assert.ok(!publicGuide.tools.some(({ name }) => name === privateTool));
await checkFilters(shopper, publicTool, publicGuide.resourceUri);

if (VEYNDO_STUDIO_TOKEN) {
  const merchant = createClient({ ...settings, token: () => VEYNDO_STUDIO_TOKEN });
  const privateGuide = await openGuide(merchant, privateTool, null);
  await checkFilters(merchant, privateTool, privateGuide.resourceUri);
  await assert.rejects(shopper.resource(privateGuide.resourceUri));
  console.log("Shopper cannot read the merchant resource");
}
