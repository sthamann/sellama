/** Shared overview owns only bounded preview mounting, zoom and pointer/keyboard navigation; adapters own every edit. */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Icon from "../ui/Icon";
import { useCanvasText } from "./canvas-i18n";
import "./canvas.css";
export type CanvasScene = {
  id: string;
  title: string;
  detail?: string;
  badge?: string;
  disabled?: boolean;
  actionLabel?: string;
  preview: ReactNode;
  onOpen: () => void;
};
export default function VisualCanvas({
  scenes,
  selected,
  label,
  children,
}: {
  scenes: CanvasScene[];
  selected?: string;
  label?: string;
  children?: ReactNode;
}) {
  const t = useCanvasText();
  const [zoom, setZoom] = useState(1),
    [start, setStart] = useState(0);
  const [choice, setChoice] = useState(selected ?? "");
  const viewport = useRef<HTMLDivElement>(null);
  const pan = useRef<
    { x: number; y: number; left: number; top: number } | undefined
  >(undefined);
  const offset = Math.min(
    start,
    Math.max(0, Math.ceil(scenes.length / 4) - 1) * 4,
  );
  const current = scenes.slice(offset, offset + 4);
  const chosen =
    current.find((scene) => scene.id === choice) ??
    current.find((scene) => scene.id === selected) ??
    current[0];
  const scale = (value: number) =>
    setZoom(Math.max(0.35, Math.min(1.5, Math.round(value * 100) / 100)));
  const fit = () => {
    const el = viewport.current;
    if (!el) return;
    scale(
      Math.min(
        (el.clientWidth - 48) / (current.length * 384 - 24),
        (el.clientHeight - 48) / 680,
        1,
      ),
    );
    el.scrollTo?.(0, 0);
  };
  useLayoutEffect(() => {
    fit();
  }, [offset, current.length]);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((z) =>
        Math.max(0.35, Math.min(1.5, z - Math.sign(event.deltaY) * 0.05)),
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  return (
    <section className="visual-canvas" aria-label={label ?? t("overview")}>
      <div className="visual-canvas-toolbar">
        <div className="visual-canvas-zoom">
          <button
            type="button"
            onClick={() => scale(zoom - 0.1)}
            aria-label={t("zoom") + " −"}
          >
            <Icon name="minus" size={16} />
          </button>
          <label>
            {t("zoom")}
            <input
              type="range"
              min="35"
              max="150"
              step="1"
              value={Math.round(zoom * 100)}
              onChange={(e) => scale(Number(e.target.value) / 100)}
            />
          </label>
          <output>{Math.round(zoom * 100)}%</output>
          <button
            type="button"
            onClick={() => scale(zoom + 0.1)}
            aria-label={t("zoom") + " +"}
          >
            <Icon name="plus" size={16} />
          </button>
          <button type="button" onClick={fit}>
            {t("fit")}
          </button>
        </div>
        {scenes.length > 4 && (
          <div className="visual-canvas-paging">
            <button
              type="button"
              disabled={!offset}
              onClick={() => setStart(offset - 4)}
              aria-label={t("previous")}
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span>
              {offset + 1}–{Math.min(offset + 4, scenes.length)} /{" "}
              {scenes.length}
            </span>
            <button
              type="button"
              disabled={offset + 4 >= scenes.length}
              onClick={() => setStart(offset + 4)}
              aria-label={t("next")}
            >
              <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
        {chosen && (
          <div className="visual-canvas-quick-open">
            <select
              aria-label={t("chooseView")}
              value={chosen.id}
              onChange={(e) => setChoice(e.target.value)}
            >
              {current.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={chosen.disabled}
              onClick={chosen.onOpen}
            >
              {chosen.actionLabel ?? t("edit")}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
      <div
        className="visual-canvas-viewport"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label={t("pan")}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            scale(zoom + 0.1);
          }
          if (e.key === "-") {
            e.preventDefault();
            scale(zoom - 0.1);
          }
          if (e.key === "0") {
            e.preventDefault();
            fit();
          }
        }}
        onPointerDown={(e) => {
          if (
            e.button !== 0 ||
            (e.target as Element).closest("article,button,input,select,a")
          )
            return;
          pan.current = {
            x: e.clientX,
            y: e.clientY,
            left: e.currentTarget.scrollLeft,
            top: e.currentTarget.scrollTop,
          };
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = pan.current;
          if (p) {
            e.currentTarget.scrollLeft = p.left - e.clientX + p.x;
            e.currentTarget.scrollTop = p.top - e.clientY + p.y;
          }
        }}
        onPointerUp={(e) => {
          pan.current = undefined;
          if (e.currentTarget.hasPointerCapture?.(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          pan.current = undefined;
        }}
      >
        <div className="visual-canvas-board" style={{ zoom }}>
          {current.map((scene) => (
            <article
              className="visual-canvas-scene"
              key={scene.id}
              aria-current={scene.id === selected ? "true" : undefined}
            >
              <header>
                <div>
                  <h3>{scene.title}</h3>
                  {scene.detail && <p>{scene.detail}</p>}
                </div>
                {scene.badge && <small>{scene.badge}</small>}
              </header>
              <button
                type="button"
                className="visual-canvas-open"
                disabled={scene.disabled}
                onClick={scene.onOpen}
                aria-label={`${t("open")}: ${scene.title}`}
              >
                {scene.actionLabel ?? t("edit")}
                <Icon name="arrow" size={16} />
              </button>
              <div className="visual-canvas-scene-preview">{scene.preview}</div>
            </article>
          ))}
        </div>
      </div>
      <p className="visual-canvas-hint">{t("pan")}</p>
    </section>
  );
}
