/** Connected canvas journeys retain one definition and explicitly review model changes. */
import { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  renderHook,
  act,
} from "@testing-library/react";
import { it, expect, vi } from "vitest";
import AppInspector from "../../src/admin/developer/AppInspector";
import AppCanvas from "../../src/admin/developer/AppCanvas";
import VisualCanvas from "../../src/shared/canvas/VisualCanvas";
import AppDesignWorkspace from "../../src/admin/developer/AppDesignWorkspace";
import { template } from "../../src/admin/developer/app-model";
import {
  useAppStudio,
  type AppStudio,
} from "../../src/admin/developer/useAppStudio";
import type { useAppPreview } from "../../src/admin/developer/useAppPreview";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import { ContentLanguage } from "../../src/shared/i18n/ContentLanguage";
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleScope locale="en-GB">
    <ContentLanguage mainLocale="en-GB" locales={["en-GB"]}>
      {children}
    </ContentLanguage>
  </LocaleScope>
);
it("bounds mounted scenes while zooming and paging without opening or changing them", () => {
  const open = vi.fn();
  render(
    <VisualCanvas
      scenes={Array.from({ length: 9 }, (_, i) => ({
        id: String(i),
        title: `Page ${i}`,
        preview: <p>{`Content ${i}`}</p>,
        onOpen: () => open(i),
      }))}
    />,
    { wrapper },
  );
  expect(screen.getAllByRole("article")).toHaveLength(4);
  expect(screen.queryByText("Content 4")).toBeNull();
  fireEvent.change(screen.getByRole("slider"), { target: { value: "150" } });
  fireEvent.click(screen.getByRole("button", { name: "Canvas zoom +" }));
  expect(screen.getByRole("status")).toHaveTextContent("150%");
  fireEvent.click(screen.getByRole("button", { name: "Next views" }));
  expect(screen.queryByText("Content 0")).toBeNull();
  expect(screen.getByText("Content 4")).toBeVisible();
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Open editor: Page 4" }));
  expect(open).toHaveBeenCalledWith(4);
});
it("opens the chosen scene from the unscaled toolbar and preserves disabled admission", () => {
  const open = vi.fn();
  render(
    <VisualCanvas
      scenes={[
        {
          id: "home",
          title: "Home",
          preview: <p>Home preview</p>,
          onOpen: () => open("home"),
        },
        {
          id: "product",
          title: "Product",
          actionLabel: "Edit product data",
          preview: <p>Product preview</p>,
          onOpen: () => open("product"),
        },
        {
          id: "locked",
          title: "Locked",
          disabled: true,
          preview: <p>Locked preview</p>,
          onOpen: () => open("locked"),
        },
      ]}
    />,
    { wrapper },
  );
  const picker = screen.getByRole("combobox", { name: "Choose a view" });
  const toolbar = picker.closest(".visual-canvas-toolbar") as HTMLElement;
  expect(toolbar.closest(".visual-canvas-board")).toBeNull();
  const edit = within(toolbar).getByRole("button", {
    name: "Edit",
  });
  fireEvent.change(picker, { target: { value: "product" } });
  expect(edit).toHaveTextContent("Edit product data");
  expect(
    screen.getByRole("button", { name: "Open editor: Product" }),
  ).toHaveTextContent("Edit product data");
  fireEvent.change(screen.getByRole("slider"), { target: { value: "35" } });
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(edit);
  expect(open).toHaveBeenCalledExactlyOnceWith("product");
  fireEvent.change(picker, { target: { value: "locked" } });
  expect(edit).toBeDisabled();
  fireEvent.click(edit);
  expect(open).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Open editor: Locked" }),
  ).toBeDisabled();
});
it("opens a placement, duplicates a selected block and returns with the same edited definition", async () => {
  const changed = vi.fn(),
    request = vi.fn(async () => ({
      permissions: ["developer.manage"],
      membership: { permissions: ["developer.manage"] },
    }));
  function Work() {
    const [m, set] = useState(template()),
      [selected, select] = useState("");
    const view = m.views![0];
    const studio = {
      manifest: m,
      env: "private",
      mainLocale: "en-GB",
      edit: (next: typeof m) => {
        changed(next);
        set(next);
      },
    } as AppStudio;
    return (
      <AppDesignWorkspace
        studio={studio}
        immediate={{ active: false } as ReturnType<typeof useAppPreview>}
        view={view}
        selected={selected}
        onSelect={select}
        onView={() => {}}
        preview={false}
        request={request}
        onLanguages={() => {}}
        onEditFields={() => {}}
      />
    );
  }
  render(<Work />, { wrapper });
  fireEvent.click(screen.getByRole("button", { name: /Open editor:/ }));
  const first = document.querySelector(".app-canvas article")!;
  fireEvent.click(first.querySelector("button")!);
  fireEvent.click(
    within(first as HTMLElement).getByRole("button", {
      name: "Duplicate element",
    }),
  );
  const blocks = changed.mock.calls.at(-1)![0].views[0].blocks;
  expect(blocks).toHaveLength(template().views![0].blocks.length + 1);
  expect(new Set(blocks.map((b: { id: string }) => b.id)).size).toBe(
    blocks.length,
  );
  fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  fireEvent.click(screen.getByRole("button", { name: /Open editor:/ }));
  expect(document.querySelectorAll(".app-canvas article")).toHaveLength(
    blocks.length,
  );
  await waitFor(() => expect(request).toHaveBeenCalled());
});
it("discards a late generation reply after changing the private environment", async () => {
  let finish!: (value: unknown) => void;
  const request = vi.fn(async (path: string) =>
    path === "/api/developer/generate"
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : {
          builds: [],
          providers: { providers: [] },
          locales: ["en-GB"],
          mainLocale: "en-GB",
        },
  );
  const hook = renderHook(() =>
    useAppStudio(request, "private-a", async () => {}),
  );
  await waitFor(() => expect(hook.result.current.locales).toEqual(["en-GB"]));
  let pending!: Promise<void>;
  act(() => {
    pending = hook.result.current.generate(
      "Make this clearer",
      "ollama",
      "fixture",
    );
  });
  act(() => hook.result.current.setEnv("private-b"));
  await act(async () => {
    finish({ environment: "private-a", manifest: template() });
    await pending;
  });
  expect(hook.result.current.proposal).toBeNull();
  expect(hook.result.current.env).toBe("private-b");
});
it("compares a proposal on the shared canvas without adopting it and removes comparison when its base is stale", () => {
  const m = template(),
    candidate = structuredClone(m),
    edit = vi.fn();
  candidate.views![0].blocks[0].title = { "en-GB": "Visual proposal" };
  const studio = {
    manifest: m,
    env: "private",
    mainLocale: "en-GB",
    edit,
    proposal: {
      base: JSON.stringify(m),
      build: { manifest: candidate, environment: "private" },
    },
  } as unknown as AppStudio;
  const request = vi.fn(async () => ({ permissions: [] }));
  function Work({ model }: { model: AppStudio }) {
    const [comparison, set] = useState(false);
    return (
      <AppDesignWorkspace
        studio={model}
        immediate={{ active: false } as ReturnType<typeof useAppPreview>}
        view={model.manifest.views![0]}
        selected=""
        onSelect={() => {}}
        onView={() => {}}
        preview={false}
        request={request}
        onLanguages={() => {}}
        onEditFields={() => {}}
        comparison={comparison}
        onComparison={set}
      />
    );
  }
  const page = render(<Work model={studio} />, { wrapper });
  expect(screen.queryByRole("heading", { name: "Visual proposal" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Preview proposal" }));
  expect(
    screen.getByRole("heading", { name: "Visual proposal" }),
  ).toBeVisible();
  expect(edit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Current draft" }));
  expect(screen.queryByRole("heading", { name: "Visual proposal" })).toBeNull();
  page.rerender(
    <Work model={{ ...studio, manifest: { ...m, version: "9.0.0" } }} />,
  );
  expect(screen.queryByRole("button", { name: "Preview proposal" })).toBeNull();
  expect(edit).not.toHaveBeenCalled();
});

it("uses the visible insertion target when a drop lands on canvas chrome instead of the article", () => {
  const m = template(),
    change = vi.fn();
  const page = render(
    <AppCanvas
      manifest={m}
      view={m.views![0]}
      selected=""
      onSelect={() => {}}
      onChange={change}
      mainLocale="en-GB"
      preview={false}
      previewRequest={vi.fn()}
    />,
    { wrapper },
  );
  const transfer = {
    types: ["application/vnd.veyndo.kind"],
    getData: (name: string) =>
      name === "application/vnd.veyndo.kind" ? "button" : "",
  };
  fireEvent.dragOver(page.container.querySelector(".app-canvas article")!, {
    clientY: 0,
    dataTransfer: transfer,
  });
  expect(screen.getByText(/Drop here/)).toBeVisible();
  fireEvent.drop(page.container.querySelector(".app-canvas")!, {
    dataTransfer: transfer,
  });
  expect(change.mock.calls[0][0].views[0].blocks[0].kind).toBe("button");
  expect(screen.queryByText(/Drop here/)).toBeNull();
});

it("edits the selected element before app metadata and writes to its existing definition", () => {
  const m = template(),
    view = m.views![0],
    change = vi.fn();
  view.blocks = [
    {
      id: "intro",
      kind: "text",
      title: { "en-GB": "Introduction" },
      text: { "en-GB": "Original copy" },
    },
  ];
  render(
    <AppInspector
      manifest={m}
      view={view}
      selected="intro"
      onChange={change}
    />,
    { wrapper },
  );
  const title = screen.getAllByRole("textbox", { name: "Title" })[0];
  const metadata = document.querySelector(".app-inspector > details")!;
  expect(
    title.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  fireEvent.change(title, { target: { value: "New introduction" } });
  expect(change.mock.calls[0][0].views[0].blocks[0].title).toMatchObject({
    "en-GB": "New introduction",
  });
  expect(change.mock.calls[0][0].id).toBe(m.id);
});
