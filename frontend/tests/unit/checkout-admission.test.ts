/** Verify the browser repeats only refused Checkout requests and recovers uncertain orders. */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  acceptCustomerSession,
  forgetCustomerSession,
} from "../../src/shared/api/customer-session";
import { placeCheckoutOrder } from "../../src/storefront/checkout/checkout-order";
import { cart } from "./fixtures";

const tenant = "checkout-admission";
const reviewed = {
  ...cart,
  locale: "de-DE",
  price: { ...cart.price, totalMinor: "5990", currency: "EUR" },
  checkoutService: {
    transport: "same-origin" as const,
    legalPolicyVersion: "a".repeat(64),
  },
};
const draft = () => Response.json({ id: "draft", revision: 1 });
const receipt = () => Response.json({ orderId: "order" });
const order = () =>
  Response.json({ ...reviewed, status: "completed", order: { id: "order" } });
const refused = (admission = true, status = 429) =>
  Response.json(
    { errors: [{ status, detail: "Busy", retryable: true }] },
    {
      status,
      headers: {
        "retry-after": "1",
        ...(admission ? { "x-veyndo-checkout-admission": "refused" } : {}),
      },
    },
  );
const buy = () => placeCheckoutOrder(reviewed, "de-DE", tenant, "default");

beforeEach(() => {
  history.replaceState(null, "", `/checkout?shop=${tenant}`);
  acceptCustomerSession(tenant, { customerToken: "synthetic-buyer" });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  forgetCustomerSession(tenant);
  vi.unstubAllGlobals();
});

it("waits a second and reuses the exact same draft and confirmation", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(refused())
    .mockResolvedValueOnce(draft())
    .mockResolvedValueOnce(refused())
    .mockResolvedValueOnce(receipt())
    .mockResolvedValueOnce(order());
  vi.stubGlobal("fetch", fetch);

  const purchase = buy();
  await vi.advanceTimersByTimeAsync(999);
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(fetch).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(1000);
  await expect(purchase).resolves.toEqual({ id: "order" });
  expect(fetch.mock.calls[0]).toEqual(fetch.mock.calls[1]);
  expect(fetch.mock.calls[2]).toEqual(fetch.mock.calls[3]);
  expect(fetch.mock.calls[4][0]).toBe("/store-api/checkout/cart");
});

it.each(["ordinary 429", "unverified 503", "lost response"])(
  "recovers the original order without confirming again after %s",
  async (failure) => {
    const fetch = vi.fn().mockResolvedValueOnce(draft());
    if (failure === "lost response")
      fetch.mockRejectedValueOnce(new TypeError("Connection lost"));
    else
      fetch.mockResolvedValueOnce(
        failure === "ordinary 429" ? refused(false) : refused(true, 503),
      );
    fetch.mockResolvedValueOnce(order());
    vi.stubGlobal("fetch", fetch);

    await expect(buy()).resolves.toEqual({ id: "order" });
    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      "/store-api/checkout/independent/create",
      "/store-api/checkout/independent/confirm",
      "/store-api/checkout/cart",
    ]);
  },
);

it("stops after a repeated refusal", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(draft())
    .mockResolvedValueOnce(refused())
    .mockResolvedValueOnce(refused())
    .mockResolvedValueOnce(Response.json(reviewed));
  vi.stubGlobal("fetch", fetch);

  const rejected = expect(buy()).rejects.toMatchObject({ status: 429 });
  await vi.advanceTimersByTimeAsync(2000);
  await rejected;
  expect(fetch.mock.calls.map(([path]) => path)).toEqual([
    "/store-api/checkout/independent/create",
    "/store-api/checkout/independent/confirm",
    "/store-api/checkout/independent/confirm",
    "/store-api/checkout/cart",
  ]);
});

it.each([
  ["the buyer signs out", () => forgetCustomerSession(tenant)],
  ["the buyer leaves checkout", () => history.replaceState(null, "", "/")],
] as const)(
  "does not confirm again when %s during the wait",
  async (_, leave) => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(draft())
      .mockResolvedValueOnce(refused())
      .mockResolvedValueOnce(Response.json(reviewed));
    vi.stubGlobal("fetch", fetch);

    const rejected = expect(buy()).rejects.toMatchObject({ status: 429 });
    await vi.advanceTimersByTimeAsync(500);
    leave();
    await vi.advanceTimersByTimeAsync(500);
    await rejected;
    expect(fetch.mock.calls.map(([path]) => path)).toEqual([
      "/store-api/checkout/independent/create",
      "/store-api/checkout/independent/confirm",
      "/store-api/checkout/cart",
    ]);
  },
);
