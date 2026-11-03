/** Customers can revoke their saved methods without affecting completed purchases or historical receipts. */
import { useSavedPaymentMethods } from "../checkout/useSavedPaymentMethods";
import { useCheckoutText } from "../../shared/i18n/checkout-i18n";
import "../styles/saved-payments.css";
export default function SavedPaymentMethods({
  customerId,
}: {
  customerId: string;
}) {
  const { x } = useCheckoutText(),
    saved = useSavedPaymentMethods(customerId);
  return (
    <section className="saved-payment-account">
      <h3>{x("savedPayments")}</h3>
      <p>{x("savedPaymentManageHint")}</p>
      {saved.failed && (
        <p role="alert">
          {x("savedPaymentError")}{" "}
          <button
            type="button"
            className="shop-secondary"
            onClick={saved.reload}
          >
            {x("savedPaymentRetry")}
          </button>
        </p>
      )}
      {!saved.loading && !saved.methods.length && <p>{x("noSavedPayments")}</p>}
      {saved.methods.map((m) => (
        <div className="saved-payment-row" key={m.id}>
          <span>
            <strong>
              {m.metadata.brand ??
                (m.method === "paypal" ? x("paypalBrand") : x("savedPayment"))}
            </strong>
            {m.metadata.last4 && (
              <small>
                {x("cardEnding")} {m.metadata.last4}
              </small>
            )}
          </span>
          <button
            type="button"
            className="shop-secondary"
            disabled={saved.busy}
            onClick={() => void saved.revoke(m.id)}
          >
            {x("revokeSavedPayment")}
          </button>
        </div>
      ))}
    </section>
  );
}
