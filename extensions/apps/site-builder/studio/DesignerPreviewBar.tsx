/** Stable preview navigation shares the current editor history across overview and page modes. */
import { useCanvasText } from "../../../../frontend/src/shared/canvas/canvas-i18n";
import Icon from "../../../../frontend/src/shared/ui/Icon";
import { PlacementStatus } from "./EditableSection";
import { useDesignText } from "./design-i18n";
import { useOverviewText } from "./overview-i18n";
import type { Designer } from "./useDesigner";

export default function DesignerPreviewBar({
  d,
  writable,
  overview,
  showPages,
  device,
  onDevice,
  onOverview,
  onPages,
  toolsOpen,
  onTools,
}: {
  toolsOpen?: boolean;
  onTools?: () => void;
  d: Designer;
  writable: boolean;
  overview: boolean;
  showPages: boolean;
  device: "desktop" | "tablet" | "mobile";
  onDevice: (device: "desktop" | "tablet" | "mobile") => void;
  onOverview: () => void;
  onPages: () => void;
}) {
  const cv = useCanvasText();
  const t = useDesignText(),
    o = useOverviewText();
  return (
    <div className="designer-preview-bar">
      <button type="button" aria-pressed={overview} onClick={onOverview}>
        {o("overview")}
      </button>
      <button
        type="button"
        aria-expanded={showPages && !overview}
        onClick={onPages}
      >
        <Icon name="menu" size={16} />
        {t("pagesToggle")}
      </button>
      <div role="group" aria-label={t("preview")}>
        {(["desktop", "tablet", "mobile"] as const).map((kind) => (
          <button
            type="button"
            key={kind}
            aria-pressed={device === kind}
            onClick={() => onDevice(kind)}
          >
            {t(kind)}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={t("undo")}
        disabled={!writable || !d.canUndo}
        onClick={d.undo}
      >
        ↶
      </button>
      <button
        type="button"
        aria-label={t("redo")}
        disabled={!writable || !d.canRedo}
        onClick={d.redo}
      >
        ↷
      </button>
      {!overview && (
        <button type="button" aria-expanded={toolsOpen} onClick={onTools}>
          <Icon name="settings" size={16} />
          {toolsOpen ? cv("close") : cv("properties")}
        </button>
      )}
      <PlacementStatus page={d.draft} />
    </div>
  );
}
