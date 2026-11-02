/** Shared bounded screenshot/URL inputs never render reference HTML or save a design without proposal review. */
import "./canvas.css";
import { useEffect, useRef, useState } from "react";
import { prepareDesignImage } from "../agents/reference-images";
import { useCanvasText } from "./canvas-i18n";
export default function ReferenceInputs({
  urls,
  images,
  onUrls,
  onImages,
  onError,
  onBusy,
  disabled,
  scope,
}: {
  urls: string;
  images: string[];
  onUrls: (v: string) => void;
  onImages: (v: string[]) => void;
  onError: (v: string) => void;
  onBusy: (v: boolean) => void;
  disabled: boolean;
  scope: string;
}) {
  const t = useCanvasText(),
    epoch = useRef(0),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    epoch.current++;
    setLoading(false);
    onBusy(false);
    return () => {
      epoch.current++;
    };
  }, [scope]);
  const receive = async (files: File[]) => {
    if (disabled || loading || !files.length) return;
    const ticket = ++epoch.current;
    setLoading(true);
    onBusy(true);
    onError("");
    try {
      if (files.length + images.length > 2) throw Error();
      const prepared = await Promise.all(files.map(prepareDesignImage));
      if (ticket === epoch.current) onImages([...images, ...prepared]);
    } catch {
      if (ticket === epoch.current) onError(t("imageError"));
    } finally {
      if (ticket === epoch.current) {
        setLoading(false);
        onBusy(false);
      }
    }
  };
  return (
    <div
      className="canvas-reference-inputs"
      onDragOver={(e) => {
        if (!disabled && e.dataTransfer.types.includes("Files"))
          e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          void receive([...e.dataTransfer.files]);
        }
      }}
    >
      <label>
        {t("source")}
        <textarea
          value={urls}
          disabled={disabled || loading}
          rows={2}
          maxLength={6002}
          onChange={(e) => onUrls(e.target.value)}
        />
      </label>
      <label>
        {t("upload")}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={disabled || loading || images.length >= 2}
          onChange={(e) => {
            void receive([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </label>
      <div className="canvas-reference-images">
        {images.map((image, index) => (
          <figure key={index}>
            <img src={image} alt={t("references")} />
            <button
              type="button"
              disabled={disabled || loading}
              aria-label={`${t("removeReference")} ${index + 1}`}
              onClick={() => onImages(images.filter((_, i) => i !== index))}
            >
              {t("removeReference")}
            </button>
          </figure>
        ))}
      </div>
      <small>{t("evidence")}</small>
    </div>
  );
}
