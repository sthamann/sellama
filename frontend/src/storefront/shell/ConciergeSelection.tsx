/** Editable suggestions reuse native cards; variants and app inputs stay on the native detail page. */
import { useId, useState } from "react";
import type { Product } from "../../shared/api/shop-api";
import { useExperienceUIText } from "../../shared/i18n/experience-ui-i18n";
import { useShopText } from "../../shared/i18n/shop-i18n";
import Icon from "../../shared/ui/Icon";
import { productURL } from "../catalog/product-url";
import ProductTile from "./ProductTile";
import "../styles/concierge-selection.css";

export default function ConciergeSelection({
  ids,
  removed,
  onRemove,
  onRestore,
  products,
  money,
  business = false,
  compareInitially = false,
}: {
  ids: string[];
  removed: readonly string[];
  onRemove: (id: string) => void;
  onRestore: () => void;
  products: Product[];
  money: (n: number) => string;
  business?: boolean;
  compareInitially?: boolean;
}) {
  const { u } = useExperienceUIText();
  const { s } = useShopText();
  const [compare, setCompare] = useState(compareInitially);
  const comparisonId = useId();
  const selected = [...new Set(ids)]
    .slice(0, 12)
    .filter((id) => !removed.includes(id));
  const catalogue = new Map(products.map((product) => [product.id, product]));
  const comparable = selected.flatMap((id) => catalogue.get(id) ?? []);
  const showComparison = compare && comparable.length > 1;
  return (
    <div className="concierge-selection">
      <header>
        <div>
          <h3>{u("yourSelection")}</h3>
          <p>{u("selectionHint")}</p>
        </div>
        <div className="concierge-selection-actions">
          {comparable.length > 1 && (
            <button
              type="button"
              className="shop-secondary"
              aria-controls={comparisonId}
              aria-expanded={showComparison}
              onClick={() => setCompare(!showComparison)}
            >
              <Icon name="layers" size={16} />
              {u(showComparison ? "hideComparison" : "compareSelection")}
            </button>
          )}
          {removed.length > 0 && (
            <button
              type="button"
              className="shop-secondary"
              onClick={onRestore}
            >
              {u("restoreSelection")}
            </button>
          )}
        </div>
      </header>
      <div id={comparisonId} hidden={!showComparison}>
        {showComparison && (
          <div
            className="concierge-comparison"
            role="region"
            aria-label={u("compareSelection")}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <td />
                  {comparable.map((p) => (
                    <th scope="col" key={p.id}>
                      <a href={productURL(p)}>{p.name}</a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{u("comparisonPrice")}</th>
                  {comparable.map((p) => (
                    <td key={p.id}>
                      <strong>
                        {money(p.calculated_price?.unitPrice ?? p.price)}
                      </strong>
                      <small>{s(business ? "net" : "gross")}</small>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{u("comparisonStock")}</th>
                  {comparable.map((p) => (
                    <td key={p.id}>
                      {p.stock > 0 ? `${p.stock} ${s("available")}` : s("sold")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{u("comparisonDetails")}</th>
                  {comparable.map((p) => (
                    <td key={p.id}>{p.description || "—"}</td>
                  ))}
                </tr>
                <tr>
                  <td />
                  {comparable.map((p) => (
                    <td key={p.id}>
                      <a
                        href={productURL(p)}
                        aria-label={`${s("details")}: ${p.name}`}
                      >
                        {s("details")} <Icon name="arrow" size={14} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="concierge-selection-grid">
        {selected.map((id) => {
          const product = catalogue.get(id);
          return (
            <div className="concierge-selection-item" key={id}>
              {product ? (
                <ProductTile
                  product={product}
                  money={money}
                  business={business}
                />
              ) : (
                <a className="shop-secondary" href={productURL({ id })}>
                  {s("details")} ↗
                </a>
              )}
              <button
                type="button"
                className="concierge-selection-remove"
                aria-label={`${u("removeSelection")}: ${product?.name ?? s("details")}`}
                onClick={() => onRemove(id)}
              >
                <Icon name="close" size={16} />
                {u("removeSelection")}
              </button>
            </div>
          );
        })}
      </div>
      {!selected.length && <p>{u("emptySelection")}</p>}
    </div>
  );
}
