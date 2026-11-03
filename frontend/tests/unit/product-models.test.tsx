/** Native model media stays in the shared draft and cannot become image thumbnails or bypass current rights. */
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import { ContentLanguage } from "../../src/shared/i18n/ContentLanguage";
import {
  newDraft,
  type ProductDraft,
} from "../../src/admin/catalog/catalog-model";
import ProductModels from "../../src/admin/catalog/ProductModels";
import Gallery from "../../src/storefront/catalog/ProductGallery";
import { mediaImage } from "../../src/shared/media/product-media";
import { product } from "./fixtures";
vi.mock("../../src/shared/media/ModelViewer", () => ({
  default: ({ url, variant, onVariants }: any) => (
    <div data-testid="viewer" data-url={url} data-variant={variant}>
      <button onClick={() => onVariants?.(["Oak", "Ocean"])}>
        Discover fixture materials
      </button>
    </div>
  ),
}));
const image = { id: "photo", url: "/media/photo.png", view: "Front" };
const model = {
  id: "model",
  type: "model" as const,
  url: "/store-api/assets/model?shop=unit-shop",
  view: "Stool",
  alt: { "it-IT": "Sgabello" },
  modelVariant: "Oak",
};
function wrap(children: React.ReactNode) {
  return (
    <LocaleScope locale="en-GB">
      <ContentLanguage
        locales={["it-IT", "pl-PL"]}
        mainLocale="it-IT"
        language="pl-PL"
      >
        {children}
      </ContentLanguage>
    </LocaleScope>
  );
}
it("keeps GLB URLs out of image-only views, including model-only products", () => {
  expect(mediaImage([model, image])).toBe(image.url);
  expect(mediaImage([model])).toBeUndefined();
  const { rerender } = render(
    wrap(
      <Gallery
        p={{ ...product, media: [image, model] }}
        image={1}
        setImage={vi.fn()}
      />,
    ),
  );
  expect(screen.getByTestId("viewer")).toHaveAttribute("data-variant", "Oak");
  expect(document.querySelector('img[src*="assets/model"]')).toBeNull();
  rerender(
    wrap(
      <Gallery
        p={{
          ...product,
          id: "blue-sku",
          media: [{ ...model, modelVariant: "Ocean" }],
        }}
        image={1}
        setImage={vi.fn()}
      />,
    ),
  );
  expect(screen.getByTestId("viewer")).toHaveAttribute("data-variant", "Ocean");
});
it("reuses parent models and binds an actual material without copying inherited text", async () => {
  const user = userEvent.setup();
  let saved: ProductDraft = {
    ...newDraft(),
    id: "sku",
    catalog: { ...newDraft().catalog, parentId: "parent" },
  };
  const request = vi.fn(async (..._args: unknown[]) => ({
    commerce: { media: [image, model] },
  }));
  function Harness() {
    const [draft, setDraft] = useState(saved);
    return wrap(
      <ProductModels
        draft={draft}
        request={request}
        canWrite
        onChange={(v) => {
          saved = v;
          setDraft(v);
        }}
      />,
    );
  }
  render(<Harness />);
  await user.click(
    screen.getByRole("button", { name: "Use models from parent product" }),
  );
  expect(request).toHaveBeenCalledWith("/api/merchant/products/parent");
  expect(saved.commerce.media).toEqual([model]);
  await user.click(
    screen.getByRole("button", { name: "Discover fixture materials" }),
  );
  await user.selectOptions(screen.getByLabelText("Material variant"), "Ocean");
  expect(saved.commerce.media[0].modelVariant).toBe("Ocean");
  expect(saved.commerce.media[0].alt).toEqual({ "it-IT": "Sgabello" });
});
it("uses the native multipart upload and digest publication before adding a typed model", async () => {
  let saved = { ...newDraft(), id: "sku" };
  const change = vi.fn((v) => (saved = v));
  const request = vi.fn(async (..._args: unknown[]) => ({
    id: "new-model",
    shop: "unit-shop",
    digest: "digest",
  }));
  const { container } = render(
    wrap(
      <ProductModels
        draft={saved}
        request={request}
        onChange={change}
        canWrite
      />,
    ),
  );
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File(["glb"], "stool.glb")] },
  });
  await waitFor(() => expect(change).toHaveBeenCalledOnce());
  expect(request.mock.calls[0][0]).toBe("/api/merchant/products/sku/assets");
  expect(request.mock.calls[1]).toEqual([
    "/api/merchant/assets/new-model",
    { digest: "digest", public: true },
    "PUT",
  ]);
  expect(saved.commerce.media[0]).toMatchObject({
    type: "model",
    url: "/store-api/assets/new-model?shop=unit-shop",
    alt: { "it-IT": "stool.glb" },
  });
});
it("does not append an in-flight upload after write rights are removed", async () => {
  let finish!: (v: any) => void;
  const request = vi.fn(() => new Promise((r) => (finish = r))),
    change = vi.fn(),
    draft = { ...newDraft(), id: "sku" };
  const { container, rerender } = render(
    wrap(
      <ProductModels
        draft={draft}
        request={request}
        canWrite
        onChange={change}
      />,
    ),
  );
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File(["glb"], "stool.glb")] },
  });
  rerender(
    wrap(
      <ProductModels
        draft={draft}
        request={request}
        canWrite={false}
        onChange={change}
      />,
    ),
  );
  finish({ id: "x", digest: "d", shop: "unit-shop" });
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(change).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
});
it("selects each of several models while keeping 3D open", async () => {
  function Harness() {
    const [imageIndex, select] = useState(1);
    const [open, setOpen] = useState(true);
    return wrap(
      <Gallery
        p={{
          ...product,
          media: [
            image,
            model,
            {
              ...model,
              id: "second",
              view: "Wide stool",
              modelVariant: "Ocean",
            },
          ],
        }}
        image={imageIndex}
        setImage={select}
        modelOpen={open}
        onModelOpen={setOpen}
      />,
    );
  }
  render(<Harness />);
  await userEvent.click(
    screen.getByRole("button", { name: "3D model · Wide stool" }),
  );
  expect(screen.getByTestId("viewer")).toHaveAttribute("data-variant", "Ocean");
});
