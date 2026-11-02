/** The persistent right dock describes the selected native definition and reuses the existing agent proposal pipeline. */
import type { ComponentProps } from "react";
import AppAgentPanel from "./AppAgentPanel";
import { useContentLanguage } from "../../shared/i18n/ContentLanguage";
import { useCanvasText } from "../../shared/canvas/canvas-i18n";
import { contentText } from "../../shared/i18n/content-language";
import { useAssistantText } from "../../shared/i18n/app-assistant-i18n";
import { placements } from "./assistant-model";
import Icon from "../../shared/ui/Icon";
export type AppCanvasContext = {
  view: string;
  selected: string;
  language: string;
  channel: string;
};
export default function AppCanvasAgent({
  view,
  selected,
  onClose,
  ...props
}: ComponentProps<typeof AppAgentPanel> & {
  view: string;
  selected: string;
  onClose: () => void;
}) {
  const { language } = useContentLanguage(),
    t = useCanvasText(),
    { t: a } = useAssistantText();
  const surface = props.studio.manifest.surfaces?.find(
    (s) => s.uiPath === `native/${view}`,
  );
  const context = { view, selected, language, channel: "*" };
  return (
    <>
      <header className="app-canvas-agent-header">
        <strong>{t("agent")}</strong>
        <button type="button" aria-label={t("close")} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <dl className="app-canvas-agent-context">
        <dt>{t("context")}</dt>
        <dd>
          {contentText(
            surface?.label ?? {},
            language,
            props.studio.mainLocale,
          ) || view}
          {selected && ` · ${selected}`}
        </dd>
        <dt>{t("overview")}</dt>
        <dd>
          {surface && placements[surface.location]
            ? a(placements[surface.location])
            : surface?.location}
        </dd>
        <dt>{language}</dt>
        <dd>
          {t("allChannels")} · {props.studio.manifest.version}
        </dd>
      </dl>
      {props.studio.error && (
        <p role="alert" className="studio-notice is-error">
          {props.studio.error}
        </p>
      )}
      <AppAgentPanel
        key={`${props.studio.env}:${props.studio.manifest.id}`}
        {...props}
        context={context}
      />
    </>
  );
}
