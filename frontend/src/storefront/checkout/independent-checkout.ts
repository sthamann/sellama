/** Route an admitted, reviewed browser purchase through the independent Checkout service. */
import { shopApi, type Cart } from "../../shared/api/shop-api";
import { responseError } from "../../shared/i18n/errors-i18n";

export async function confirmIndependentCheckout(cart: Cart, channel: string) {
  const { totalMinor, currency } = cart.price;
  const legalPolicyVersion = cart.checkoutService?.legalPolicyVersion;
  if (!totalMinor || !currency || !cart.locale || !legalPolicyVersion)
    throw responseError("Checkout changed; review your order again", 409);
  const { access_token, checkout_origin } = await shopApi<{
    access_token: string;
    checkout_origin?: string;
  }>("/store-api/checkout/session-access", {});
  if (!checkout_origin)
    throw responseError("Checkout identity is not enabled", 503);

  async function post<T>(path: string, body: unknown, confirm = false) {
    try {
      const response = await fetch(new URL(path, checkout_origin), {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          ...(confirm
            ? {
                "sw-context-token": cart.token,
                "x-customer-token": access_token,
              }
            : {}),
        },
        body: JSON.stringify(body),
      });
      if (response.status === 409)
        throw responseError("Checkout changed; review your order again", 409);
      if (!response.ok && (!confirm || response.status < 500))
        throw responseError("Order failed", response.status);
      if (!response.ok) throw new Error("Checkout transport failed");
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && "status" in error) throw error;
      throw responseError(
        confirm
          ? "Checkout confirmation could not be verified"
          : "Order failed",
        503,
      );
    }
  }

  const { id, revision } = await post<{ id: string; revision: number }>(
    "/v1/sessions",
    {
      requestKey: `browser-${cart.id}-${cart.revision}`,
      expiresIn: 3600,
      context: {
        cart: { backend: "native", id: cart.id, revision: cart.revision },
        salesChannel: channel,
        environment: "live",
        locale: cart.locale,
        currency,
        country: cart.checkout.country,
      },
    },
  );
  return post<{ orderId: string }>(
    "/v1/sessions/confirm",
    {
      id,
      revision,
      confirmed: true,
      totalMinor,
      country: cart.checkout.country,
      paymentMethod: cart.checkout.paymentMethodId,
      legalPolicyVersion,
    },
    true,
  );
}
