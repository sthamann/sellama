/** App scenes project one current Manifest using the native design renderer, without record reads or executable actions. */
import VisualCanvas from "../../shared/canvas/VisualCanvas";
import { contentText } from "../../shared/i18n/content-language";
import { useContentLanguage } from "../../shared/i18n/ContentLanguage";
import { useCanvasText } from "../../shared/canvas/canvas-i18n";
import { useAppStudioText } from "../../shared/i18n/app-studio-i18n";
import { placements } from "./assistant-model";
import { useAssistantText } from "../../shared/i18n/app-assistant-i18n";
import type { Manifest } from "../../shared/apps/native/types";
import { geometryStyle } from "../../shared/apps/native/geometry";
import AppDesignPreview from "./AppDesignPreview";
export function AppScenePreview({
  manifest,
  viewId,
  mainLocale,
}: {
  manifest: Manifest;
  viewId: string;
  mainLocale: string;
}) {
  const { a } = useAppStudioText();
  const view = manifest.views?.find((v) => v.id === viewId);
  if (!view) return <p>{a("select")}</p>;
  return (
    <div className="app-scene-preview">
      <small className="app-scene-sample">{a("sample")}</small>
      <div className={`app-scene-layout app-scene-${view.layout}`}>
        {view.blocks.map((b, index) => (
          <div
            key={b.id}
            className="app-scene-block"
            style={view.layout === "form" ? geometryStyle(b, index) : undefined}
          >
            <AppDesignPreview
              block={b}
              entities={manifest.entities}
              mainLocale={mainLocale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
export default function AppPlacementOverview({
  manifest,
  mainLocale,
  selected,
  onOpen,
}: {
  manifest: Manifest;
  mainLocale: string;
  selected?: string;
  onOpen: (view: string) => void;
}) {
  const { language } = useContentLanguage(),
    t = useCanvasText(),
    { t: a } = useAssistantText();
  const scenes = (manifest.views ?? []).map((view) => {
    const surfaces =
      manifest.surfaces?.filter((s) => s.uiPath === `native/${view.id}`) ?? [];
    return {
      id: view.id,
      detail: contentText(surfaces[0]?.label ?? {}, language, mainLocale),
      title:
        surfaces
          .map((s) =>
            placements[s.location] ? a(placements[s.location]) : s.location,
          )
          .join(" · ") || view.id,
      preview: (
        <AppScenePreview
          manifest={manifest}
          viewId={view.id}
          mainLocale={mainLocale}
        />
      ),
      onOpen: () => onOpen(view.id),
    };
  });
  return scenes.length ? (
    <VisualCanvas scenes={scenes} selected={selected} />
  ) : (
    <p>{t("noViews")}</p>
  );
}
