/** Provider readiness is presentation evidence only; recovery never creates another payment. */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import EmbeddedPayment from "../../src/storefront/checkout/EmbeddedPayment";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
const api = vi.hoisted(() => vi.fn());
vi.mock("../../src/shared/api/shop-api", () => ({ shopApi: api }));
const session = {
  uiUrl: "https://provider.example.test/checkout",
  sessionToken: "scoped-checkout-session-only",
  nonce: "first-presentation-nonce",
  expiresIn: 300,
  readySignal: true,
};
beforeEach(() => {
  vi.useFakeTimers();
  api.mockReset();
  api.mockResolvedValue(session);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
async function mount() {
  const changed = vi.fn();
  render(<EmbeddedPayment id="attempt" token="cart" onChanged={changed} />, {
    wrapper: LocaleProvider,
  });
  await act(async () => {
    await Promise.resolve();
  });
  return {
    changed,
    frame: screen.getByTitle("Secure payment") as HTMLIFrameElement,
  };
}
function message(
  frame: HTMLIFrameElement,
  type: string,
  origin = "https://provider.example.test",
  nonce = session.nonce,
) {
  fireEvent(
    window,
    new MessageEvent("message", {
      source: frame.contentWindow,
      origin,
      data: { type, nonce },
    }),
  );
}
it("waits for the exact provider's scoped ready signal without reconciling or accepting forged readiness", async () => {
  const { frame, changed } = await mount();
  fireEvent.load(frame);
  expect(frame.style.visibility).toBe("hidden");
  expect(frame.hidden).toBe(false); // Keep a real layout width for hosted card fields while loading.
  message(frame, "veyndo.payment.ready", "https://foreign.example.test");
  message(frame, "veyndo.payment.ready", undefined, "wrong-nonce");
  expect(screen.getByRole("status").textContent).toContain("Loading");
  message(frame, "veyndo.payment.ready");
  expect(frame.style.visibility).toBe("visible");
  expect(screen.queryByRole("status")).toBeNull();
  expect(changed).not.toHaveBeenCalled();
  await act(async () => {
    vi.advanceTimersByTime(21_000);
  });
  expect(screen.queryByRole("alert")).toBeNull();
});
it("replaces an unresponsive frame with a useful recovery action and requests only a new session", async () => {
  const { frame, changed } = await mount();
  await act(async () => {
    vi.advanceTimersByTime(20_000);
  });
  expect(screen.getByRole("alert").textContent).toContain(
    "Your order is saved",
  );
  expect(frame.hidden).toBe(true);
  api.mockResolvedValueOnce({ ...session, nonce: "new-presentation-nonce" });
  fireEvent.click(screen.getByRole("button", { name: "Reload payment form" }));
  await act(async () => {
    await Promise.resolve();
  });
  const next = screen.getByTitle("Secure payment") as HTMLIFrameElement;
  expect(screen.queryByRole("alert")).toBeNull();
  expect(api).toHaveBeenCalledTimes(2);
  expect(
    api.mock.calls.every(([path]) =>
      path.startsWith("/store-api/payments/attempt/session?"),
    ),
  ).toBe(true);
  message(next, "veyndo.payment.ready");
  expect(next.style.visibility).toBe("hidden");
  message(next, "veyndo.payment.ready", undefined, "new-presentation-nonce");
  expect(next.style.visibility).toBe("visible");
  expect(changed).not.toHaveBeenCalled();
});
it("retains legacy provider load behavior when no readiness signal is declared", async () => {
  api.mockResolvedValue({ ...session, readySignal: false });
  const { frame, changed } = await mount();
  fireEvent.load(frame);
  expect(frame.style.visibility).toBe("visible");
  await act(async () => {
    vi.advanceTimersByTime(21_000);
  });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(changed).not.toHaveBeenCalled();
});
it("offers recovery for failed and stalled session requests without a financial command", async () => {
  api.mockRejectedValueOnce(new Error("Provider unavailable"));
  render(<EmbeddedPayment id="attempt" token="cart" onChanged={vi.fn()} />, {
    wrapper: LocaleProvider,
  });
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByRole("alert").textContent).toContain(
    "Provider unavailable",
  );
  await act(async () => {
    vi.advanceTimersByTime(21_000);
  });
  expect(screen.getByRole("alert").textContent).toContain(
    "Provider unavailable",
  );
  api.mockImplementationOnce(() => new Promise(() => {}));
  fireEvent.click(screen.getByRole("button", { name: "Reload payment form" }));
  await act(async () => {
    vi.advanceTimersByTime(20_000);
  });
  expect(screen.getByRole("alert").textContent).toContain(
    "Your order is saved",
  );
});
