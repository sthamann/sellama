/** Small local host for a native order and independent Knowledge policy, using separate read grants. */
import { createServer } from 'node:http';
import { createClient } from '@veyndo/sdk';
import { createComposition } from '@veyndo/sdk/composition';

const config = process.env;
const port = Number(config.WORKSPACE_PORT ?? 8817);
const origin = '127.0.0.1:' + port;
if (!Number.isInteger(port) || port < 1024 || port > 65535 ||
    !config.WORKSPACE_SHOP || !/^[A-Za-z0-9_.:-]{1,128}$/.test(config.WORKSPACE_ORDER_ID ?? '') ||
    !config.COMMERCE_ACCESS_TOKEN || !config.KNOWLEDGE_ACCESS_TOKEN) {
  throw new Error('Set a local port, shop, order ID and separate Commerce and Knowledge read credentials');
}

const services = [
  { id: 'commerce', client: createClient({
    baseUrl: config.COMMERCE_URL, shop: config.WORKSPACE_SHOP,
    token: () => config.COMMERCE_ACCESS_TOKEN, timeoutMs: 4000,
  }) },
  { id: 'knowledge', client: createClient({
    baseUrl: config.KNOWLEDGE_URL,
    fetch: (url, request) => {
      const headers = new Headers(request.headers);
      headers.set('x-expected-tenant', config.WORKSPACE_SHOP);
      return fetch(url, { ...request, headers });
    },
    token: () => config.KNOWLEDGE_ACCESS_TOKEN, timeoutMs: 4000,
  }) },
];
const views = [
  { id: 'order.shipping', version: 1, title: 'Order and shipments',
    service: 'commerce', operation: 'merchant.order', effect: 'read',
    arguments: () => ({ id: config.WORKSPACE_ORDER_ID }) },
  { id: 'knowledge.shipping', version: 1, title: 'Shipping policy',
    service: 'knowledge', operation: 'knowledge.documents.search', effect: 'read',
    arguments: () => ({ query: config.WORKSPACE_POLICY_QUERY ?? 'shipping delivery delays',
      locale: config.WORKSPACE_LOCALE ?? 'en-GB', mainLocale: config.WORKSPACE_MAIN_LOCALE ?? 'en-GB' }) },
];
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const list = (items) => '<ul>' + items.map((item) => '<li>' + item + '</li>').join('') + '</ul>';

function orderContent(order) {
  return '<p>' + escape(order.orderNumber) + '</p>' + (order.deliveries?.length
    ? list(order.deliveries.slice(0, 20).map((delivery) => escape(delivery.state)))
    : '<p>No shipment recorded.</p>');
}
function policyContent(result) {
  return result.sources?.length
    ? list(result.sources.slice(0, 3).map((source) =>
      '<strong>' + escape(source.title) + '</strong><p lang="' + escape(source.locale) + '">' +
      escape(source.text) + '</p>'))
    : '<p>No matching shipping policy.</p>';
}

async function render() {
  const host = createComposition({ services, views, context: { shop: config.WORKSPACE_SHOP } });
  try {
    await host.discover();
    return (await Promise.all(views.map(async (view, index) => {
      const layout = { version: 1, panels: [{ id: 'panel', view: view.id, version: 1 }] };
      let body;
      try {
        const { data } = await host.read(layout, 'panel');
        body = index === 0 ? orderContent(data) : policyContent(data);
      } catch {
        body = '<p>This view is currently unavailable. Check its service and read access.</p>';
      }
      return '<section><h2>' + view.title + '</h2>' + body + '</section>';
    }))).join('');
  } finally {
    host.dispose();
  }
}

createServer(async (request, response) => {
  if (request.headers.host !== origin || request.method !== 'GET' || request.url !== '/' ||
      request.headers['sec-fetch-site'] === 'cross-site') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff' });
  const panels = await render().catch(() => '<p>The workspace is currently unavailable.</p>');
  response.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Order shipping workspace</title><style>body{font:1rem/1.55 system-ui;margin:0;padding:clamp(1rem,4vw,3rem)}' +
    'main{max-width:65ch;margin:auto}section{border-top:1px solid;padding-block:.75rem;overflow-wrap:anywhere}</style>' +
    '<main><h1>Order shipping workspace</h1>' + panels + '</main></html>');
}).listen(port, '127.0.0.1', () => console.log('Open http://' + origin));
