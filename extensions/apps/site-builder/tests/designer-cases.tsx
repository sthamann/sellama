/** Initial native storefront, automatic home selection and inherited-draft copy regressions. */
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  expect,
  it,
  vi,
} from "../../../../frontend/tests/unit/package-test-support";
import useDesigner from "../studio/useDesigner";
import ShopDesigner from "../studio/ShopDesigner";
import { newPage } from "../model";
const home = {
  ...newPage("default", "en-GB", "Current collection"),
  revision: 3,
  slug: "home",
};
const context = {
  channels: [{ id: "default", data: { name: { "en-GB": "Main" } } }],
  mainLocale: "en-GB",
  locales: ["en-GB"],
  installed: ["site_builder", "site_forms"],
  catalogue: { elements: [], hasMore: false, nextCursor: null },
};
function api(pages: (typeof home)[] = []) {
  return vi.fn(async (path: string) =>
    path.includes("/context")
      ? context
      : path.startsWith("/store-api/")
        ? { elements: [] }
        : { elements: pages },
  );
}
it("shows the actual native shop without forcing creation of a CMS page", async () => {
  const request = api();
  render(
    <ShopDesigner
      request={request}
      workspace="test"
      rights={["channels.read", "catalog.read"]}
      sandbox={false}
      onEnvironments={() => {}}
    />,
  );
  expect(
    (await screen.findAllByTestId("actual-storefront"))[0],
  ).toHaveTextContent("Native storefront");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(
    request.mock.calls.every(([path]) => !path.includes("save_page")),
  ).toBe(true);
});
it("opens an existing home automatically instead of an empty editor", async () => {
  render(
    <ShopDesigner
      request={api([home])}
      workspace="test"
      rights={["channels.read", "catalog.read"]}
      sandbox={false}
      onEnvironments={() => {}}
    />,
  );
  expect(
    (await screen.findAllByRole("heading", { name: "Current collection" }))[0],
  ).toBeVisible();
  expect(screen.getAllByTestId("actual-storefront")[0]).not.toHaveTextContent(
    "Native storefront",
  );
});
it("forks an inherited page only on edit, preserves global identity and performs native CAS save", async () => {
  const global = { ...home, channel: "*" };
  const request = api([global]);
  const view = renderHook(() => useDesigner(request, "test"));
  await waitFor(() => expect(view.result.current.loaded).toBe(true));
  act(() => view.result.current.open(global));
  expect(view.result.current.dirty).toBe(false);
  act(() => view.result.current.edit({ ...global, theme: { radius: 0 } }));
  expect(view.result.current.draft).toMatchObject({
    channel: "default",
    revision: 0,
    theme: { radius: 0 },
  });
  expect(view.result.current.draft!.id).not.toBe(global.id);
  expect(global.revision).toBe(3);
  expect(global.channel).toBe("*");
  expect(view.result.current.dirty).toBe(true);
});

it("prepares a valid native home with main-locale copy and catalogue media instead of an invalid copied image path", async () => {
  const { homeDraft } = await import("../studio/home-draft");
  const p = homeDraft(
    "default",
    "en-GB",
    "de-DE",
    [
      {
        id: "coat",
        name: "Coat",
        price: 249,
        media: [
          { id: "coat", url: "/media/demo/fashion/coat.webp", view: "front" },
        ],
      },
    ],
    {
      title: "Deutsche Kollektion",
      description: "Unser Text",
      image: "/media/demo/fashion/coat.webp",
      collection: "Kollektion",
    },
  );
  expect(p.content.blocks[0]).toMatchObject({
    image: "",
    products: ["coat"],
    productMode: "selected",
    text: {
      "de-DE": "Deutsche Kollektion",
      "en-GB": "Your style. Effortlessly yours.",
    },
  });
  expect(p.content.blocks[0].rich?.["de-DE"]).toEqual([
    { type: "paragraph", text: "Unser Text" },
  ]);
  expect(p.content.blocks[1].text).toMatchObject({
    "en-GB": "Collection",
    "de-DE": "Kollektion",
  });
  expect(p.revision).toBe(0);
  expect(p.status).toBe("published");
});

it("shows inherited rich content instead of rendering a locale code as prose", async () => {
  const { default: Inspector } = await import("../studio/PageInspector");
  const { ContentLanguage } =
    await import("../../../../frontend/src/shared/i18n/ContentLanguage");
  const page = newPage("default", "en-GB", "Home");
  page.content.blocks[0].rich = {
    "en-GB": [{ type: "paragraph", text: "Actual inherited copy" }],
  };
  const change = vi.fn();
  render(
    <ContentLanguage mainLocale="en-GB" locales={["en-GB", "de-DE"]}>
      <Inspector
        page={page}
        block={page.content.blocks[0]}
        products={[]}
        request={vi.fn()}
        disabled={false}
        onChange={change}
        onSelect={() => {}}
        onSearch={async () => {}}
      />
    </ContentLanguage>,
  );
  expect(
    screen.getByRole("textbox", { name: "Formatierter Text" }),
  ).toHaveTextContent("Actual inherited copy");
  expect(change).not.toHaveBeenCalled();
  expect(page.content.blocks[0].rich["de-DE"]).toBeUndefined();
});

it("retains independent unfinished pages and undo across page switches, then clears them on a confirmed channel change", async () => {
  const request = api([home]);
  const state = renderHook(() => useDesigner(request, "cache-pages"));
  await waitFor(() => expect(state.result.current.loaded).toBe(true));
  const about = { ...home, id: "about", slug: "about" };
  act(() => state.result.current.open(home));
  act(() => state.result.current.edit({ ...home, theme: { radius: 7 } }));
  act(() => state.result.current.open(about));
  act(() => state.result.current.edit({ ...about, theme: { radius: 12 } }));
  act(() => state.result.current.open(home));
  expect(state.result.current.draft?.theme.radius).toBe(7);
  expect(state.result.current.canUndo).toBe(true);
  act(() => state.result.current.undo());
  expect(state.result.current.dirty).toBe(false);
  expect(state.result.current.hasUnsaved).toBe(true);
  act(() => state.result.current.open(about));
  expect(state.result.current.draft?.theme.radius).toBe(12);
  act(() => state.result.current.changeChannel("other"));
  expect(
    state.result.current.workingPages.some((p) => p.theme.radius === 12),
  ).toBe(false);
});
