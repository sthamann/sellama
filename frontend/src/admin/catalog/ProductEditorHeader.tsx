/** Compact product identity, current save state and shared language context stay above every section. */
import type { ComponentProps } from "react";
import Icon from "../../shared/ui/Icon";
import { mediaImage } from "../../shared/media/product-media";
import ContentLanguagePicker from "../../shared/i18n/ContentLanguagePicker";
import { useCatalogText } from "../../shared/i18n/catalog-i18n";
import { productName } from "./catalog-model";
import ProductEditorActions from "./ProductEditorActions";
import { useProductEditorText } from "./product-editor-i18n";
export default function ProductEditorHeader({
  lang,
  saved,
  onBack,
  backLabel,
  ...actions
}: ComponentProps<typeof ProductEditorActions> & {
  backLabel?: string;
  lang: string;
  saved: boolean;
  onBack: () => void;
}) {
  const { c } = useCatalogText();
  const e = useProductEditorText();
  const { draft, id, dirty } = actions;
  const image = mediaImage(draft.commerce.media);
  return (
    <header className="product-editor-header">
      <div className="product-editor-heading">
        <button
          type="button"
          className="product-editor-back"
          aria-label={backLabel ?? e("back")}
          title={backLabel ?? e("back")}
          onClick={onBack}
        >
          <Icon name="arrow" />
        </button>
        <div className="product-editor-art" aria-hidden="true">
          {image ? <img src={image} alt="" /> : <Icon name="box" />}
        </div>
        <div className="product-editor-identity">
          <h1>{productName(draft, lang) || c("newProduct")}</h1>
          <div className="product-editor-meta">
            {draft.catalog.productNumber && (
              <span>{draft.catalog.productNumber}</span>
            )}
            {id && (
              <span>
                {e("version").replace("{revision}", String(draft.revision))}
              </span>
            )}
            <span role="status" className={dirty ? "product-editor-dirty" : ""}>
              {saved ? c("saved") : dirty ? c("unsaved") : ""}
            </span>
          </div>
        </div>
        <ProductEditorActions {...actions} />
      </div>
      <ContentLanguagePicker />
    </header>
  );
}
