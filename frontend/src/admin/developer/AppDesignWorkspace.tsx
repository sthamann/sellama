/** One Manifest drives the shared scene overview, direct editor, contextual agent and proposal comparison. */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGridAccess } from "../../shared/grid/useGridAccess";
import { useAppPanelSizing, AppPanelHandle } from "./AppPanelSizing";
import { useAppWorkspaceText } from "../../shared/i18n/app-workspace-i18n";
import { useAppStudioText } from "../../shared/i18n/app-studio-i18n";
import { useCanvasText } from "../../shared/canvas/canvas-i18n";
import Icon from "../../shared/ui/Icon";
import type { NativeView } from "../../shared/apps/native/types";
import type { RequestFn } from "../shell/studio-types";
import type { AppStudio } from "./useAppStudio";
import type { useAppPreview } from "./useAppPreview";
import AppViewTabs from "./AppViewTabs";
import AppCanvas from "./AppCanvas";
import AppInspector from "./AppInspector";
import AppLogicEditor from "./AppLogicEditor";
import AppPlacementOverview, { AppScenePreview } from "./AppPlacementOverview";
import SandboxPreview from "./SandboxPreview";
import "../styles/app-canvas-workspace.css";
import "../styles/app-canvas-responsive.css";
export default function AppDesignWorkspace({
  studio,
  immediate,
  view,
  selected,
  onSelect,
  onView,
  preview,
  request,
  onLanguages,
  onEditFields,
  onSettings,
  agent,
  agentOpen,
  onAgent,
  onAgentClose,
  comparison,
  onComparison,
}: {
  studio: AppStudio;
  immediate: ReturnType<typeof useAppPreview>;
  view?: NativeView;
  selected: string;
  onSelect: (id: string) => void;
  onView: (id: string) => void;
  preview: boolean;
  request: RequestFn;
  onLanguages: (main: string, locales: string[]) => void;
  onEditFields: () => void;
  onSettings?: () => void;
  agent?: ReactNode;
  agentOpen?: boolean;
  onAgent?: () => void;
  onAgentClose?: () => void;
  comparison?: boolean;
  onComparison?: (value: boolean) => void;
}) {
  const rights = useGridAccess(request),
    panels = useAppPanelSizing(),
    w = useAppWorkspaceText(),
    { a } = useAppStudioText(),
    t = useCanvasText(),
    m = studio.manifest;
  const [overview, setOverview] = useState(true),
    [tools, setTools] = useState(false),
    [properties, setProperties] = useState(false),
    [code, setCode] = useState(""),
    [sceneId, setSceneId] = useState("");
  useEffect(() => {
    setOverview(true);
    setCode("");
    setProperties(false);
    setSceneId("");
  }, [m.id]);
  const agentDock = useRef<HTMLDivElement>(null),
    inspectorDock = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (inspectorDock.current) inspectorDock.current.scrollTop = 0;
  }, [selected, view?.id, properties]);
  useEffect(() => {
    if (agentOpen) {
      agentDock.current
        ?.querySelector<HTMLTextAreaElement>("textarea")
        ?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:750px)").matches)
        agentDock.current?.scrollIntoView({ block: "start" });
    }
  }, [agentOpen]);
  const candidate =
    studio.proposal?.base === JSON.stringify(m) &&
    studio.proposal.build.environment === studio.env
      ? studio.proposal.build.manifest
      : undefined;
  const comparing = !!comparison && !!candidate;
  const target = comparing ? candidate : m;
  const choose = (id: string) => {
    setSceneId(id);
    onView(id);
    onSelect("");
    setOverview(false);
  };
  const displayId =
    target.views?.find((v) => v.id === (sceneId || view?.id))?.id ??
    target.views?.[0]?.id ??
    "";
  const selectedBlock = view?.blocks.find((b) => b.id === selected);
  const editingCode = view?.blocks.find((b) => b.id === code);
  return (
    <div className="app-visual-workspace">
      <div className="visual-workspace-toolbar">
        <button
          type="button"
          title={t("overview")}
          aria-pressed={overview}
          onClick={() => setOverview(!overview)}
        >
          <Icon name="layers" size={16} />
          {t("overview")}
        </button>
        {!overview && (
          <button
            type="button"
            title={t("tools")}
            aria-pressed={tools}
            disabled={comparing}
            onClick={() => setTools(!tools)}
          >
            <Icon name="plus" size={16} />
            {t("tools")}
          </button>
        )}
        {!overview && (
          <button
            type="button"
            title={t("properties")}
            aria-pressed={properties && !agentOpen}
            disabled={comparing}
            onClick={() => {
              onAgentClose?.();
              setProperties(!properties);
            }}
          >
            <Icon name="settings" size={16} />
            {t("properties")}
          </button>
        )}
        {onAgent && (
          <button
            type="button"
            title={t("agent")}
            aria-pressed={!!agentOpen}
            onClick={() => (agentOpen ? onAgentClose?.() : onAgent())}
          >
            <Icon name="spark" size={16} />
            {t("agent")}
          </button>
        )}
        <button type="button" title={t("fields")} onClick={onEditFields}>
          <Icon name="database" size={16} />
          {t("fields")}
        </button>
        {onSettings && (
          <button type="button" title={t("settings")} onClick={onSettings}>
            <Icon name="settings" size={16} />
            {t("settings")}
          </button>
        )}
        {candidate && (
          <button
            type="button"
            aria-pressed={comparing}
            onClick={() => onComparison?.(!comparing)}
          >
            {t(comparing ? "before" : "after")}
          </button>
        )}
      </div>
      {comparing && (
        <p role="status" className="app-canvas-comparison">
          {t("comparison")}
        </p>
      )}
      <div
        className={`app-canvas-layout ${agentOpen || (properties && !overview && !comparing) ? "with-inspector" : ""}`}
        style={panels.style}
      >
        <section className="app-canvas-main">
          {overview ? (
            <AppPlacementOverview
              manifest={target}
              mainLocale={studio.mainLocale}
              selected={displayId}
              onOpen={choose}
            />
          ) : (
            <>
              <AppViewTabs
                manifest={target}
                selected={displayId}
                mainLocale={studio.mainLocale}
                onSelect={choose}
                onChange={studio.edit}
                readOnly={comparing}
              />
              <p className="app-design-guidance">{w("designHint")}</p>
              {view ? (
                comparing ? (
                  <AppScenePreview
                    manifest={target}
                    viewId={displayId}
                    mainLocale={studio.mainLocale}
                  />
                ) : preview && immediate.active && immediate.result ? (
                  <SandboxPreview
                    key={immediate.result.digest}
                    app={immediate.result.app}
                    version={immediate.result.version}
                    view={
                      m.surfaces?.find((s) => s.uiPath === `native/${view.id}`)
                        ?.id ?? view.id
                    }
                    request={request}
                    onLanguages={onLanguages}
                  />
                ) : (
                  <AppCanvas
                    manifest={m}
                    view={view}
                    selected={selected}
                    onSelect={(id) => {
                      onSelect(id);
                      if (id && !agentOpen) setProperties(true);
                    }}
                    onChange={studio.edit}
                    mainLocale={studio.mainLocale}
                    preview={false}
                    previewRequest={request}
                    paletteWidth={panels.widths.palette}
                    onResizePalette={(n) => panels.resize("palette", n)}
                    toolsVisible={tools}
                    onEditFields={onEditFields}
                    onCode={setCode}
                    onProperties={() => {
                      onAgentClose?.();
                      setProperties(true);
                    }}
                  />
                )
              ) : (
                <p>{a("select")}</p>
              )}
            </>
          )}
        </section>
        <div className="app-canvas-agent" ref={agentDock} hidden={!agentOpen}>
          {agent}
        </div>
        {!overview && properties && !agentOpen && view && !comparing && (
          <aside className="app-canvas-properties" ref={inspectorDock}>
            <div className="visual-workspace-toolbar">
              <strong>
                {selectedBlock ? a(selectedBlock.kind) : t("properties")}
              </strong>
              <button
                type="button"
                aria-label={t("close")}
                onClick={() => setProperties(false)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            {selectedBlock && (
              <div className="app-context-shortcuts">
                {[
                  "button",
                  "textbox",
                  "combobox",
                  "checkbox",
                  "datepicker",
                ].includes(selectedBlock.kind) && (
                  <button
                    type="button"
                    onClick={() => setCode(selectedBlock.id)}
                  >
                    <Icon name="graph" size={16} />
                    {t("behavior")} ·{" "}
                    {selectedBlock.handlers?.[
                      selectedBlock.kind === "button" ? "click" : "change"
                    ]?.length ?? 0}
                  </button>
                )}
                {selectedBlock.entity && (
                  <button
                    type="button"
                    title={t("fields")}
                    onClick={onEditFields}
                  >
                    {t("fields")} · {selectedBlock.entity}
                  </button>
                )}
              </div>
            )}
            <AppPanelHandle
              side="inspector"
              value={panels.widths.inspector}
              onChange={(n) => panels.resize("inspector", n)}
            />
            <AppInspector
              request={request}
              canGenerate={rights.includes("assistant.use")}
              manifest={m}
              view={view}
              selected={selected}
              onChange={studio.edit}
            />
          </aside>
        )}
      </div>
      {editingCode && view && (
        <AppLogicEditor
          key={`${view.id}:${editingCode.id}`}
          block={editingCode}
          manifest={m}
          view={view}
          onClose={() => setCode("")}
          onChange={(block) =>
            studio.edit({
              ...m,
              views: m.views?.map((v) =>
                v.id === view.id
                  ? {
                      ...v,
                      blocks: v.blocks.map((b) =>
                        b.id === block.id ? block : b,
                      ),
                    }
                  : v,
              ),
            })
          }
        />
      )}
    </div>
  );
}
