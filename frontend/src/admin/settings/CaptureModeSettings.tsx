/** Capture timing uses the installed provider declaration and the existing versioned settings draft. */
import { useEffect, useState } from "react";
import type { Payment } from "../../shared/api/shop-api";
import type { RequestFn } from "../shell/studio-types";
import { usePaymentLedgerText } from "../../shared/i18n/payment-ledger-i18n";
export default function CaptureModeSettings({
  payment,
  request,
  onChange,
}: {
  payment: Payment;
  request: RequestFn;
  onChange: (value: Pick<Payment, "captureMode">) => void;
}) {
  const text = usePaymentLedgerText();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setCapabilities([]);
    request("/api/payment-providers")
      .then((result) => {
        const provider = result.providers?.find(
          (p: any) => p.id === payment.provider,
        );
        const method = provider?.contract?.methods?.find(
          (m: any) => m.id === payment.providerMethod,
        );
        if (active) setCapabilities(method?.capabilities ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [payment.provider, payment.providerMethod, request]);
  if (!capabilities.includes("authorize") && !payment.captureMode) return null;
  return (
    <label>
      {text("timing")}
      <select
        value={payment.captureMode ?? ""}
        onChange={(e) =>
          onChange({
            captureMode: (e.target.value ||
              undefined) as Payment["captureMode"],
          })
        }
      >
        <option value="">{text("inherit")}</option>
        <option value="capture">{text("immediate")}</option>
        <option value="authorize">{text("deferred")}</option>
      </select>
    </label>
  );
}
