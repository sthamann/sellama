/** Caption acceptance: locale inheritance, reviewed proposals, stale responses and actual consumer rendering. */
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import MediaCaptionEditor from "../../src/shared/media/MediaCaptionEditor";
import { ContentLanguage } from "../../src/shared/i18n/ContentLanguage";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import type { LocalizedText } from "../../src/shared/i18n/content-language";
import type { RequestFn } from "../../src/shared/api/types";
import ProductGallery from "../../src/storefront/catalog/ProductGallery";
import SiteRenderer from "../../../extensions/apps/site-builder/Renderer";
import { newPage } from "../../../extensions/apps/site-builder/model";
import { renderRichNode } from "../../src/shared/content/rich-document";
import NativeControl from "../../src/shared/apps/native/NativeControl";
function scope(children: React.ReactNode, language = "de-DE") {
  return (
    <LocaleScope locale="en-GB">
      <ContentLanguage
        mainLocale="en-GB"
        locales={["en-GB", "de-DE", "sv-SE"]}
        language={language}
      >
        {children}
      </ContentLanguage>
    </LocaleScope>
  );
}
it("keeps inherited content untouched until a selected-language proposal is reviewed and adopted", async () => {
  const request = vi.fn(async () => ({
    locale: "de-DE",
    caption: "Ein Stuhl im Licht.",
    basis: "image",
  }));
  let result: LocalizedText = {};
  function Editor() {
    const [value, set] = useState<LocalizedText>({
      "en-GB": "A chair in sunlight.",
    });
    return (
      <MediaCaptionEditor
        value={value}
        onChange={(v) => {
          result = v;
          set(v);
        }}
        request={request}
        canGenerate
        context="Chair"
      />
    );
  }
  render(scope(<Editor />));
  expect(
    screen.getByRole("textbox", { name: "Image caption" }),
  ).toHaveAttribute("placeholder", "A chair in sunlight.");
  fireEvent.click(screen.getByRole("button", { name: "Suggest with AI" }));
  await screen.findByText("Review caption");
  expect(result).toEqual({});
  expect(request).toHaveBeenCalledWith(
    "/api/merchant/media/caption",
    expect.objectContaining({ locale: "de-DE" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Use in draft" }));
  expect(result).toEqual({
    "en-GB": "A chair in sunlight.",
    "de-DE": "Ein Stuhl im Licht.",
  });
  expect(screen.getByRole("textbox", { name: "Image caption" })).toHaveValue(
    "Ein Stuhl im Licht.",
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Image caption" }), {
    target: { value: "" },
  });
  expect(result["de-DE"]).toBe("");
});
it.each(["language", "image", "manual", "request", "revoked", "scope"])(
  "ignores a late proposal after %s changes",
  async (change) => {
    let finish!: (value: unknown) => void;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    ) as RequestFn;
    const onChange = vi.fn();
    const editor = (changed: boolean) =>
      scope(
        <MediaCaptionEditor
          scopeKey={
            changed && change === "scope"
              ? "other-page:3:image"
              : "page:1:image"
          }
          value={changed && change === "manual" ? { "de-DE": "Manual" } : {}}
          onChange={onChange}
          request={changed && change === "request" ? vi.fn() : request}
          imageUrl={changed && change === "image" ? "/other.png" : "/first.png"}
          canGenerate={!(changed && change === "revoked")}
          context="Chair"
        />,
        changed && change === "language" ? "sv-SE" : "de-DE",
      );
    const { rerender } = render(editor(false));
    fireEvent.click(screen.getByRole("button", { name: "Suggest with AI" }));
    rerender(editor(true));
    await act(async () =>
      finish({ locale: "de-DE", caption: "Stale", basis: "context" }),
    );
    expect(screen.queryByText("Review caption")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  },
);
it("labels context-only suggestions and exposes a recoverable error without changing content", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce({
      locale: "sv-SE",
      caption: "En stol.",
      basis: "context",
    })
    .mockRejectedValueOnce(new Error("provider credentials"));
  const onChange = vi.fn();
  render(
    scope(
      <MediaCaptionEditor
        value={{}}
        onChange={onChange}
        request={request}
        canGenerate
        context="Chair"
      />,
      "sv-SE",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Suggest with AI" }));
  expect(await screen.findByText(/image was not analysed/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  fireEvent.click(screen.getByRole("button", { name: "Suggest with AI" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Your content is unchanged",
  );
  expect(screen.queryByText("provider credentials")).not.toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});
it("renders product, shop, native app and rich-document captions as literal figcaptions", () => {
  const page = newPage("default", "en-GB", "Collection");
  page.content.blocks[0] = {
    ...page.content.blocks[0],
    kind: "image",
    image: "https://example.test/photo.png",
    caption: { "en-GB": "English", "de-DE": "Bild im Shop" },
  };
  const { container } = render(
    scope(
      <>
        <ProductGallery
          p={
            {
              name: "Chair",
              options: {},
              media: [
                {
                  id: "photo",
                  url: "/media/chair.png",
                  view: "Front",
                  caption: "Bild am Produkt",
                },
              ],
            } as any
          }
          image={0}
          setImage={vi.fn()}
        />
        <SiteRenderer
          page={page}
          language="de-DE"
          theme={{}}
          request={vi.fn()}
          channel="default"
          mainLocale="en-GB"
          products={[]}
        />
        <NativeControl
          block={{
            id: "image",
            kind: "image",
            title: { "en-GB": "Chair" },
            text: { "de-DE": "Bild aus der App" },
            dataField: "photo",
          }}
          entity={
            {
              name: "guides",
              fields: [{ name: "photo", type: "asset", label: {} }],
            } as any
          }
          records={[{ id: "record", revision: 1, photo: "owned" }]}
          locale="de-DE"
          mainLocale="en-GB"
        />
        {renderRichNode({
          type: "image",
          attrs: {
            src: "https://example.test/photo.png",
            alt: "Accessible image",
            title: "<script>literal caption</script>",
          },
        })}
      </>,
    ),
  );
  expect(
    [...container.querySelectorAll("figcaption")].map((n) => n.textContent),
  ).toEqual([
    "Bild am Produkt",
    "Bild im Shop",
    "Bild aus der App",
    "<script>literal caption</script>",
  ]);
  expect(container.querySelector("script")).toBeNull();
});
