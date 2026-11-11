/** Host theme negotiation keeps opaque App text and canvas readable without widening its bridge. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { act, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ConversationAppViews from "../../src/shared/apps/ConversationAppViews";
import { LocaleProvider } from "../../src/shared/i18n/i18n";

// Use the test environment's existing DOM implementation; no runtime dependency.
const { JSDOM } = createRequire(resolve(process.cwd(), "package.json"))(
  "jsdom",
) as {
  JSDOM: new (
    html: string,
    options: { url: string; runScripts: string },
  ) => {
    window: Window & typeof globalThis;
  };
};

it("advertises the actual host theme and forwards changes without another tool call", async () => {
  const uri = "ui://veyndo/shop/guide/view/digest";
  const definition = {
    label: { en: "Guide" },
    view: {},
    toolName: "app.guide.list",
    localeChain: ["en"],
  };
  const request = vi.fn(async () => ({
    result: {
      contents: [
        {
          uri,
          mimeType: "text/html;profile=mcp-app",
          _meta: { "ai.veyndo/definition": definition },
        },
      ],
    },
  }));
  vi.spyOn(window, "getComputedStyle").mockImplementation(
    (element) =>
      ({
        colorScheme:
          element.closest("[data-theme]")?.getAttribute("data-theme") ??
          "light",
      }) as CSSStyleDeclaration,
  );
  render(
    <div data-theme="light" data-testid="host">
      <ConversationAppViews
        request={request}
        views={[
          {
            resourceUri: uri,
            arguments: {},
            result: { structuredContent: { elements: [] } },
          },
        ]}
      />
    </div>,
    { wrapper: LocaleProvider },
  );
  const frame = (await screen.findByTitle("Guide")) as HTMLIFrameElement;
  const source = frame.contentWindow!;
  const post = vi.spyOn(source, "postMessage");
  const send = (data: object) =>
    window.dispatchEvent(
      new MessageEvent("message", {
        source,
        origin: "null",
        data: { jsonrpc: "2.0", ...data },
      }),
    );
  act(() =>
    send({
      id: "init",
      method: "ui/initialize",
      params: { protocolVersion: "2026-01-26" },
    }),
  );
  expect(
    post.mock.calls.find(([message]) => message.id === "init")?.[0].result
      .hostContext.theme,
  ).toBe("light");
  act(() => send({ method: "ui/notifications/initialized" }));
  await act(async () =>
    screen.getByTestId("host").setAttribute("data-theme", "dark"),
  );
  await waitFor(() =>
    expect(
      post.mock.calls.some(
        ([message]) =>
          message.method === "ui/notifications/host-context-changed" &&
          message.params.theme === "dark",
      ),
    ).toBe(true),
  );
  expect(request).toHaveBeenCalledTimes(1);
});

it("pairs foreground and background and accepts theme updates only from its initialized parent", () => {
  const document = readFileSync(
    resolve(process.cwd(), "../src/apps/mcp_view.html"),
    "utf8",
  );
  expect(document).toContain("color:CanvasText;background:Canvas");
  const guest = new JSDOM(
    document.replace(
      "__APP_VIEW_DEFINITION__",
      JSON.stringify({ label: "Guide", view: { blocks: [] } }),
    ),
    { url: "https://guest.example/", runScripts: "outside-only" },
  );
  const host = { postMessage: vi.fn() };
  Object.defineProperty(guest.window, "parent", { value: host });
  guest.window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  const script =
    guest.window.document.querySelector("script:not([type])")!.textContent!;
  guest.window.eval(script);
  const send = (data: object, origin = "https://host.example") =>
    guest.window.dispatchEvent(
      new guest.window.MessageEvent("message", {
        source: host as unknown as Window,
        origin,
        data: { jsonrpc: "2.0", ...data },
      }),
    );
  send({
    id: "veyndo-init",
    result: { protocolVersion: "2026-01-26", hostContext: { theme: "dark" } },
  });
  expect(guest.window.document.documentElement.style.colorScheme).toBe("dark");
  send(
    {
      method: "ui/notifications/host-context-changed",
      params: { theme: "light" },
    },
    "https://foreign.example",
  );
  expect(guest.window.document.documentElement.style.colorScheme).toBe("dark");
  send({
    method: "ui/notifications/host-context-changed",
    params: { theme: "light" },
  });
  expect(guest.window.document.documentElement.style.colorScheme).toBe("light");
  send({
    method: "ui/notifications/host-context-changed",
    params: { theme: "arbitrary-css" },
  });
  expect(guest.window.document.documentElement.style.colorScheme).toBe("light");
  guest.window.close();
});
