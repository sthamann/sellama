/** Saved-method progress is independent of the authoritative financial outcome. */
import { useCheckoutText } from "../../shared/i18n/checkout-i18n";
export default function SavedPaymentNotice({
  status,
}: {
  status?: string | null;
}) {
  const { x } = useCheckoutText();
  const key =
    status === "pending"
      ? "savedPaymentPending"
      : status === "saved"
        ? "savedPaymentComplete"
        : status === "failed"
          ? "savedPaymentFailed"
          : null;
  return key ? <p role="status">{x(key)}</p> : null;
}
