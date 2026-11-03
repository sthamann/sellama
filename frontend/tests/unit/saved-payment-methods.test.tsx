/** Saved-method UI exercises consent, selection and native revocation without any provider or actual payment. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
import SavedPaymentChoice from "../../src/storefront/checkout/SavedPaymentChoice";
import SavedPaymentMethods from "../../src/storefront/account/SavedPaymentMethods";
import { cart } from "./fixtures";
const api = vi.hoisted(() => vi.fn());
vi.mock("../../src/shared/api/shop-api", () => ({ shopApi: api }));
const instrument = {
  id: "saved-local",
  provider: "shopware_payments",
  method: "card",
  environment: "contract-fixture",
  metadata: { brand: "Visa", last4: "4242" },
};
beforeEach(() => {
  api.mockReset();
  api.mockResolvedValue({
    supportedMethods: ["shopware-payments-card"],
    elements: [instrument],
  });
});
it("offers explicit consent and selects only the current method's saved instrument", async () => {
  const onChange = vi.fn();
  const selection = {
    ...cart.checkout,
    paymentMethodId: "shopware-payments-card",
  };
  render(
    <LocaleProvider>
      <SavedPaymentChoice
        cart={{ ...cart, customerId: "customer" }}
        selection={selection}
        onChange={onChange}
        disabled={false}
      />
    </LocaleProvider>,
  );
  const consent = await screen.findByRole("checkbox", {
    name: /Save this payment method/,
  });
  expect(consent).not.toBeChecked();
  fireEvent.click(consent);
  expect(onChange).toHaveBeenLastCalledWith({ paymentFunding: { save: true } });
  fireEvent.change(
    screen.getByRole("combobox", { name: "Payment method for this purchase" }),
    { target: { value: "saved-local" } },
  );
  expect(onChange).toHaveBeenLastCalledWith({
    paymentFunding: { id: "saved-local", save: false },
  });
});
it("revokes through the owning account and removes the usable method", async () => {
  render(
    <LocaleProvider>
      <SavedPaymentMethods customerId="customer" />
    </LocaleProvider>,
  );
  await screen.findByText("Visa");
  fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
  await waitFor(() =>
    expect(screen.queryByText("Visa")).not.toBeInTheDocument(),
  );
  expect(
    api.mock.calls.some(
      ([path, body]) => path.endsWith("/saved-local/revoke") && body.requestKey,
    ),
  ).toBe(true);
});
it("does not expose a previous account's saved methods when the customer changes", async () => {
  const view = render(
    <LocaleProvider>
      <SavedPaymentMethods customerId="one" />
    </LocaleProvider>,
  );
  await screen.findByText("Visa");
  api.mockResolvedValue({ elements: [], supportedMethods: [] });
  view.rerender(
    <LocaleProvider>
      <SavedPaymentMethods customerId="two" />
    </LocaleProvider>,
  );
  await screen.findByText("You have no saved payment methods.");
  expect(screen.queryByText("Visa")).not.toBeInTheDocument();
});
it("offers recovery when saved-method loading fails", async () => {
  api.mockRejectedValueOnce(new Error("synthetic unavailable response"));
  render(
    <LocaleProvider>
      <SavedPaymentChoice
        cart={{ ...cart, customerId: "customer" }}
        selection={{
          ...cart.checkout,
          paymentMethodId: "shopware-payments-card",
        }}
        onChange={vi.fn()}
        disabled={false}
      />
    </LocaleProvider>,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "could not be loaded",
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("checkbox", { name: /Save this payment method/ });
});
it("ignores a delayed response from the account that has just signed out", async () => {
  let resolve!: (value: unknown) => void;
  api.mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const view = render(
    <LocaleProvider>
      <SavedPaymentMethods customerId="one" />
    </LocaleProvider>,
  );
  api.mockResolvedValue({ elements: [], supportedMethods: [] });
  view.rerender(
    <LocaleProvider>
      <SavedPaymentMethods customerId="two" />
    </LocaleProvider>,
  );
  await screen.findByText("You have no saved payment methods.");
  resolve({
    elements: [instrument],
    supportedMethods: ["shopware-payments-card"],
  });
  await waitFor(() =>
    expect(screen.queryByText("Visa")).not.toBeInTheDocument(),
  );
});
