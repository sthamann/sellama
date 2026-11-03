/** Shared native product gallery; selection changes only local presentation state. */
import type { Product } from "../../shared/api/shop-api";
import { useShopText } from "../../shared/i18n/shop-i18n";
import ImagePlaceholder from "./ImagePlaceholder";
import ModelViewer from "../../shared/media/ModelViewer";
import { isModel, modelURL } from "../../shared/media/product-media";
import { useModelText } from "../../shared/media/model-i18n";
import Icon from "../../shared/ui/Icon";
export default function ProductGallery({
  p,
  image,
  setImage,
  modelOpen,
  onModelOpen,
}: {
  p: Product;
  image: number;
  setImage: (image: number) => void;
  modelOpen?: boolean;
  onModelOpen?: (open: boolean) => void;
}) {
  const { s } = useShopText();
  const t = useModelText();
  const current = p.media[image];
  const selected =
    (modelOpen
      ? current && isModel(current)
        ? current
        : p.media.find(isModel)
      : undefined) ??
    current ??
    p.media[0];
  return (
    <section className="pdp-gallery" aria-label={t("label")}>
      <figure
        className={`gallery-main ${selected && isModel(selected) ? "has-model" : ""}`}
      >
        {selected && isModel(selected) ? (
          <ModelViewer
            key={`${p.id}:${selected.id}`}
            url={modelURL(selected.url, p.id)}
            variant={selected.modelVariant}
            initialOpen={modelOpen}
            onOpenChange={onModelOpen}
            alt={selected.view || p.name}
          />
        ) : selected?.url ? (
          <img
            src={selected.url}
            alt={`${p.name} · ${Object.values(p.options).map(s).join(" / ")} · ${s(selected.view ?? "front")}`}
            width="780"
            height="600"
          />
        ) : (
          <ImagePlaceholder label={s("noImage")} />
        )}
        {p.media.length > 0 && (
          <span>
            {p.media.some(isModel) ? t("label") : s("images")} ·{" "}
            {p.media.indexOf(selected) + 1} / {p.media.length}
          </span>
        )}
        {selected?.caption && <figcaption>{selected.caption}</figcaption>}
      </figure>
      <div className="gallery-thumbs">
        {p.media.map((m, i) => (
          <button
            key={m.id}
            aria-label={
              isModel(m) ? `${t("model")} · ${m.view || p.name}` : s(m.view)
            }
            aria-pressed={m === selected}
            onClick={() => {
              setImage(i);
              onModelOpen?.(isModel(m));
            }}
          >
            {isModel(m) ? (
              <span className="model-thumb">
                <Icon name="box" size={30} />
              </span>
            ) : (
              <img src={m.url} alt="" width="90" height="70" />
            )}
            <span>{isModel(m) ? t("model") : s(m.view)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
