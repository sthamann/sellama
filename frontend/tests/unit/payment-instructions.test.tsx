/** Invoice recipient data never implies paid status and is fetched only through the owned checkout capability. */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
import PaymentInstructions from "../../src/storefront/checkout/PaymentInstructions";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../src/shared/api/shop-api", () => ({ shopApi: request }));
afterEach(() => {
  cleanup();
  request.mockReset();
});
function show() {
  localStorage.setItem("rac-locale", "en-GB");
  return render(
    <LocaleProvider>
      <PaymentInstructions id="invoice" token="owned-token" />
    </LocaleProvider>,
  );
}
it("shows simulated recipient instructions without claiming money was received", async () => {
  request.mockResolvedValue({
    status: "available",
    simulated: true,
    instructions: {
      kind: "bank_transfer",
      accountHolderName: "Example recipient",
      iban: "DE89370400440532013000",
      bic: "DEUTDEFFXXX",
      bankName: "Example bank",
      paymentReference: "RF-123",
    },
  });
  show();
  await screen.findByText("Example recipient");
  expect(
    screen.getByText("Simulated bank details. Do not transfer money."),
  ).toBeTruthy();
  expect(
    screen.getByText(/These details do not confirm receipt of money/),
  ).toBeTruthy();
  expect(screen.queryByText("Payment confirmed")).toBeNull();
  expect(request).toHaveBeenCalledWith(
    "/store-api/payments/invoice/instructions",
    undefined,
    "owned-token",
  );
  expect(screen.getByText("DE89370400440532013000")).toBeTruthy();
});
it("retains an explicit retry after a failed read without sending a financial command", async () => {
  request
    .mockRejectedValueOnce(new Error("internal provider response"))
    .mockResolvedValueOnce({ status: "pending", instructions: null });
  show();
  await screen.findByRole("alert");
  expect(screen.queryByText("internal provider response")).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Check invoice details" }),
  );
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(request.mock.calls.every((c) => c[1] === undefined)).toBe(true);
});
