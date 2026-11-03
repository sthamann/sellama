/** On-demand, self-hosted model-viewer with bounded native GLB sources, accessible controls and recoverable loading. */
import { createElement, useEffect, useRef, useState } from "react";
import { modelSource } from "./model-source";
import { browserSessionScope } from "../api/browser-session";
import Icon from "../ui/Icon";
import { useModelText, useModelA11y } from "./model-i18n";
import "./model-viewer.css";
type Viewer = HTMLElement & {
  availableVariants: string[];
  cameraOrbit: string;
  jumpCameraToGoal(): void;
};
let loading: Promise<unknown> | undefined;
export default function ModelViewer({
  url,
  alt,
  variant,
  onVariants,
  initialOpen = false,
  onOpenChange,
}: {
  url: string;
  alt: string;
  variant?: string | null;
  onVariants?: (names: string[]) => void;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useModelText(),
    a11y = useModelA11y();
  const [open, setOpen] = useState(initialOpen),
    [ready, setReady] = useState(false),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [source, setSource] = useState(url);
  const identity = browserSessionScope();
  const ref = useRef<Viewer | null>(null),
    callback = useRef(onVariants);
  callback.current = onVariants;
  useEffect(() => {
    if (!open) return;
    let active = true;
    const controller = new AbortController();
    let release = () => {};
    setReady(false);
    setLoaded(false);
    setFailed(false);
    loading ??= import("@google/model-viewer").catch((error) => {
      loading = undefined;
      throw error;
    });
    const sourcePromise = modelSource(url, controller.signal).then((result) => {
      release = result.release;
      if (!active) release();
      return result;
    });
    Promise.all([loading, sourcePromise])
      .then(([, result]) => {
        if (active) {
          setSource(result.url);
          setReady(true);
        } else release();
      })
      .catch(() => {
        const report = active;
        active = false;
        controller.abort();
        release();
        if (report) setFailed(true);
      });
    return () => {
      active = false;
      controller.abort();
      release();
    };
  }, [open, url, attempt, identity]);
  useEffect(() => {
    const model = ref.current;
    if (!ready || !model) return;
    let finished = false;
    const load = () => {
      finished = true;
      setLoaded(true);
      callback.current?.(model.availableVariants ?? []);
    };
    const fail = () => setFailed(true);
    model.addEventListener("load", load);
    model.addEventListener("error", fail);
    const timer = window.setTimeout(() => {
      if (!finished) setFailed(true);
    }, 45000);
    return () => {
      model.removeEventListener("load", load);
      model.removeEventListener("error", fail);
      clearTimeout(timer);
    };
  }, [ready, url, attempt]);
  return (
    <div className="product-model-viewer">
      {!open ? (
        <button
          type="button"
          className="model-launch"
          onClick={() => {
            setOpen(true);
            onOpenChange?.(true);
          }}
        >
          <Icon name="box" size={48} />
          <strong>{t("open")}</strong>
          <span>{alt}</span>
        </button>
      ) : (
        <>
          {failed ? (
            <div className="model-message" role="alert">
              <p>{t("error")}</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)}>
                {t("retry")}
              </button>
            </div>
          ) : (
            <>
              {!loaded && (
                <p className="model-message" role="status">
                  {t("loading")}
                </p>
              )}
              {ready &&
                createElement("model-viewer", {
                  key: `${url}:${attempt}`,
                  ref,
                  src: source,
                  alt,
                  a11y,
                  "camera-controls": true,
                  "touch-action": "pan-y",
                  "interaction-prompt": "none",
                  "environment-image": "neutral",
                  "variant-name": variant || undefined,
                  exposure: 1,
                  "shadow-intensity": 0.7,
                })}
            </>
          )}
          <div className="model-toolbar">
            <span>{loaded && !failed ? t("ready") : t("model")}</span>
            <button
              type="button"
              disabled={!loaded || failed}
              onClick={() => {
                if (ref.current) {
                  ref.current.cameraOrbit = "0deg 75deg 105%";
                  ref.current.jumpCameraToGoal();
                }
              }}
            >
              {t("reset")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenChange?.(false);
              }}
            >
              {t("close")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
