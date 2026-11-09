/** Review and confirm an app-linked variant using the current native cart. */
import { useRef, useState } from "react";
import { shopApi, type Detail } from "../../shared/api/shop-api";
import { productURL } from "../catalog/product-url";
import { useStorefront } from "./StorefrontContext";
import { conversationPurchaseText as text } from "./conversation-purchase-i18n";
import "../styles/conversation-purchase.css";

export default function ConversationPurchase({
  productId,
}: {
  productId: string;
}) {
  const { cart, actions, locale, s, openBag } = useStorefront();
  const [detail, setDetail] = useState<Detail>();
  const [variant, setVariant] = useState("");
  const [reviewed, setReviewed] =
    useState<Awaited<ReturnType<typeof actions.previewProduct>>>();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const perform = async (fn: () => Promise<void>, failure: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      await fn();
    } catch {
      setError(failure);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  const available =
    detail?.variants.filter((item) => item.stock >= item.min_purchase) ?? [];
  const selected =
    available.find((item) => item.id === variant) ?? available[0];
  const quote = reviewed?.quote;
  const current =
    cart?.id === reviewed?.cartId && cart?.revision === quote?.revision;
  const line = quote?.lineItems.find((item) => item.id === selected?.id);
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: quote?.price.currency ?? cart?.price.currency ?? "EUR",
    }).format(value);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(value));
  return (
    <section className="conversation-purchase" aria-busy={pending}>
      {!detail ? (
        <button
          type="button"
          className="shop-secondary"
          disabled={pending || cart?.status !== "open"}
          onClick={() =>
            void perform(async () => {
              const data = await shopApi<Detail>(
                `/store-api/product/${encodeURIComponent(productId)}`,
                undefined,
                cart?.token,
              );
              setDetail(data);
              setVariant(data.product.id);
            }, text("loadError"))
          }
        >
          {pending ? s("loading") : text("open")}
        </button>
      ) : (
        <>
          <strong>{detail.product.name}</strong>
          {!selected && <p>{s("sold")}</p>}
          {selected && !added && (
            <>
              {(available.length > 1 ||
                Object.keys(selected.options).length > 0) && (
                <label className="conversation-purchase-option">
                  {text("variant")}
                  <select
                    value={selected.id}
                    disabled={pending}
                    onChange={(event) => {
                      setVariant(event.target.value);
                      setReviewed(undefined);
                      setError("");
                    }}
                  >
                    {available.map((item) => (
                      <option key={item.id} value={item.id}>
                        {Object.entries(item.options)
                          .map(([group, value]) => `${s(group)}: ${s(value)}`)
                          .join(" · ") || item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {quote && line && current ? (
                <>
                  <dl className="conversation-purchase-totals">
                    <dt>{text("quantity")}</dt>
                    <dd>{selected.min_purchase}</dd>
                    <dt>{text("item")}</dt>
                    <dd>{money(line.price.unitPrice)}</dd>
                    {quote.delivery && (
                      <>
                        <dt>{text("shipping")}</dt>
                        <dd>
                          {quote.shippingMethod} ·{" "}
                          {money(quote.shippingCosts.totalPrice)}
                        </dd>
                        <dt>{text("delivery")}</dt>
                        <dd>
                          {date(quote.delivery.earliest)}
                          {quote.delivery.latest !== quote.delivery.earliest &&
                            ` – ${date(quote.delivery.latest)}`}{" "}
                          · {quote.country}
                        </dd>
                      </>
                    )}
                    <dt>{text("total")}</dt>
                    <dd>
                      <strong>{money(quote.price.totalPrice)}</strong>
                    </dd>
                  </dl>
                  <button
                    type="button"
                    className="shop-primary"
                    disabled={pending}
                    onClick={() =>
                      void perform(async () => {
                        setReviewed(undefined);
                        await actions.confirmProduct(reviewed);
                        setAdded(true);
                      }, text("writeError"))
                    }
                  >
                    {pending ? s("loading") : text("confirm")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="shop-secondary"
                  disabled={pending || cart?.status !== "open"}
                  onClick={() =>
                    void perform(async () => {
                      setReviewed(
                        await actions.previewProduct(
                          selected.id,
                          selected.min_purchase,
                        ),
                      );
                    }, text("quoteError"))
                  }
                >
                  {pending ? s("loading") : text("review")}
                </button>
              )}
            </>
          )}
          {added && <p role="status">{text("added")}</p>}
          {(added ||
            error === text("writeError") ||
            error === text("quoteError")) && (
            <>
              <button
                type="button"
                className="shop-secondary"
                disabled={pending}
                onClick={() =>
                  void perform(async () => {
                    await actions.refreshCart();
                    await openBag();
                  }, text("writeError"))
                }
              >
                {text("cart")}
              </button>
            </>
          )}
          <a className="shop-secondary" href={productURL(detail.product)}>
            {s("details")}
          </a>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
