/** Shared native order/provider controls; an accepted job is observed before another financial action. */
import { useId, useState } from "react";
import { useLocale } from "../../shared/i18n/i18n";
import { useOperationsText } from "../../shared/i18n/operations-i18n";
import { usePaymentProviderText } from "../../shared/i18n/payment-provider-i18n";
import { usePaymentLedgerText } from "../../shared/i18n/payment-ledger-i18n";
import {
  paymentMinor,
  type Settlement,
  type PaymentOptions,
} from "./payment-amount";
import "./payment-actions.css";
export default function PaymentActions({
  state,
  settlement,
  currency,
  scale,
  busy,
  pending,
  onPayment,
  onCheck,
  readOnly = false,
}: {
  state: string;
  settlement?: Settlement;
  currency: string;
  scale: number;
  busy: boolean;
  pending: boolean;
  onPayment: (
    operation: string,
    amount?: number,
    options?: PaymentOptions,
  ) => Promise<boolean>;
  onCheck: () => void;
  readOnly?: boolean;
}) {
  const { locale } = useLocale();
  const hintId = useId();
  const text = usePaymentLedgerText(),
    provider = usePaymentProviderText(),
    { o } = useOperationsText();
  const [capture, setCapture] = useState(""),
    [refund, setRefund] = useState("");
  const [captureId, setCaptureId] = useState(""),
    [finalCapture, setFinalCapture] = useState(false);
  const captures = settlement?.captures ?? [];
  const selected = captures.find((c) => c.id === captureId) ?? captures[0];
  const refundable = selected
    ? selected.amountMinor - selected.refundedMinor
    : 0;
  const captureMinor = paymentMinor(capture, scale),
    refundMinor = paymentMinor(refund, scale);
  const money = (minor: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(
      minor / 10 ** scale,
    );
  const disabled = readOnly || busy || pending;
  const canCapture = settlement?.canCaptureMore ?? state === "authorized";
  return (
    <div className="payment-actions">
      {settlement && (
        <dl className="payment-balances">
          <div>
            <dt>{text("captured")}</dt>
            <dd>{money(settlement.capturedMinor)}</dd>
          </div>
          <div>
            <dt>{text("refunded")}</dt>
            <dd>{money(settlement.refundedMinor)}</dd>
          </div>
          <div>
            <dt>{text("remaining")}</dt>
            <dd>{money(settlement.remainingAuthorizationMinor)}</dd>
          </div>
        </dl>
      )}
      <div className="payment-action-tools">
        <button
          className="studio-secondary"
          disabled={disabled}
          onClick={() => void onPayment("reconcile")}
        >
          {o("reconcile")}
        </button>
        {canCapture && (
          <button
            className="studio-secondary"
            disabled={disabled}
            onClick={() => void onPayment("void")}
          >
            {provider("void")}
          </button>
        )}
        {pending && (
          <button className="studio-primary" disabled={busy} onClick={onCheck}>
            {o("checkOperation")}
          </button>
        )}
      </div>
      {canCapture && !settlement?.multipleCapture && (
        <button
          className="studio-primary"
          disabled={disabled}
          onClick={() => void onPayment("capture")}
        >
          {provider("capture")}
        </button>
      )}
      {canCapture && settlement?.multipleCapture && (
        <form
          className="payment-amount-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              captureMinor &&
              (await onPayment("capture", captureMinor, { finalCapture }))
            )
              setCapture("");
          }}
        >
          <label>
            {text("amount")} · {currency}
            <input
              required
              inputMode="decimal"
              value={capture}
              placeholder={money(settlement?.remainingAuthorizationMinor ?? 0)}
              onChange={(e) => setCapture(e.target.value)}
              aria-describedby={hintId}
            />
          </label>
          <button
            className="studio-primary"
            disabled={
              disabled ||
              !captureMinor ||
              (!!settlement &&
                captureMinor > settlement.remainingAuthorizationMinor)
            }
          >
            {text("capture")}
          </button>
          <label className="payment-final">
            <input
              type="checkbox"
              checked={finalCapture}
              onChange={(e) => setFinalCapture(e.target.checked)}
            />
            {text("final")}
          </label>
          <small id={hintId}>
            {text(finalCapture ? "finalHint" : "amountHint")}
          </small>
        </form>
      )}
      {captures.length > 0 && !["cancelled", "expired"].includes(state) && (
        <form
          className="payment-amount-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              refundMinor &&
              selected &&
              (await onPayment("refund", refundMinor, {
                captureId: selected.id,
              }))
            )
              setRefund("");
          }}
        >
          {captures.length > 1 && (
            <label className="payment-capture-picker">
              {text("selectCapture")}
              <select
                disabled={disabled}
                value={selected?.id ?? ""}
                onChange={(e) => {
                  setCaptureId(e.target.value);
                  setRefund("");
                }}
              >
                {captures.map((c, index) => (
                  <option key={c.id} value={c.id}>
                    {index + 1} · {money(c.amountMinor - c.refundedMinor)} ·{" "}
                    {c.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {text("amount")} · {currency}
            <input
              required
              inputMode="decimal"
              value={refund}
              placeholder={money(refundable)}
              onChange={(e) => setRefund(e.target.value)}
            />
          </label>
          <button
            className="studio-secondary"
            disabled={disabled || !refundMinor || refundMinor > refundable}
          >
            {text("refund")}
          </button>
        </form>
      )}
    </div>
  );
}
