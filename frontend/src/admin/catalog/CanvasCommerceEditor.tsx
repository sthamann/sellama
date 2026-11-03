/** Canvas handoff reuses native product/category editors without unmounting or copying the page designer. */
import "../styles/canvas-commerce-editor.css";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { RequestFn } from "../../shared/api/types";
import type { Category } from "./catalog-model";
import { useCanvasText } from "../../shared/canvas/canvas-i18n";
import { useCatalogText } from "../../shared/i18n/catalog-i18n";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
const ProductEditor = lazy(() => import("./ProductEditor"));
const CategoriesWorkspace = lazy(() => import("./CategoriesWorkspace"));
export default function CanvasCommerceEditor({
  kind,
  id,
  request,
  canWrite,
  onBack,
  onSaved,
  onDirtyChange,
}: {
  kind: "product" | "category";
  id: string;
  request: RequestFn;
  canWrite: boolean;
  onBack: () => void;
  onSaved: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useCanvasText(),
    { c } = useCatalogText();
  const [categories, setCategories] = useState<Category[]>(),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [leaving, setLeaving] = useState(false);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const reload = useCallback(async () => {
    const value = await request("/api/merchant/categories");
    setCategories(value.elements);
    onSaved();
  }, [request, onSaved]);
  useEffect(() => {
    let active = true;
    void request("/api/merchant/categories")
      .then((v) => {
        if (active) setCategories(v.elements);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [request]);
  return (
    <section className="canvas-commerce-editor">
      <div className="visual-workspace-toolbar">
        <button
          type="button"
          onClick={() => (dirty ? setLeaving(true) : onBack())}
        >
          {t("overview")}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <Suspense fallback={<p role="status">{c("loading")}</p>}>
        {categories &&
          (kind === "product" ? (
            <ProductEditor
              id={id}
              categories={categories}
              request={request}
              canWrite={canWrite}
              onBack={onBack}
              onCreated={onSaved}
              onDirtyChange={setDirty}
            />
          ) : (
            <CategoriesWorkspace
              initialId={id}
              categories={categories}
              request={request}
              canWrite={canWrite}
              onRefresh={() => void reload()}
              onDirtyChange={setDirty}
            />
          ))}
      </Suspense>
      {leaving && (
        <ConfirmDialog
          title={c("unsaved")}
          confirmLabel={c("discard")}
          onCancel={() => setLeaving(false)}
          onConfirm={onBack}
        >
          <p>{c("unsaved")}</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
