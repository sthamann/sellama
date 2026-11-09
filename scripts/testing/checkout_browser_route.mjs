/** Real Veyndo storefront against isolated Core and Checkout services, including a lost confirmation response. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const { chromium } = await import(process.env.CHECKOUT_BROWSER_MODULE);
function fixtureOrigin(name) {
  const value = process.env[name];
  const url = new URL(value);
  assert.equal(url.origin, value);
  assert.equal(url.protocol, "http:");
  assert.equal(
    url.hostname,
    "127.0.0.1",
    "Use disposable loopback fixture services",
  );
  return value;
}
const base = fixtureOrigin("BASE_URL");
const checkout = fixtureOrigin("CHECKOUT_TEST_SERVICE_URL");
const browser = await chromium.launch({ headless: true });
try {
  for (const drop of [false, true]) {
    const page = await browser.newPage({
      viewport: drop
        ? { width: 390, height: 844 }
        : { width: 1360, height: 900 },
    });
    const nativeWrites = [],
      independentWrites = [];
    let remoteReceipt;
    page.on("request", (req) => {
      if (req.method() !== "POST") return;
      if (req.url() === base + "/store-api/checkout/order")
        nativeWrites.push(req.url());
      if (req.url() === checkout + "/v1/sessions/confirm")
        independentWrites.push(req.url());
    });
    if (drop)
      await page.route(checkout + "/v1/sessions/confirm", async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        const response = await route.fetch();
        assert.equal(response.status(), 200, await response.text());
        remoteReceipt = await response.json();
        await route.abort("failed");
      });
    await page.goto(base + "/?shop=atelier&lang=en-GB");
    const prepared = await page.evaluate(async (email) => {
      const headers = {
        "Content-Type": "application/json",
        "x-tenant": "atelier",
        "x-veyndo-customer-session": "1",
      };
      const post = async (path, body, extra = {}) => {
        const response = await fetch("/store-api/" + path, {
          method: "POST",
          headers: { ...headers, ...extra },
          body: JSON.stringify(body),
        });
        const json = await response.json();
        if (!response.ok) throw Error(JSON.stringify(json));
        return json;
      };
      const address = {
        name: "Fixture Buyer",
        firstName: "Fixture",
        lastName: "Buyer",
        street: "Fixture 3",
        city: "Berlin",
        postalCode: "10115",
        country: "DE",
      };
      const account = await post("account/register", {
        email,
        name: "Fixture Buyer",
        password: "Synthetic-Checkout-browser-fixture!",
        billingAddress: address,
        shippingAddress: address,
      });
      headers["x-veyndo-customer-csrf"] = account.customerBrowserCsrf;
      const first = await post("checkout/cart", {});
      const cart = await post(
        "checkout/cart/line-item",
        { items: [{ referencedId: "lamp", quantity: 1 }] },
        { "sw-context-token": first.token },
      );
      const handoff = await post(
        "checkout/handoff",
        { revision: cart.revision },
        { "sw-context-token": cart.token },
      );
      return {
        path: handoff.checkoutPath,
        cartId: cart.id,
        service: cart.checkoutService,
      };
    }, randomUUID() + "@example.test");
    assert.match(prepared.service?.legalPolicyVersion, /^[0-9a-f]{64}$/);
    const before = await (
      await page.request.get(base + "/store-api/product/lamp", {
        headers: { "x-tenant": "atelier" },
      })
    ).json();
    await page.goto(base + prepared.path);
    const reject = page.getByRole("button", {
      name: /Reject optional|Optionales ablehnen/,
    });
    await reject.click({ timeout: 7000 }).catch(async (error) => {
      if (await page.locator(".privacy-banner[open]").count()) throw error;
    });
    const review = page.getByRole("button", {
      name: /Review order|Bestellung prüfen/,
    });
    await review.click({ timeout: 8000 });
    const terms = page.getByRole("checkbox", {
      name: /I accept the terms|Ich akzeptiere die Verkaufsbedingungen/,
    });
    if (await terms.isVisible()) await terms.check();
    await page
      .getByRole("button", {
        name: /Order with obligation to pay|Zahlungspflichtig bestellen/,
      })
      .click();
    await page
      .waitForURL(/#order-confirmed$/, { timeout: 15000 })
      .catch(async (error) => {
        console.error(
          await page.getByRole("alert").allTextContents(),
          nativeWrites,
          independentWrites,
        );
        throw error;
      });
    const receipt = page.locator(".order-reference strong");
    await receipt.waitFor();
    const orderNumber = await receipt.innerText();
    assert.match(orderNumber, /^RAC-/);
    if (drop) assert.equal(remoteReceipt?.orderNumber, orderNumber);
    await page.reload();
    assert.equal(await receipt.innerText(), orderNumber);
    await page
      .getByRole("button", {
        name: /Back to (the )?(shop|store)|Zurück zum Shop/i,
      })
      .click();
    assert.equal(nativeWrites.length, 0);
    assert.equal(independentWrites.length, 1);
    const after = await (
      await page.request.get(base + "/store-api/product/lamp", {
        headers: { "x-tenant": "atelier" },
      })
    ).json();
    assert.equal(after.product.stock, before.product.stock - 1);
    await page
      .locator(".shop-bag-button b")
      .filter({ hasText: /^0$/ })
      .first()
      .waitFor();
    console.log(
      `PASS native browser ${drop ? "lost confirmation recovery at mobile size" : "purchase at desktop size"}: one service confirmation, one stock decrement, same receipt after reload, empty bag`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
