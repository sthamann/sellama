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
const sameOrigin = process.env.CHECKOUT_TEST_TRANSPORT === "same-origin";
const confirmationPath = sameOrigin
  ? base + "/store-api/checkout/independent/confirm"
  : checkout + "/v1/sessions/confirm";
const paypal = process.env.CHECKOUT_TEST_PAYPAL_FIXTURE
  ? fixtureOrigin("CHECKOUT_TEST_PAYPAL_FIXTURE")
  : undefined;
const providerOrigin = "https://provider.veyndo-test.local";
const merchant = process.env.CHECKOUT_TEST_BROWSER_MERCHANT_TOKEN;
if (paypal)
  assert.ok(merchant, "Use a disposable merchant token for the refund");
const foreignShop = "checkout-isolation-" + randomUUID().slice(0, 8);
if (sameOrigin) {
  const foreignOwner = await fetch(base + "/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspaceId: foreignShop,
      workspaceName: "Checkout isolation fixture",
      name: "Fixture Owner",
      email: foreignShop + "@example.test",
      password: "Synthetic-Checkout-browser-fixture!",
    }),
  });
  assert.equal(foreignOwner.status, 200);
}
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
    const exposedGrants = [];
    let remoteReceipt;
    if (paypal) {
      await page.route(providerOrigin + "/fixture/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        assert.ok(
          ["/fixture/payment", "/fixture/browser-approve"].includes(path),
        );
        const response = await fetch(paypal + path, {
          method: route.request().method(),
          body: route.request().postData() ?? undefined,
        });
        await route.fulfill({
          status: response.status,
          contentType: response.headers.get("content-type"),
          body: await response.text(),
        });
      });
      // The approval fallback must never reach a real provider in this run.
      await page.route("https://www.sandbox.paypal.com/**", (route) =>
        route.abort(),
      );
    }
    page.on("request", (req) => {
      if (req.method() !== "POST") return;
      if (req.url() === base + "/store-api/checkout/order")
        nativeWrites.push(req.url());
      if (req.url() === confirmationPath) independentWrites.push(req.url());
      if (
        sameOrigin &&
        (req.url().startsWith(checkout + "/") ||
          req.url() === base + "/store-api/checkout/session-access" ||
          req.headers().authorization?.startsWith("Bearer checkout-v1_"))
      )
        exposedGrants.push(req.url());
    });
    if (drop)
      await page.route(confirmationPath, async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        const response = await route.fetch();
        assert.equal(response.status(), 200, await response.text());
        remoteReceipt = await response.json();
        await route.abort("failed");
      });
    await page.goto(base + "/?shop=atelier&lang=en-GB");
    if (sameOrigin) {
      const denied = await page.request.post(
        base + "/store-api/checkout/independent/create",
        {
          headers: { "x-tenant": "atelier" },
          data: {},
        },
      );
      assert.equal(denied.status(), 401);
      const unknown = await page.request.post(
        base + "/store-api/checkout/independent/preferences",
        {
          headers: { "x-tenant": "atelier" },
          data: {},
        },
      );
      assert.ok([404, 405].includes(unknown.status()));
    }
    const buyer = { email: randomUUID() + "@example.test", sameOrigin };
    const prepared = await page.evaluate(async ({ email, sameOrigin }) => {
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
      if (sameOrigin) {
        const forged = await fetch("/store-api/checkout/independent/create", {
          method: "POST",
          headers: { ...headers, "x-veyndo-customer-csrf": "0".repeat(64) },
          body: "{}",
        });
        if (forged.status !== 401)
          throw Error(`Forged Checkout CSRF returned ${forged.status}`);
      }
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
        cartToken: cart.token,
        service: cart.checkoutService,
      };
    }, buyer);
    assert.match(prepared.service?.legalPolicyVersion, /^[0-9a-f]{64}$/);
    assert.equal(
      prepared.service.transport,
      sameOrigin ? "same-origin" : "direct",
    );
    if (sameOrigin) {
      const foreign = { "x-tenant": foreignShop };
      const account = await page.request.post(
        base + "/store-api/account/register",
        {
          headers: foreign,
          data: {
            email: buyer.email,
            name: "Foreign Fixture Buyer",
            password: "Synthetic-Checkout-browser-fixture!",
          },
        },
      );
      assert.ok(account.ok(), await account.text());
      const denied = await page.request.post(confirmationPath, {
        headers: {
          ...foreign,
          "x-customer-token": (await account.json()).customerToken,
          "sw-context-token": prepared.cartToken,
        },
        data: { id: prepared.cartId, confirmed: true },
      });
      assert.equal(denied.status(), 503);
    }
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
    if (paypal) await page.getByRole("radio", { name: /PayPal/ }).check();
    const review = page.getByRole("button", {
      name: /Review order|Bestellung prüfen/,
    });
    await review.click({ timeout: 8000 });
    const terms = page.getByRole("checkbox", {
      name: /I accept the terms|Ich akzeptiere die Verkaufsbedingungen/,
    });
    if (await terms.isVisible()) await terms.check();
    const confirmation =
      paypal && !drop
        ? page.waitForResponse(
            (response) =>
              response.url() === confirmationPath &&
              response.request().method() === "POST",
          )
        : undefined;
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
    if (paypal) {
      const result = drop ? remoteReceipt : await (await confirmation).json();
      const attempt = result.paymentAttemptId;
      assert.ok(attempt);
      assert.equal(result.orderNumber, orderNumber);
      const confirmed = page.getByRole("heading", {
        name: "Payment confirmed",
        exact: true,
      });
      assert.equal(await confirmed.count(), 0);
      await page
        .frameLocator(".embedded-payment iframe")
        .getByRole("button", { name: "Approve test payment" })
        .click();
      await confirmed.waitFor({ timeout: 15000 });
      const headers = {
        "x-tenant": "atelier",
        Authorization: `Bearer ${merchant}`,
      };
      const amount = Number(result.totalMinor);
      const refund = await page.request.post(
        base + "/api/payments/" + attempt + "/refund",
        {
          headers: {
            ...headers,
            "Idempotency-Key": attempt + ":browser-refund",
          },
          data: { approve: true, amountMinor: amount },
        },
      );
      assert.ok(refund.ok(), await refund.text());
      const deadline = Date.now() + 10000;
      for (;;) {
        const response = await page.request.get(base + "/api/payments", {
          headers,
        });
        assert.ok(response.ok());
        const payment = (await response.json()).attempts.find(
          (row) => row.id === attempt,
        );
        if (payment?.state === "refunded") {
          assert.equal(payment.refundedMinor, amount);
          break;
        }
        assert.ok(
          Date.now() < deadline,
          "Original payment attempt must settle its refund",
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }
    await page.reload();
    assert.equal(await receipt.innerText(), orderNumber);
    await page
      .getByRole("button", {
        name: /Back to (the )?(shop|store)|Zurück zum Shop/i,
      })
      .click();
    assert.equal(nativeWrites.length, 0);
    assert.equal(independentWrites.length, 1);
    assert.deepEqual(exposedGrants, []);
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
      `PASS native browser ${drop ? "lost confirmation recovery at mobile size" : "purchase at desktop size"}: one service confirmation, one stock decrement, same receipt after reload, empty bag${paypal ? ", provider-frame approval and full refund on the original attempt" : ""}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
