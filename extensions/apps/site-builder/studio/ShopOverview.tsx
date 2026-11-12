/** Shared zoomable board mounts at most four native page/product/category previews and retains the domain draft. */
import { useState, type ReactNode } from "react";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import { contentText } from "../../../../frontend/src/shared/i18n/content-language";
import VisualCanvas, {
  type CanvasScene,
} from "../../../../frontend/src/shared/canvas/VisualCanvas";
import { useCanvasText } from "../../../../frontend/src/shared/canvas/canvas-i18n";
import SiteRenderer from "../Renderer";
import {
  commercePage,
  layoutKind,
  type CommerceLayout,
} from "../commerce-layout";
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
  onLayout: (kind: CommerceLayout, previewId: string) => void;
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
        previewOnly
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
  const layoutPreview = (kind: CommerceLayout) => {
    const page = commercePage(pages, d.channel, kind);
    return page
      ? (nativeSections: Record<string, ReactNode>) => (
          <SiteRenderer
            page={page}
            products={products}
            theme={overviewTheme(d.pages, d.channel, page, d.draft)}
            language={language}
            mainLocale={props.mainLocale}
            channel={d.channel}
            request={request}
            nativeSections={nativeSections}
            onSelect={() => {}}
          />
        )
      : undefined;
  };
  const scenes: CanvasScene[] = [
    {
      id: home?.id ?? "native-home",
      title: t("home"),
      actionLabel: c("editPage"),
      detail: t(home ? "base" : "native"),
      badge: d.dirty && home?.id === d.draft?.id ? t("draft") : undefined,
      preview: <PagePreview {...props} page={home} pages={pages} />,
      onOpen: () => props.onOpen(home),
    },
  ];
  scenes.push({
    id: "native-product",
    title: c("product"),
    actionLabel: t("editProductLayout"),
    detail: t("productLayoutHint"),
    preview: (
      <>
        {product && (
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
        )}
        <StorefrontCanvas
          previewOnly
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
          {product ? (
            <NativeProductPreview
              id={product.id}
              request={request}
              workspace={workspace}
              channel={d.channel}
              language={language}
              renderLayout={layoutPreview("product")}
            />
          ) : (
            <p className="designer-preview-status">{t("productUnavailable")}</p>
          )}
        </StorefrontCanvas>
      </>
    ),
    onOpen: () => props.onLayout("product", product?.id ?? ""),
  });
  scenes.push({
    id: "native-category",
    title: c("category"),
    actionLabel: t("editCategoryLayout"),
    detail: t("categoryLayoutHint"),
    preview: (
      <>
        {categories.length > 0 && (
          <label className="designer-overview-product">
            {t("chooseCategory")}
            <select
              value={category || categories[0]?.id}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <StorefrontCanvas
          previewOnly
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
            onCategories={setCategories}
            renderLayout={layoutPreview("category")}
          />
        </StorefrontCanvas>
      </>
    ),
    onOpen: () =>
      props.onLayout("category", category || categories[0]?.id || ""),
  });
  for (const page of pages.filter((p) => p.slug !== "home" && !layoutKind(p)))
    scenes.push({
      id: page.id,
      title: contentText(page.title, language, props.mainLocale) || page.slug,
      actionLabel: c("editPage"),
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
