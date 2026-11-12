/** Category scenes use the native channel listing and shared product cards, without shopper or payment effects. */
import { useEffect, useState, type ReactNode } from "react";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import type { Product } from "../../../../frontend/src/shared/api/shop-api";
import ProductTile from "../../../../frontend/src/storefront/shell/ProductTile";
import { useShopText } from "../../../../frontend/src/shared/i18n/shop-i18n";
import { useCanvasText } from "../../../../frontend/src/shared/canvas/canvas-i18n";
export type PreviewCategory = {
  id: string;
  name: string;
  type: string;
  description?: string;
};
export default function NativeCategoryPreview({
  request,
  channel,
  language,
  category,
  onCategories,
  onCategory,
  renderLayout,
}: {
  request: RequestFn;
  channel: string;
  language: string;
  category: string;
  onCategories?: (items: PreviewCategory[]) => void;
  onCategory?: (id: string) => void;
  renderLayout?: (sections: Record<string, ReactNode>) => ReactNode;
}) {
  const t = useCanvasText(),
    { s, locale } = useShopText();
  const [items, setItems] = useState<PreviewCategory[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setItems([]);
    setError("");
    void request("/store-api/navigation", {}, "POST", {
      salesChannel: channel === "*" ? "default" : channel,
      locale: language,
    })
      .then((v) => {
        if (active) {
          const rows = v.elements.filter(
            (x: PreviewCategory) => x.type !== "link",
          );
          setItems(rows);
          onCategories?.(rows);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [request, channel, language]);
  const chosen = items.find((x) => x.id === category) ?? items[0];
  useEffect(() => {
    let active = true;
    setProducts([]);
    if (!chosen) return;
    setLoading(true);
    void request(
      "/store-api/product",
      { categoryId: chosen.id, limit: 12 },
      "POST",
      { salesChannel: channel === "*" ? "default" : channel, locale: language },
    )
      .then((v) => {
        if (active) setProducts(v.elements);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [request, channel, language, chosen?.id]);
  const render =
    renderLayout ??
    ((sections) => (
      <>
        {sections.filters}
        {sections.listing}
      </>
    ));
  return (
    <main
      className="shop-content is-design-preview"
      onClickCapture={(event) => {
        if ((event.target as Element).closest("a")) event.preventDefault();
      }}
    >
      {render({
        filters: (
          <>
            {onCategory && (
              <label className="canvas-category-choice">
                {t("category")}
                <select
                  value={chosen?.id ?? ""}
                  onChange={(e) => onCategory(e.target.value)}
                >
                  {items.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <h1>{chosen?.name ?? t("collection")}</h1>
            {chosen?.description && <p>{chosen.description}</p>}
            {error && <p role="alert">{error}</p>}
            {!chosen && !error && <p>{t("categoryHint")}</p>}
          </>
        ),
        listing: (
          <>
            <div className="shop-grid">
              {products.map((p) => (
                <ProductTile
                  key={p.id}
                  product={p}
                  money={(n) =>
                    new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: p.currency ?? "EUR",
                    }).format(n)
                  }
                />
              ))}
            </div>
            {!products.length && chosen && !error && (
              <p>{loading ? s("loading") : t("emptyProducts")}</p>
            )}
          </>
        ),
      })}
    </main>
  );
}
