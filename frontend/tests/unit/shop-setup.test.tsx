/** Merchant setup follows native owners, persists only personal progress and rejects stale/failed writes. */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StudioContext } from "../../src/admin/shell/StudioContext";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import {
  SetupProvider,
  useShopSetup,
} from "../../src/admin/setup/SetupProvider";
import SetupWizard from "../../src/admin/setup/SetupWizard";
import SetupBanner from "../../src/admin/setup/SetupBanner";
import {
  newProgress,
  reviewStep,
  steps,
} from "../../src/admin/setup/setup-model";
import { canOpenStudio } from "../../src/admin/shell/permissions";
const rights = [
  "settings.read",
  "settings.write",
  "catalog.read",
  "catalog.write",
  "channels.read",
  "channels.manage",
  "environments.read",
  "apps.read",
  "team.manage",
];
afterEach(cleanup);
function fixture(setup?: object) {
  let record = {
    revision: setup ? 3 : 0,
    data: {
      areas: [{ id: "owner", name: "My work", cards: ["orders"], pins: [] }],
      active: "owner",
      goals: [],
      ...(setup ? { setup } : {}),
    },
  };
  let failSave = false;
  let company = {
    data: {
      name: "Atelier",
      email: "demo@example.test",
      address: "Synthetic test address",
    },
    revision: 1,
  };
  const request = vi.fn(async (path: string, body?: any, method?: string) => {
    if (path === "/api/studio/workspace") {
      if (method === "PUT") {
        if (failSave) throw new Error("conflict");
        if (body.revision !== record.revision) throw new Error("conflict");
        record = {
          revision: record.revision + 1,
          data: structuredClone(body.data),
        };
      }
      return structuredClone(record);
    }
    if (path === "/api/settings/master-data") {
      if (method === "PUT")
        company = {
          data: structuredClone(body.data),
          revision: company.revision + 1,
        };
      return structuredClone(company);
    }
    if (path === "/store-api/countries")
      return {
        countries: [],
        mainLocale: "en-GB",
        locales: ["en-GB"],
        enabled: [],
      };
    if (path === "/api/merchant/commerce")
      return {
        data: {
          countries: ["DE"],
          shipping: [{ active: true }],
          payments: [{ active: true, mode: "simulated" }],
        },
      };
    if (path.startsWith("/api/merchant/products")) return { elements: [] };
    throw new Error("unexpected request " + path);
  });
  return {
    request,
    record: () => record,
    failSave: () => {
      failSave = true;
    },
  };
}
function Content() {
  const guide = useShopSetup();
  return (
    <>
      <SetupBanner />
      <SetupWizard />
      <output data-testid="auto">{String(guide.autoOpen)}</output>
    </>
  );
}
function view(
  f: ReturnType<typeof fixture>,
  options: {
    access?: string[];
    environment?: string;
    workspace?: string;
    locale?: string;
  } = {},
) {
  const selectTab = vi.fn(),
    intent = vi.fn();
  const studio = {
    liveRequest: f.request,
    request: f.request,
    workspace: options.workspace ?? "shop-a",
    workspaceName: "Atelier",
    environment: options.environment ?? "",
    connected: true,
    auth: { identity: { user: { id: "person-a" } } },
    access: options.access ?? rights,
    data: { summary: { orders: 0 } },
    tab: "setup",
    selectTab,
    intent,
  };
  const component = (value = studio) => (
    <LocaleScope locale={options.locale ?? "en-GB"}>
      <StudioContext.Provider value={value as any}>
        <SetupProvider>
          <Content />
        </SetupProvider>
      </StudioContext.Provider>
    </LocaleScope>
  );
  return { ...render(component()), studio, component, selectTab, intent };
}
it("welcomes a new shop, starts setup and preserves unrelated workspace data", async () => {
  const f = fixture();
  view(f);
  expect(
    await screen.findByRole("heading", { name: "Your shop starts here." }),
  ).toBeVisible();
  expect(screen.getByTestId("auto")).toHaveTextContent("true");
  fireEvent.click(screen.getByRole("button", { name: "Let’s set it up" }));
  expect(
    await screen.findByRole("heading", { name: "Make it your business" }),
  ).toBeVisible();
  expect(f.record().data.areas[0].name).toBe("My work");
  expect((f.record().data as any).setup.state).toBe("active");
  expect(screen.getByTestId("auto")).toHaveTextContent("false");
  expect(screen.getByText("No products yet")).toBeVisible();
});
it("opens actual settings and the merchant-context agent, without applying or publishing", async () => {
  const f = fixture(newProgress());
  const v = view(f);
  fireEvent.click(
    await screen.findByRole("button", { name: /Company details/ }),
  );
  await waitFor(() => expect(v.selectTab).toHaveBeenCalledWith("commerce"));
  expect(new URLSearchParams(location.search).get("settings")).toBe(
    "masterData",
  );
  // Agent entry is hidden if compound assistant rights are absent.
  expect(
    screen.queryByRole("button", { name: "Prepare with AI" }),
  ).not.toBeInTheDocument();
  expect(
    f.request.mock.calls.every(
      ([path]) => !path.includes("/apply") && !path.includes("release"),
    ),
  ).toBe(true);
});
it("saves pause, survives a remount and advances only after explicit review", async () => {
  const f = fixture(newProgress());
  const v = view(f);
  fireEvent.click(
    await screen.findByRole("button", { name: "Continue later" }),
  );
  await waitFor(() =>
    expect((f.record().data as any).setup.state).toBe("dismissed"),
  );
  v.unmount();
  view(f);
  expect(
    await screen.findByRole("heading", { name: "Make it your business" }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "I’ve reviewed this, continue" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Bring your first products" }),
  ).toBeVisible();
  expect((f.record().data as any).setup.reviewed).toEqual(["basics"]);
});
it("does not silently complete an area when its product or payment data exists", async () => {
  const f = fixture(newProgress());
  view(f);
  await screen.findByRole("heading", { name: "Make it your business" });
  expect(screen.getByText("0 of 6 areas reviewed")).toBeVisible();
  expect((f.record().data as any).setup.reviewed).toEqual([]);
});
it("keeps the current step and shows a recoverable failure when saving fails", async () => {
  const f = fixture(newProgress());
  view(f);
  f.failSave();
  fireEvent.click(
    await screen.findByRole("button", { name: "I’ve reviewed this, continue" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Progress wasn’t saved",
  );
  expect(
    screen.getByRole("heading", { name: "Make it your business" }),
  ).toBeVisible();
  expect((f.record().data as any).setup.reviewed).toEqual([]);
});
it("does not replace another open tab's newly reviewed progress", async () => {
  const f = fixture(newProgress());
  const a = view(f),
    first = within(a.container);
  await first.findByRole("heading", { name: "Make it your business" });
  const b = view(f),
    second = within(b.container);
  await second.findByRole("heading", { name: "Make it your business" });
  fireEvent.click(
    second.getByRole("button", { name: "I’ve reviewed this, continue" }),
  );
  await second.findByRole("heading", { name: "Bring your first products" });
  fireEvent.click(
    first.getByRole("button", {
      name: /Give customers clear information/,
    }),
  );
  expect(await first.findByRole("alert")).toHaveTextContent(
    "Progress wasn’t saved",
  );
  expect((f.record().data as any).setup.reviewed).toEqual(["basics"]);
  expect((f.record().data as any).setup.step).toBe("products");
  fireEvent.click(
    within(first.getByRole("alert")).getByRole("button", { name: "Reload" }),
  );
  await first.findByRole("heading", { name: "Bring your first products" });
});
it("merges unrelated fresh layout edits without replacing them", async () => {
  const f = fixture(newProgress());
  view(f);
  await screen.findByRole("heading", { name: "Make it your business" });
  f.record().data.areas[0].name = "Changed in another tab";
  f.record().revision++;
  fireEvent.click(
    screen.getByRole("button", { name: "I’ve reviewed this, continue" }),
  );
  await screen.findByRole("heading", { name: "Bring your first products" });
  expect(f.record().data.areas[0].name).toBe("Changed in another tab");
});
it("offers one product AI action with merchant setup context", async () => {
  const f = fixture({ ...newProgress(), step: "products" });
  const v = view(f, {
    access: [...rights, "assistant.use", "knowledge.read", "orders.read"],
  });
  const ai = await screen.findByRole("button", {
    name: "Prepare products with AI",
  });
  expect(
    screen.queryByRole("button", { name: "Prepare with AI" }),
  ).not.toBeInTheDocument();
  fireEvent.click(ai);
  await waitFor(() => expect(v.intent).toHaveBeenCalledOnce());
  expect(v.intent.mock.calls[0][0]).toContain("Bring your first products");
  expect(v.intent.mock.calls[0][0]).toContain("merchant");
});
it("keeps setup progress out of sandboxes and unavailable roles", async () => {
  const f = fixture();
  const v = view(f, { environment: "private-a" });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Return to Live shop",
  );
  expect(
    f.request.mock.calls.some(([path]) => path === "/api/studio/workspace"),
  ).toBe(false);
  v.unmount();
  const g = fixture();
  view(g, { access: ["catalog.read"] });
  expect(canOpenStudio("setup", ["settings.write"])).toBe(false);
  expect(canOpenStudio("setup", rights)).toBe(true);
  expect(
    g.request.mock.calls.some(([path]) => path === "/api/studio/workspace"),
  ).toBe(false);
});
it("shows the German completion and supports starting a new review", async () => {
  let progress = newProgress();
  for (const step of steps) progress = reviewStep({ ...progress, step });
  expect(progress.state).toBe("complete");
  const f = fixture(progress);
  view(f, { locale: "de-DE" });
  expect(
    await screen.findByRole("heading", {
      name: "Dein Shop hat jetzt eine Richtung.",
    }),
  ).toBeVisible();
  expect(screen.queryByText(/produktionsbereit/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Noch einmal prüfen" }));
  expect(
    await screen.findByRole("heading", { name: "Dein Unternehmen, dein Shop" }),
  ).toBeVisible();
  expect((f.record().data as any).setup.reviewed).toEqual([]);
});
it("does not show the former shop's setup while the next shop is still loading", async () => {
  const f = fixture({ ...newProgress(), step: "legal" });
  const v = view(f);
  await screen.findByRole("heading", {
    name: "Give customers clear information",
  });
  let resolve!: (v: any) => void;
  const pending = vi.fn(
    () =>
      new Promise<any>((r) => {
        resolve = r;
      }),
  );
  v.rerender(
    v.component({
      ...v.studio,
      workspace: "shop-b",
      liveRequest: pending,
      request: pending,
    } as any),
  );
  expect(
    screen.queryByRole("heading", { name: "Give customers clear information" }),
  ).not.toBeInTheDocument();
  await act(async () =>
    resolve({ revision: 0, data: { areas: [], active: "", goals: [] } }),
  );
  expect(
    await screen.findByRole("heading", { name: "Your shop starts here." }),
  ).toBeVisible();
});

it("saves the focused company form through the native settings owner before continuing", async () => {
  const f = fixture(newProgress());
  view(f);
  const name = await screen.findByRole("textbox", {
    name: "Name",
  });
  fireEvent.change(name, { target: { value: "New company" } });
  expect(
    screen.getByRole("button", { name: "I’ve reviewed this, continue" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "I’ve reviewed this, continue" }),
    ).toBeEnabled(),
  );
  expect(
    f.request.mock.calls.find(
      ([path, , method]) =>
        path === "/api/settings/master-data" && method === "PUT",
    )?.[1].data.name,
  ).toBe("New company");
  expect(f.record().revision).toBe(3);
});
