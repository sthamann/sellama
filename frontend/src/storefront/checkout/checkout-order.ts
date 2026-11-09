/** Bind the purchase to the reviewed cart and total; the server remains the pricing authority. */
import { shopApi, type Cart, type Order } from "../../shared/api/shop-api";
import { responseError } from "../../shared/i18n/errors-i18n";
import { customerSessionHeaders } from "../../shared/api/customer-session";
import {
  browserCredential,
  browserRequest,
} from "../../shared/api/browser-session";
import { confirmIndependentCheckout } from "./independent-checkout";

async function completedOrder(cart: Cart): Promise<Order | undefined> {
  const recovered = await shopApi<Cart>(
    "/store-api/checkout/cart",
    undefined,
    cart.token,
  );
  return recovered.id === cart.id && recovered.status === "completed"
    ? recovered.order
    : undefined;
}

export async function placeCheckoutOrder(
  cart: Cart,
  locale: string,
  tenant: string,
  channel: string,
): Promise<Order> {
  try {
    const sandbox = new URLSearchParams(location.search).get("sandbox") === "1";
    if (
      !sandbox &&
      cart.checkoutService &&
      customerSessionHeaders(tenant)["x-customer-token"]
    ) {
      const receipt = await confirmIndependentCheckout(cart, channel);
      const order = await completedOrder(cart);
      if (order?.id === receipt.orderId) return order;
      throw responseError("Checkout confirmation could not be verified", 503);
    }
    const path = "/store-api/checkout/order";
    const response = await fetch(
      path,
      browserRequest(path, {
        method: "POST",
        headers: {
          "sw-context-token": cart.token,
          "Idempotency-Key": `browser-${cart.id}`,
          "x-commerce-locale": locale,
          "x-tenant": tenant,
          ...customerSessionHeaders(tenant),
          "sw-sales-channel-id": channel,
          "x-commerce-currency": cart.price.currency ?? "EUR",
          "x-commerce-cart-revision": String(cart.revision),
          "x-commerce-total-minor": String(
            Math.round(
              cart.price.totalPrice * 10 ** (cart.price.currencyScale ?? 2),
            ),
          ),
          ...(sandbox
            ? {
                Authorization: `Bearer ${browserCredential()}`,
              }
            : {}),
        },
      }),
    );
    const data = await response.json();
    if (!response.ok)
      throw responseError(
        data.errors?.[0]?.detail ?? "Order failed",
        response.status,
      );
    return data;
  } catch (failure) {
    // Read the committed snapshot once; never repeat the financial command.
    try {
      const recovered = await completedOrder(cart);
      if (recovered) return recovered;
    } catch {
      // A failed status read must not replace the original checkout error.
    }
    throw failure;
  }
}
