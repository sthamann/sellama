/** Exact decimal merchant input; reject overprecision instead of rounding financial commands. */
export function paymentMinor(value: string, scale: number): number | undefined {
  if (!Number.isInteger(scale) || scale < 0 || scale > 4 || value.length > 30)
    return;
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return;
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > scale) return;
  const minor =
    BigInt(whole) * 10n ** BigInt(scale) +
    BigInt(fraction.padEnd(scale, "0") || "0");
  if (minor <= 0n || minor > BigInt(Number.MAX_SAFE_INTEGER)) return;
  return Number(minor);
}
export type Capture = {
  id: string;
  amountMinor: number;
  refundedMinor: number;
};
export type Settlement = {
  capturedMinor: number;
  refundedMinor: number;
  remainingAuthorizationMinor: number;
  captureClosed: boolean;
  multipleCapture: boolean;
  canCaptureMore: boolean;
  captures: Capture[];
};
export type PaymentOptions = { captureId?: string; finalCapture?: boolean };
