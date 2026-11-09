/** Composed work surfaces display the real native directory, preserve route bindings and pin only presentation. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AgentWorkSurface from "../../src/admin/workspace/AgentWorkSurface";
import { StudioContext } from "../../src/admin/shell/StudioContext";
import { LocaleScope } from "../../src/shared/i18n/i18n";

function fixture(withKnowledge = false) {
  const permissions = [
    "orders.read",
    "customers.pii",
    ...(withKnowledge ? ["knowledge.read"] : []),
  ];
  let saved: any = {
    revision: 2,
    data: {
      areas: [{ id: "service", name: "Service", cards: ["orders"], pins: [] }],
      active: "service",
      goals: [],
    },
  };
  const request = vi.fn(async (path: string, body?: any) => {
    if (path === "/api/auth/access") return { permissions };
    if (path === "/api/knowledge/preview" && withKnowledge)
      return {
        sources: [
          {
            sourceId: "shipping",
            locale: "en-GB",
            title: "Delivery policy",
            text: "Offer a new estimated date after checking tracking.",
          },
        ],
      };
    if (path.startsWith("/api/merchant/orders?"))
      return {
        elements: [
          {
            id: "order-id",
            orderNumber: "ORDER-100",
            createdAt: "2026-10-29T10:00:00Z",
            state: "open",
            currency: "EUR",
            cart: { price: { totalPrice: 59 } },
            payment: { state: "paid" },
          },
        ],
        nextCursor: null,
      };
    if (path === "/api/merchant/order-state-machine")
      return {
        mainLocale: "en-GB",
        effectiveStates: [{ id: "open", label: { "en-GB": "Open" } }],
      };
    if (path === "/api/studio/workspace") {
      if (body) saved = body;
      return saved;
    }
    throw new Error(`Unexpected native fixture request: ${path}`);
  });
  const context = {
    request,
    liveRequest: request,
    access: permissions,
    openEntity: vi.fn(),
    tabLabel: () => "Orders",
    token: "",
    workspace: "synthetic-shop",
    environment: "",
    locale: "en-GB",
  };
  return { context, request, saved: () => saved };
}

it("renders server rows, opens their native editor and saves a reusable component layout", async () => {
  const f = fixture(),
    close = vi.fn();
  render(
    <LocaleScope locale="en-GB">
      <StudioContext.Provider value={f.context as any}>
        <AgentWorkSurface
          candidate={{
            entity: "orders",
            criteria: { state: "open" },
            components: ["records"],
          }}
          onClose={close}
        />
      </StudioContext.Provider>
    </LocaleScope>,
  );
  await screen.findByRole("button", { name: /ORDER-100/ });
  expect(f.request).toHaveBeenCalledWith(
    expect.stringMatching(/\/api\/merchant\/orders\?.*state=open/),
  );
  fireEvent.click(screen.getByRole("button", { name: "Pin this view" }));
  await screen.findByText("Pinned to your workspace");
  expect(f.saved().revision).toBe(2);
  expect(f.saved().data.areas[0].pins).toEqual([
    {
      title: "Orders",
      tab: "orders",
      query: '{"state":"open"}',
      components: ["records"],
    },
  ]);
  fireEvent.click(screen.getByRole("button", { name: /ORDER-100/ }));
  expect(f.context.openEntity).toHaveBeenCalledWith("orders", "order-id");
  expect(close).toHaveBeenCalledOnce();
});

it("removes current rows immediately when rights are revoked and never mounts unknown model components", async () => {
  const f = fixture();
  const view = (
    access: string[],
    candidate: any = {
      entity: "orders",
      criteria: {},
      components: ["records"],
    },
  ) => (
    <LocaleScope locale="en-GB">
      <StudioContext.Provider value={{ ...f.context, access } as any}>
        <AgentWorkSurface candidate={candidate} onClose={() => {}} />
      </StudioContext.Provider>
    </LocaleScope>
  );
  const rendered = render(view(f.context.access));
  await screen.findByRole("button", { name: /ORDER-100/ });
  rendered.rerender(view([]));
  expect(screen.queryByRole("button", { name: /ORDER-100/ })).toBeNull();
  expect(screen.getByRole("alert")).toBeVisible();
  f.request.mockClear();
  rendered.rerender(
    view(f.context.access, {
      entity: "orders",
      criteria: {},
      components: ["records", "script"],
    }),
  );
  await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
  expect(
    f.request.mock.calls.some(([path]) =>
      path.startsWith("/api/merchant/orders?"),
    ),
  ).toBe(false);
});

it("shows a current shipping passage alongside real order rows and drops only that panel on revocation", async () => {
  const f = fixture(true);
  const candidate = {
    entity: "orders" as const,
    criteria: {},
    components: ["records", "shippingPolicy"] as const,
  };
  const view = (access: string[]) => (
    <LocaleScope locale="en-GB">
      <StudioContext.Provider value={{ ...f.context, access } as any}>
        <AgentWorkSurface
          candidate={{ ...candidate, components: [...candidate.components] }}
          onClose={() => {}}
        />
      </StudioContext.Provider>
    </LocaleScope>
  );
  const page = render(view(f.context.access));
  await screen.findByText(
    "Offer a new estimated date after checking tracking.",
  );
  await screen.findByRole("button", { name: /ORDER-100/ });
  expect(f.request).toHaveBeenCalledWith("/api/knowledge/preview", {
    audience: "merchant",
    query: "shipping delivery delays",
    includeExternal: false,
  });
  page.rerender(view(["orders.read", "customers.pii"]));
  expect(screen.queryByText("Delivery policy")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /ORDER-100/ })).toBeInTheDocument();
});

it("keeps native orders available on a policy failure and retries just the policy", async () => {
  const f = fixture(true);
  const original = f.request.getMockImplementation()!;
  f.request.mockImplementation((path, body) =>
    path === "/api/knowledge/preview"
      ? Promise.reject(new Error("Synthetic service outage"))
      : original(path, body),
  );
  render(
    <LocaleScope locale="en-GB">
      <StudioContext.Provider value={f.context as any}>
        <AgentWorkSurface
          candidate={{
            entity: "orders",
            criteria: {},
            components: ["records", "shippingPolicy"],
          }}
          onClose={() => {}}
        />
      </StudioContext.Provider>
    </LocaleScope>,
  );
  await screen.findByRole("alert");
  await screen.findByRole("button", { name: /ORDER-100/ });
  const orderReads = () =>
    f.request.mock.calls.filter(([path]) =>
      path.startsWith("/api/merchant/orders?"),
    ).length;
  const initial = orderReads();
  f.request.mockImplementation(original);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Delivery policy");
  expect(orderReads()).toBe(initial);
});
