/** Saved payment consent is an explicit customer choice alongside the selected native method. */
import type { Cart, Selection } from "../../shared/api/shop-api";
import { useCheckoutText } from "../../shared/i18n/checkout-i18n";
import { useSavedPaymentMethods } from "./useSavedPaymentMethods";
import "../styles/saved-payments.css";
export default function SavedPaymentChoice({
  cart,
  selection,
  onChange,
  disabled,
}: {
  cart: Cart;
  selection: Selection;
  onChange: (p: Partial<Selection>) => void;
  disabled: boolean;
}) {
  const { x } = useCheckoutText();
  const saved = useSavedPaymentMethods(cart.customerId);
  if (
    !cart.customerId ||
    (!saved.failed && !saved.supported.includes(selection.paymentMethodId))
  )
    return null;
  const methods = saved.methods.filter(
    (m) =>
      `${m.provider.replaceAll("_", "-")}-${m.method.replaceAll("_", "-")}` ===
      selection.paymentMethodId,
  );
  return (
    <fieldset
      className="saved-payment-choice"
      disabled={disabled || saved.loading}
    >
      <legend>{x("savedPayments")}</legend>
      {saved.failed && (
        <p role="alert">
          {x("savedPaymentError")}{" "}
          <button type="button" onClick={saved.reload}>
            {x("savedPaymentRetry")}
          </button>
        </p>
      )}
      {methods.length > 0 && (
        <label>
          {x("chooseSavedPayment")}
          <select
            value={selection.paymentFunding?.id ?? ""}
            onChange={(e) =>
              onChange({
                paymentFunding: e.target.value
                  ? { id: e.target.value, save: false }
                  : null,
              })
            }
          >
            <option value="">{x("newPayment")}</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.metadata.brand ?? x("savedPayment")}
                {m.metadata.last4 ? ` · ${m.metadata.last4}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {!saved.failed && !selection.paymentFunding?.id && (
        <label className="saved-payment-consent">
          <input
            type="checkbox"
            checked={selection.paymentFunding?.save === true}
            onChange={(e) =>
              onChange({
                paymentFunding: e.target.checked ? { save: true } : null,
              })
            }
          />
          <span>
            {x("savePaymentConsent")}
            <small>{x("savePaymentHint")}</small>
          </span>
        </label>
      )}
    </fieldset>
  );
}
