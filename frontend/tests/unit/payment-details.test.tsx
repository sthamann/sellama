/** Financial details remain lazy and read-only, including provider failures and independent refresh. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { paymentCommand } from "../../src/admin/payments/payment-command";
import PaymentDetails from "../../src/admin/payments/PaymentDetails";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
it("loads only when opened, renders exact provider fees and performs no command", async () => {
  localStorage.setItem("rac-locale", "en-GB");
  const request = vi.fn().mockResolvedValue({
    currency: "EUR",
    currencyScale: 2,
    providerObservation: {
      status: "available",
      transaction: {
        reference: "ORDER",
        authorizations: [],
        refunds: [],
        captures: [
          {
            id: "CAP",
            status: "COMPLETED",
            amountMinor: 1000,
            currency: "EUR",
            currencyScale: 2,
            fees: [
              {
                kind: "provider",
                amount: {
                  amountMinor: 29,
                  currency: "EUR",
                  currencyScale: 2,
                },
              },
            ],
            net: { amountMinor: 971, currency: "EUR", currencyScale: 2 },
          },
        ],
      },
    },
    history: [],
    jobs: [],
  });
  render(
    <LocaleProvider>
      <PaymentDetails id="attempt" request={request} />
    </LocaleProvider>,
  );
  expect(request).not.toHaveBeenCalled();
  // jsdom does not implement native summary activation.
  const element = screen
    .getByText("Transaction details & history")
    .closest("details")!;
  element.open = true;
  fireEvent(element, new Event("toggle"));
  await screen.findByText("Provider fee");
  expect(screen.getByText("€0.29")).toBeTruthy();
  expect(screen.getByText("€9.71")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Refresh details" }));
  await waitFor(() =>
    expect(request.mock.calls.length).toBeGreaterThanOrEqual(2),
  );
  expect(
    request.mock.calls.every(
      (call) =>
        call.length === 1 && call[0] === "/api/payments/attempt/details",
    ),
  ).toBe(true);
});
it("keeps unavailable provider details visible alongside native history", async () => {
  localStorage.setItem("rac-locale", "en-GB");
  const request = vi.fn().mockResolvedValue({
    providerObservation: { status: "unavailable" },
    history: [],
    jobs: [],
    currency: "EUR",
    currencyScale: 2,
  });
  render(
    <LocaleProvider>
      <PaymentDetails id="attempt2" request={request} />
    </LocaleProvider>,
  );
  const element = screen
    .getByText("Transaction details & history")
    .closest("details")!;
  element.open = true;
  fireEvent(element, new Event("toggle"));
  expect(
    await screen.findByText(
      "Provider details could not be loaded. Try refreshing.",
    ),
  ).toBeTruthy();
  expect(screen.getByText("No payment transitions recorded yet.")).toBeTruthy();
});

it("preserves exact command identity and payload across an uncertain retry", () => {
  const first = paymentCommand(undefined, "attempt", "capture", 123, {
    finalCapture: false,
  });
  expect(
    paymentCommand(first, "attempt", "capture", 123, { finalCapture: false }),
  ).toBe(first);
  expect(first.body).toEqual({
    approve: true,
    amountMinor: 123,
    finalCapture: false,
  });
  expect(
    paymentCommand(first, "attempt", "capture", 124, { finalCapture: false })
      .key,
  ).not.toBe(first.key);
  expect(
    paymentCommand(first, "other", "capture", 123, { finalCapture: false }).key,
  ).not.toBe(first.key);
});
