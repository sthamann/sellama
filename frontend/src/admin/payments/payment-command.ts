/** Shared frozen merchant payment request identity; retries preserve the original exact payload. */
import type { PaymentOptions } from "./payment-amount";
export type PaymentRetry = {
  signature: string;
  key: string;
  body: Record<string, unknown>;
};
export function paymentCommand(
  previous: PaymentRetry | undefined,
  id: string,
  operation: string,
  amount?: number,
  options?: PaymentOptions,
): PaymentRetry {
  const signature = JSON.stringify({ id, operation, amount, options });
  if (previous?.signature === signature) return previous;
  return {
    signature,
    key: crypto.randomUUID(),
    body: {
      approve: true,
      ...options,
      ...(amount === undefined ? {} : { amountMinor: amount }),
    },
  };
}
