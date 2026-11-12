/** Scrollable page preview and optional native record editor share the Studio layout. */
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import CanvasCommerceEditor from "../../../../frontend/src/admin/catalog/CanvasCommerceEditor";
import type { Page, Theme } from "../model";
import type { CommerceLayout } from "../commerce-layout";
import type { SiteProduct } from "../Renderer";
import DesignerPreview from "./DesignerPreview";
import DesignerPreviewBar from "./DesignerPreviewBar";
import ShopOverview from "./ShopOverview";
import type { HomeSnapshot } from "./StorefrontCanvas";
import type { PreviewCategory } from "./NativeCategoryPreview";
import type { Designer } from "./useDesigner";
import type useCommerceCanvas from "./useCommerceCanvas";
import { useOverviewText } from "./overview-i18n";

type Device = "desktop" | "tablet" | "mobile";
type Props = {
  d: Designer;
  workspace: string;
  shopName?: string;
  request: RequestFn;
  language: string;
  mainLocale: string;
  rights: string[];
  sandbox: boolean;
  overview: boolean;
  setOverview: (value: boolean) => void;
  commerce: ReturnType<typeof useCommerceCanvas>;
  showPages: boolean;
  setShowPages: (value: boolean) => void;
  toolsOpen: boolean;
  setToolsOpen: (value: boolean) => void;
  writable: boolean;
  device: Device;
  setDevice: (value: Device) => void;
  scopeKey: string;
  openLayout: (kind: CommerceLayout, id: string) => void;
  open: (page: Page) => void;
  setPendingHome: (value: boolean) => void;
  layout?: CommerceLayout;
  previewId: string;
  setPreviewId: (value: string) => void;
  setPreviewCategories: (value: PreviewCategory[]) => void;
  theme: Theme;
  products: SiteProduct[];
  comparison: Page | null;
  onHome: (snapshot: HomeSnapshot, section: "hero" | "products") => void;
  onSnapshot: (snapshot: HomeSnapshot) => void;
  onEdit: () => void;
};

export default function DesignerPreviewPane({
  d,
  workspace,
  shopName,
  request,
  language,
  mainLocale,
  rights,
  sandbox,
  overview,
  setOverview,
  commerce,
  showPages,
  setShowPages,
  toolsOpen,
  setToolsOpen,
  writable,
  device,
  setDevice,
  scopeKey,
  openLayout,
  open,
  setPendingHome,
  layout,
  previewId,
  setPreviewId,
  setPreviewCategories,
  theme,
  products,
  comparison,
  onHome,
  onSnapshot,
  onEdit,
}: Props) {
  const o = useOverviewText(),
    previewProducts = d.context!.catalogue.elements;
  return (
    <section
      className={`designer-canvas${overview ? " is-board" : commerce.visible ? " is-data-editor" : ""}`}
    >
      {(!commerce.visible || overview) && (
        <DesignerPreviewBar
          d={d}
          writable={writable}
          overview={overview}
          showPages={showPages}
          device={device}
          onDevice={setDevice}
          onOverview={() => {
            setOverview(!overview);
            commerce.setVisible(false);
          }}
          toolsOpen={toolsOpen}
          onTools={() => setToolsOpen(!toolsOpen)}
          onPages={() => {
            setOverview(false);
            setShowPages(!showPages);
            commerce.setVisible(false);
          }}
        />
      )}
      {overview ? (
        <ShopOverview
          key={scopeKey}
          d={d}
          request={request}
          workspace={workspace}
          shopName={shopName}
          language={language}
          mainLocale={mainLocale}
          device={device}
          onLayout={openLayout}
          onOpen={(page) => {
            commerce.setVisible(false);
            setOverview(false);
            if (page && page.id === d.draft?.id) return;
            if (page) open(page);
            else if (d.dirty) setPendingHome(true);
            else d.close();
          }}
        />
      ) : !commerce.visible ? (
        <>
          {layout && (
            <div className="designer-layout-sample">
              <h2>
                {o(
                  layout === "product"
                    ? "editProductLayout"
                    : "editCategoryLayout",
                )}
              </h2>
              {layout === "product" && previewProducts.length > 0 && (
                <label className="designer-overview-product">
                  {o("chooseProduct")}
                  <select
                    value={previewId}
                    onChange={(event) => setPreviewId(event.target.value)}
                  >
                    {previewProducts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {previewId && rights.includes("catalog.read") && (
                <button
                  className="studio-secondary"
                  type="button"
                  onClick={() => commerce.pick(layout, previewId)}
                >
                  {o(
                    layout === "product"
                      ? "editProductRecord"
                      : "editCategoryRecord",
                  )}
                </button>
              )}
            </div>
          )}
          <DesignerPreview
            previewId={previewId}
            onCategory={setPreviewId}
            onCategories={setPreviewCategories}
            d={d}
            request={request}
            workspace={workspace}
            shopName={shopName}
            language={language}
            mainLocale={mainLocale}
            device={device}
            theme={theme}
            products={products}
            comparison={comparison}
            writable={writable}
            onHome={onHome}
            onSnapshot={onSnapshot}
            onEdit={onEdit}
          />
        </>
      ) : null}
      {commerce.target && (
        <div hidden={!commerce.visible || overview}>
          <CanvasCommerceEditor
            key={`${commerce.target.kind}:${commerce.target.id}`}
            kind={commerce.target.kind}
            id={commerce.target.id}
            onDirtyChange={commerce.setDirty}
            request={request}
            canWrite={sandbox && rights.includes("catalog.write")}
            onBack={() => {
              commerce.clear();
              setOverview(true);
            }}
            onSaved={() => void d.search("")}
          />
        </div>
      )}
    </section>
  );
}
