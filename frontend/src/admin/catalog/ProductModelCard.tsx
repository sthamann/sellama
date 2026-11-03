/** A model edits the same localized product media item; material choices come from the loaded GLB. */
import { useState } from "react";
import ModelViewer from "../../shared/media/ModelViewer";
import { useModelText } from "../../shared/media/model-i18n";
import { useContentLanguage } from "../../shared/i18n/ContentLanguage";
import LocalizedField from "../../shared/i18n/LocalizedField";
import { mediaAlt, type GalleryImage } from "./media-model";
import { modelURL } from "../../shared/media/product-media";
import Icon from "../../shared/ui/Icon";
export default function ProductModelCard({
  model,
  canWrite,
  onChange,
  onRemove,
}: {
  model: GalleryImage;
  canWrite: boolean;
  onChange: (model: GalleryImage) => void;
  onRemove: () => void;
}) {
  const t = useModelText(),
    { language, mainLocale } = useContentLanguage();
  const [names, setNames] = useState<string[] | null>(null);
  const selected = model.modelVariant ?? "";
  return (
    <article className="product-model-card">
      <ModelViewer
        key={model.url}
        url={modelURL(model.url, undefined, true)}
        alt={mediaAlt(model, language, mainLocale) || t("model")}
        variant={selected}
        onVariants={setNames}
      />
      <fieldset disabled={!canWrite} className="product-model-fields">
        <LocalizedField
          label={t("alt")}
          value={model.alt ?? { [mainLocale]: model.view }}
          maxLength={100}
          onChange={(alt) => onChange({ ...model, alt })}
        />
        <LocalizedField
          label={t("caption")}
          value={model.caption ?? {}}
          maxLength={600}
          onChange={(caption) => onChange({ ...model, caption })}
        />
        <label>
          {t("material")}
          <select
            value={selected}
            onChange={(e) =>
              onChange({ ...model, modelVariant: e.target.value || null })
            }
          >
            <option value="">{t("original")}</option>
            {selected && !names?.includes(selected) && (
              <option value={selected}>{selected}</option>
            )}
            {names?.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {!names && <p>{t("discover")}</p>}
        <button type="button" className="studio-secondary" onClick={onRemove}>
          <Icon name="close" size={16} />
          {t("remove")}
        </button>
      </fieldset>
    </article>
  );
}
