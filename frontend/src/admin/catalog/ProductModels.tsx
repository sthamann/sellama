/** Native GLB upload, parent reuse and material binding stay inside the existing revisioned product draft. */
import { useRef, useState } from "react";
import type { RequestFn } from "../../shared/api/types";
import { useContentLanguage } from "../../shared/i18n/ContentLanguage";
import { useModelText } from "../../shared/media/model-i18n";
import { isModel } from "../../shared/media/product-media";
import type { ProductDraft } from "./catalog-model";
import type { GalleryImage } from "./media-model";
import ProductModelCard from "./ProductModelCard";
import Icon from "../../shared/ui/Icon";
import "../styles/product-models.css";
export default function ProductModels({
  draft,
  request,
  onChange,
  canWrite,
}: {
  draft: ProductDraft;
  request: RequestFn;
  onChange: (draft: ProductDraft) => void;
  canWrite: boolean;
}) {
  const t = useModelText(),
    { mainLocale } = useContentLanguage();
  const input = useRef<HTMLInputElement>(null),
    current = useRef(draft),
    writable = useRef(canWrite);
  current.current = draft;
  writable.current = canWrite;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const media = draft.commerce.media as GalleryImage[],
    models = media.filter(isModel);
  const replace = (items: GalleryImage[]) => {
    if (writable.current)
      onChange({
        ...current.current,
        commerce: { ...current.current.commerce, media: items },
      });
  };
  const append = (items: GalleryImage[]) => {
    const all = current.current.commerce.media as GalleryImage[];
    if (
      all.length + items.length > 20 ||
      all.filter(isModel).length + items.length > 4
    )
      throw Error(t("limit"));
    replace([...all, ...items]);
  };
  const upload = async (file?: File) => {
    if (!file || busy || !canWrite || !draft.id) return;
    if (
      !file.name.toLowerCase().endsWith(".glb") ||
      !file.size ||
      file.size > 20 * 1024 * 1024
    ) {
      setError(t("invalid"));
      return;
    }
    const product = draft.id;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set(
        "file",
        new File([file], file.name, { type: "model/gltf-binary" }),
      );
      body.set("kind", "attachment");
      body.set("title", JSON.stringify({ [mainLocale]: file.name }));
      const result = await request(
        `/api/merchant/products/${encodeURIComponent(product)}/assets`,
        body,
      );
      if (current.current.id !== product || !writable.current) return;
      await request(
        `/api/merchant/assets/${result.id}`,
        { digest: result.digest, public: true },
        "PUT",
      );
      if (current.current.id === product && writable.current)
        append([
          {
            id: result.id,
            type: "model",
            url: `/store-api/assets/${result.id}?shop=${encodeURIComponent(result.shop)}`,
            view: file.name.slice(0, 100),
            alt: { [mainLocale]: file.name.slice(0, 100) },
          },
        ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <section
      className="product-models"
      aria-label={t("title")}
      aria-busy={busy}
    >
      <header>
        <div>
          <h3>{t("title")}</h3>
          <p>{t("hint")}</p>
        </div>
        {canWrite && draft.id && (
          <button
            type="button"
            className="studio-primary"
            disabled={busy || media.length >= 20 || models.length >= 4}
            onClick={() => input.current?.click()}
          >
            <Icon name="plus" size={18} />
            {t("upload")}
          </button>
        )}
      </header>
      <p>{t("variantHint")}</p>
      {!draft.id && <p>{t("saveFirst")}</p>}
      <input
        ref={input}
        type="file"
        hidden
        accept=".glb,model/gltf-binary"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      {canWrite && draft.catalog.parentId && (
        <button
          type="button"
          className="studio-secondary"
          disabled={busy || models.length >= 4}
          onClick={async () => {
            const product = draft.id;
            setBusy(true);
            setError("");
            try {
              const parent = await request(
                `/api/merchant/products/${encodeURIComponent(draft.catalog.parentId!)}`,
              );
              if (current.current.id !== product || !writable.current) return;
              const entries = (parent.commerce.media as GalleryImage[]).filter(
                isModel,
              );
              if (!entries.length) throw Error(t("parentEmpty"));
              append(
                entries.filter(
                  (item) =>
                    !current.current.commerce.media.some(
                      (m: GalleryImage) => m.url === item.url,
                    ),
                ),
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("inherit")}
        </button>
      )}
      {busy && <p role="status">{t("saving")}</p>}
      {error && <p role="alert">{error}</p>}
      {models.map((model) => (
        <ProductModelCard
          key={model.id}
          model={model}
          canWrite={canWrite && !busy}
          onChange={(item) =>
            replace(media.map((m) => (m.id === model.id ? item : m)))
          }
          onRemove={() => replace(media.filter((m) => m.id !== model.id))}
        />
      ))}
    </section>
  );
}
