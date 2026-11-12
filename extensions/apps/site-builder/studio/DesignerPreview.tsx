/** Preview composes the shared storefront renderer with editor-only gesture controls. */
import type { ReactNode } from "react";
import { contentText } from "../../../../frontend/src/shared/i18n/content-language";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import type { Page, Theme } from "../model";
import { effectivePages } from "../model";
import SiteRenderer, { type SiteProduct } from "../Renderer";
import StorefrontCanvas, { type HomeSnapshot } from "./StorefrontCanvas";
import { layoutKind } from "../commerce-layout";
import { useOverviewText } from "./overview-i18n";
import NativeProductPreview from "./NativeProductPreview";
import NativeCategoryPreview, {
  type PreviewCategory,
} from "./NativeCategoryPreview";
import EditableSection, { DropPosition } from "./EditableSection";
import type { Designer } from "./useDesigner";
export default function DesignerPreview({
  d,
  request,
  workspace,
  shopName,
  language,
  mainLocale,
  device,
  theme,
  products,
  comparison,
  writable,
  onHome,
  onSnapshot,
  onEdit,
  previewId,
  onCategory,
  onCategories,
}: {
  d: Designer;
  request: RequestFn;
  workspace: string;
  shopName?: string;
  language: string;
  mainLocale: string;
  device: "desktop" | "tablet" | "mobile";
  theme: Theme;
  products: SiteProduct[];
  comparison: Page | null;
  writable: boolean;
  onHome: (snapshot: HomeSnapshot, section: "hero" | "products") => void;
  onSnapshot: (snapshot: HomeSnapshot) => void;
  onEdit: () => void;
  previewId: string;
  onCategory: (id: string) => void;
  onCategories: (items: PreviewCategory[]) => void;
}) {
  const t = useOverviewText();
  const page = comparison ?? d.draft;
  const kind = layoutKind(page);
  const product =
    d.context!.catalogue.elements.find((p) => p.id === previewId) ??
    d.context!.catalogue.elements[0];
  const render = (nativeSections?: Record<string, ReactNode>) =>
    page && (
      <SiteRenderer
        nativeSections={nativeSections}
        page={page}
        pages={effectivePages(d.pages, d.channel)}
        products={products}
        theme={comparison ? { ...theme, ...comparison.theme } : theme}
        language={language}
        mainLocale={mainLocale}
        channel={d.channel}
        request={request}
        decorate={
          !comparison
            ? (block, index, section) => (
                <EditableSection
                  key={block.id}
                  block={block}
                  index={index}
                  count={d.draft!.content.blocks.length}
                  selected={d.selected === block.id}
                >
                  {section}
                </EditableSection>
              )
            : undefined
        }
        trailing={
          !comparison ? (
            <DropPosition at={page.content.blocks.length} />
          ) : undefined
        }
        selected={d.selected}
        onSelect={(id) => {
          d.setSelected(id);
          onEdit();
        }}
        onInline={
          writable && !comparison
            ? (id, text) =>
                d.edit({
                  ...d.draft!,
                  content: {
                    blocks: d.draft!.content.blocks.map((b) =>
                      b.id === id
                        ? {
                            ...b,
                            text: { ...b.text, [language]: text },
                          }
                        : b,
                    ),
                  },
                })
            : undefined
        }
      />
    );
  const content =
    kind === "product" ? (
      product ? (
        <NativeProductPreview
          id={product.id}
          request={request}
          workspace={workspace}
          channel={d.channel}
          language={language}
          renderLayout={render}
        />
      ) : (
        <main className="shop-content">
          <p role="status">{t("productUnavailable")}</p>
          {render(
            Object.fromEntries(
              page!.content.blocks
                .filter((block) => block.kind === "native")
                .map((block) => [
                  block.id,
                  <h2>{contentText(block.text, language, mainLocale)}</h2>,
                ]),
            ),
          )}
        </main>
      )
    ) : kind === "category" ? (
      <NativeCategoryPreview
        request={request}
        channel={d.channel}
        language={language}
        category={previewId}
        onCategory={onCategory}
        onCategories={onCategories}
        renderLayout={render}
      />
    ) : (
      render()
    );
  return (
    <StorefrontCanvas
      key={`${workspace}:${d.channel}:${language}`}
      pageKey={d.draft?.id}
      request={request}
      workspace={workspace}
      shopName={shopName}
      channel={d.channel}
      language={language}
      device={device}
      appearance={d.draft ? theme : undefined}
      products={d.context!.catalogue.elements}
      onHome={onHome}
      onSnapshot={onSnapshot}
    >
      {content}
    </StorefrontCanvas>
  );
}
