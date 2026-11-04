/** Real provider returns append token/payer fields after the fragment; only an owned attempt may be selected. */
import { expect, it } from "vitest";
import { paymentReturnAttempt } from "../../src/storefront/checkout/payment-return";
it("retains native and provider-appended return attempt references", () => {
  expect(paymentReturnAttempt("#payment/attempt-a")).toBe("attempt-a");
  expect(
    paymentReturnAttempt(
      "#payment/16ffae79d489489ea1233db267e95826&token=PROVIDER&PayerID=PAYER",
    ),
  ).toBe("16ffae79d489489ea1233db267e95826");
});
it("rejects ambiguous, unbounded and injected attempt paths", () => {
  for (const hash of [
    "#payment/",
    "#payment/a/b",
    "#payment/a?paid=true",
    "#payment/a#other",
    "#payment/" + "a".repeat(129),
    "#other/attempt-a",
  ])
    expect(paymentReturnAttempt(hash)).toBeUndefined();
});
