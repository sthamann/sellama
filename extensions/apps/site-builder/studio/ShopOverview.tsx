/** Shared zoomable board mounts at most four native page/product/category previews and retains the domain draft. */
import { useState } from "react";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import { contentText } from "../../../../frontend/src/shared/i18n/content-language";
import VisualCanvas, {
  type CanvasScene,
} from "../../../../frontend/src/shared/canvas/VisualCanvas";
import { useCanvasText } from "../../../../frontend/src/shared/canvas/canvas-i18n";
import SiteRenderer from "../Renderer";
import { type Page } from "../model";
import usePageProducts from "../usePageProducts";
import NativeProductPreview from "./NativeProductPreview";
import NativeCategoryPreview, {
  type PreviewCategory,
} from "./NativeCategoryPreview";
import StorefrontCanvas from "./StorefrontCanvas";
import type { Designer } from "./useDesigner";
import { overviewPages, overviewTheme } from "./overview-model";
import { useOverviewText } from "./overview-i18n";
import "./overview.css";
export type OverviewProps = {
  d: Designer;
  request: RequestFn;
  workspace: string;
  shopName?: string;
  language: string;
  mainLocale: string;
  device: "desktop" | "tablet" | "mobile";
  onOpen: (page?: Page) => void;
  onCommerce?: (kind: "product" | "category", id: string) => void;
};
function PagePreview({
  page,
  pages,
  ...props
}: OverviewProps & { page?: Page; pages: Page[] }) {
  const { d, request, workspace, language, mainLocale, onOpen } = props;
  const t = useOverviewText();
  const theme = overviewTheme(d.pages, d.channel, page, d.draft);
  const products = usePageProducts(
    page,
    d.context!.catalogue.elements,
    `${workspace}:${d.channel}:${language}`,
    async (ids) =>
      (
        await request(
          `/api/merchant/site/context?channel=${encodeURIComponent(d.channel)}&locale=${encodeURIComponent(language)}&ids=${encodeURIComponent(JSON.stringify(ids))}`,
        )
      ).catalogue.elements,
  );
  return (
    <>
      {products.error && <p role="alert">{t("failed")}</p>}
      <StorefrontCanvas
        request={request}
        workspace={workspace}
        shopName={props.shopName}
        channel={d.channel}
        language={language}
        device={props.device}
        appearance={page ? theme : undefined}
        products={products.products}
        onHome={() => onOpen(page)}
      >
        {page && (
          <SiteRenderer
            page={page}
            pages={pages}
            products={products.products}
            theme={theme}
            language={language}
            mainLocale={mainLocale}
            channel={d.channel}
            request={request}
            onSelect={() => onOpen(page)}
          />
        )}
      </StorefrontCanvas>
    </>
  );
}
export default function ShopOverview(props: OverviewProps) {
  const t = useOverviewText(),
    c = useCanvasText();
  const [productId, setProductId] = useState(""),
    [category, setCategory] = useState(""),
    [categories, setCategories] = useState<PreviewCategory[]>([]);
  const { d, request, workspace, language } = props,
    products = d.context!.catalogue.elements;
  const product = products.find((p) => p.id === productId) ?? products[0];
  const pages = overviewPages(d.workingPages ?? d.pages, d.channel, d.draft);
  const home = pages.find((p) => p.slug === "home");
  const scenes: CanvasScene[] = [
    {
      id: home?.id ?? "native-home",
      title: t("home"),
      detail: t(home ? "base" : "native"),
      badge: d.dirty && home?.id === d.draft?.id ? t("draft") : undefined,
      preview: <PagePreview {...props} page={home} pages={pages} />,
      onOpen: () => props.onOpen(home),
    },
  ];
  if (product)
    scenes.push({
      id: "native-product",
      disabled: !props.onCommerce,
      title: c("product"),
      detail: t("shared"),
      preview: (
        <>
          <label className="designer-overview-product">
            {t("chooseProduct")}
            <select
              value={product.id}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <StorefrontCanvas
            request={request}
            workspace={workspace}
            shopName={props.shopName}
            channel={d.channel}
            language={language}
            device={props.device}
            appearance={overviewTheme(d.pages, d.channel, undefined, d.draft)}
            products={products}
            onHome={() => {}}
          >
            <NativeProductPreview
              id={product.id}
              request={request}
              workspace={workspace}
              channel={d.channel}
              language={language}
            />
          </StorefrontCanvas>
        </>
      ),
      onOpen: () => props.onCommerce?.("product", product.id),
    });
  scenes.push({
    id: "native-category",
    disabled: !props.onCommerce,
    title: c("category"),
    detail: t("shared"),
    preview: (
      <StorefrontCanvas
        request={request}
        workspace={workspace}
        shopName={props.shopName}
        channel={d.channel}
        language={language}
        device={props.device}
        appearance={overviewTheme(d.pages, d.channel, undefined, d.draft)}
        products={products}
        onHome={() => {}}
      >
        <NativeCategoryPreview
          request={request}
          channel={d.channel}
          language={language}
          category={category}
          onCategory={setCategory}
          onCategories={setCategories}
          onEdit={() =>
            props.onCommerce?.("category", category || categories[0]?.id || "")
          }
        />
      </StorefrontCanvas>
    ),
    onOpen: () =>
      props.onCommerce?.("category", category || categories[0]?.id || ""),
  });
  for (const page of pages.filter((p) => p.slug !== "home"))
    scenes.push({
      id: page.id,
      title: contentText(page.title, language, props.mainLocale) || page.slug,
      detail: t("base"),
      badge: d.dirty && page.id === d.draft?.id ? t("draft") : undefined,
      preview: <PagePreview {...props} page={page} pages={pages} />,
      onOpen: () => props.onOpen(page),
    });
  return (
    <VisualCanvas scenes={scenes} selected={d.draft?.id} label={t("overview")}>
      {d.more && (
        <button type="button" onClick={() => void d.loadMore()}>
          {t("more")}
        </button>
      )}
    </VisualCanvas>
  );
}
