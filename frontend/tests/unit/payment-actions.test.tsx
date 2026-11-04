/** Real shared merchant controls preserve exact amounts, selected capture identity and pending-job fences. */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PaymentActions from "../../src/admin/payments/PaymentActions";
import {
  paymentMinor,
  type Settlement,
} from "../../src/admin/payments/payment-amount";
vi.mock("../../src/shared/i18n/i18n", () => ({
  useLocale: () => ({ locale: "en-GB" }),
}));
afterEach(cleanup);
const settlement: Settlement = {
  capturedMinor: 400,
  refundedMinor: 0,
  remainingAuthorizationMinor: 600,
  captureClosed: false,
  canCaptureMore: true,
  multipleCapture: true,
  captures: [
    { id: "C1", amountMinor: 100, refundedMinor: 0 },
    { id: "C2", amountMinor: 300, refundedMinor: 0 },
  ],
};
const setup = (extra = {}) => {
  const onPayment = vi.fn().mockResolvedValue(true);
  render(
    <PaymentActions
      state="partially_captured"
      settlement={settlement}
      currency="EUR"
      scale={2}
      busy={false}
      pending={false}
      onPayment={onPayment}
      onCheck={vi.fn()}
      {...extra}
    />,
  );
  return onPayment;
};
it("never rounds financial inputs or admits unsafe minor units", () => {
  expect(paymentMinor("1.23", 2)).toBe(123);
  expect(paymentMinor("1,23", 2)).toBe(123);
  expect(paymentMinor("123", 0)).toBe(123);
  expect(paymentMinor("1.234", 3)).toBe(1234);
  for (const value of ["1.001", "1e3", "-1", "NaN", "0", "9007199254740992"])
    expect(paymentMinor(value, 2)).toBeUndefined();
  expect(paymentMinor("1.0", 0)).toBeUndefined();
});
it("submits an exact partial capture with the selected final-capture choice", async () => {
  const onPayment = setup();
  fireEvent.change(screen.getAllByLabelText(/Amount/)[0], {
    target: { value: "1,25" },
  });
  fireEvent.click(
    screen.getByLabelText("Close authorization after this capture"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Capture amount" }));
  await waitFor(() =>
    expect(onPayment).toHaveBeenCalledWith("capture", 125, {
      finalCapture: true,
    }),
  );
});
it("refunds the selected owned capture and refuses excess precision and amount", async () => {
  const onPayment = setup();
  fireEvent.change(screen.getByLabelText("Capture to refund"), {
    target: { value: "C2" },
  });
  fireEvent.change(screen.getByLabelText("Refund amount · EUR"), {
    target: { value: "3.01" },
  });
  expect(
    (screen.getByRole("button", { name: "Refund amount" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Refund amount · EUR"), {
    target: { value: "3.00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Refund amount" }));
  await waitFor(() =>
    expect(onPayment).toHaveBeenCalledWith("refund", 300, { captureId: "C2" }),
  );
});
it("shows balances to read-only members while all financial actions remain disabled", () => {
  setup({ readOnly: true });
  expect(screen.getByText("Captured")).toBeTruthy();
  for (const button of screen.getAllByRole("button"))
    expect((button as HTMLButtonElement).disabled).toBe(true);
});
it("keeps legacy single-capture controls free of multi-capture fields", async () => {
  const onPayment = setup({
    settlement: {
      ...settlement,
      multipleCapture: false,
      captures: [],
      capturedMinor: 0,
    },
    state: "authorized",
  });
  fireEvent.click(screen.getByRole("button", { name: "Capture payment" }));
  expect(onPayment).toHaveBeenCalledWith("capture");
  expect(
    screen.queryByLabelText("Close authorization after this capture"),
  ).toBeNull();
});

it("does not display an uncompleted or expired invoice as authorized funds", () => {
  setup({
    state: "expired",
    settlement: {
      ...settlement,
      capturedMinor: 0,
      canCaptureMore: false,
      captures: [],
    },
  });
  expect(
    screen.getByText("Still authorized").nextElementSibling,
  ).toHaveTextContent("€0.00");
  expect(screen.queryByRole("button", { name: "Capture amount" })).toBeNull();
});
