/** The dock is presentation only; current scope, native rights and model admission remain authoritative. */
import {
  act,
  renderHook,
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useCopilotDock } from "../../src/admin/assistant/useCopilotDock";
import { admitNavigation } from "../../src/admin/assistant/copilot-navigation";
import CopilotNavigation from "../../src/admin/assistant/CopilotNavigation";
import { StudioContext } from "../../src/admin/shell/StudioContext";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import GeneratedWorkspace from "../../src/admin/workspace/GeneratedWorkspace";
import { composeNativeWorkspace } from "../../src/admin/workspace/workspace-presentation";
it("retains open state across views, hides immediately across tenant/account boundaries and revocation", () => {
  const { result, rerender } = renderHook(
    ({ scope, allowed }) => useCopilotDock(scope, allowed),
    { initialProps: { scope: "shop-a:user-1", allowed: true } },
  );
  act(() => result.current.show());
  expect(result.current.open).toBe(true);
  rerender({ scope: "shop-a:user-1", allowed: true });
  expect(result.current.open).toBe(true);
  rerender({ scope: "shop-b:user-1", allowed: true });
  expect(result.current.open).toBe(false);
  act(() => result.current.show());
  rerender({ scope: "shop-b:user-1", allowed: false });
  expect(result.current.open).toBe(false);
  rerender({ scope: "shop-b:user-2", allowed: true });
  expect(result.current.open).toBe(false);
});
it("accepts only permission-matched native views and bounded entity references", () => {
  expect(
    admitNavigation({ view: "productData", id: "lamp" }, ["catalog.read"]),
  ).toEqual({ view: "productData", id: "lamp" });
  for (const value of [
    { view: "https://example.com" },
    { view: "commerce", id: "evil" },
    { view: "orders", id: "1" },
    { view: "productData", tenant: "foreign" },
    { view: "productData", id: "" },
  ])
    expect(
      admitNavigation(value, ["catalog.read", "settings.read", "orders.read"]),
    ).toBeNull();
});
it("requires a click and uses the shared native entity route", () => {
  const openEntity = vi.fn(),
    selectTab = vi.fn();
  render(
    <LocaleScope locale="en-GB">
      <StudioContext.Provider
        value={
          {
            access: ["catalog.read"],
            tabLabel: () => "Products",
            openEntity,
            selectTab,
          } as any
        }
      >
        <CopilotNavigation value={{ view: "productData", id: "lamp" }} />
      </StudioContext.Provider>
    </LocaleScope>,
  );
  expect(openEntity).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Open Products/ }));
  expect(openEntity).toHaveBeenCalledWith("productData", "lamp");
  expect(selectTab).not.toHaveBeenCalled();
});
it("renders real host bindings through A2UI and refuses forged data, script and rights", () => {
  const candidate = {
    entity: "products",
    criteria: { active: true },
    components: ["intake", "records", "details"],
  };
  expect(
    composeNativeWorkspace(candidate, ["catalog.read", "catalog.write"]),
  ).toEqual({ protocol: "a2ui-1.0", controls: ["Intake", "Directory"] });
  expect(composeNativeWorkspace(candidate, ["catalog.read"])).toEqual({
    protocol: "a2ui-1.0",
    controls: ["Directory"],
  });
  expect(
    composeNativeWorkspace({ ...candidate, rows: [{ price: 1 }] }, [
      "catalog.read",
    ]),
  ).toBeNull();
  expect(
    composeNativeWorkspace(
      { ...candidate, components: ["records", "script"] },
      ["catalog.read"],
    ),
  ).toBeNull();
  expect(
    composeNativeWorkspace(
      { entity: "orders", criteria: {}, components: ["records"] },
      ["orders.read"],
    ),
  ).toBeNull();
  const workspace = (rights: string[]) => (
    <GeneratedWorkspace
      candidate={candidate}
      rights={rights}
      directory={<button>Native product editor</button>}
      intake={<button>Native CSV review</button>}
    />
  );
  const { rerender } = render(workspace(["catalog.read", "catalog.write"]));
  const editor = screen.getByRole("button", { name: "Native product editor" });
  expect(editor.closest("[data-layout-protocol]")).toHaveAttribute(
    "data-layout-protocol",
    "a2ui-1.0",
  );
  expect(
    screen.getByRole("button", { name: "Native CSV review" }),
  ).toBeInTheDocument();
  rerender(workspace(["catalog.read"]));
  expect(
    screen.queryByRole("button", { name: "Native CSV review" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Native product editor" })).toBe(
    editor,
  );
  rerender(workspace([]));
  expect(
    screen.queryByRole("button", { name: "Native product editor" }),
  ).toBeNull();
});

it("updates selected context with native navigation and keeps the originating app only within its account scope", async () => {
  const { useAgentWorkspaceContext } =
    await import("../../src/admin/shell/useAgentWorkspaceContext");
  const { result, rerender } = renderHook(
    ({ view, app, scope }) =>
      useAgentWorkspaceContext(scope, view as any, undefined, app),
    { initialProps: { view: "apps", app: "care", scope: "one" } },
  );
  expect(result.current.workspaceContext).toEqual({
    view: "apps",
    selected: { kind: "app", id: "care" },
  });
  act(() => result.current.remember());
  rerender({ view: "assistant", app: "", scope: "one" });
  expect(result.current.workspaceContext.selected?.id).toBe("care");
  rerender({ view: "assistant", app: "", scope: "two" });
  expect(result.current.workspaceContext.selected).toBeUndefined();
});

it("blocks an old proposal whose product navigation carries an order view", async () => {
  const { default: ProposalCard } =
    await import("../../src/admin/assistant/ProposalCard");
  const message = {
    id: 1,
    role: "assistant",
    content: "Product view",
    applied: false,
    data: {
      preview: {
        model: "fixture",
        inference: "fixture",
        catalogBefore: [],
        proposal: {
          summary: "Product view",
          changes: [],
          navigation: { view: "productData" as const, id: "bag" },
          view: {
            entity: "orders" as const,
            criteria: {},
            components: ["records" as const],
          },
        },
      },
    },
  };
  render(
    <LocaleScope locale="en-GB">
      <ProposalCard
        message={message}
        onApply={vi.fn()}
        busy={false}
        canApply
        onOpenView={vi.fn()}
        onOpenWorkspace={vi.fn()}
      />
    </LocaleScope>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This saved view targets a different area",
  );
  expect(
    screen.queryByRole("button", { name: "Open working view" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Open editable list" }),
  ).not.toBeInTheDocument();
});
