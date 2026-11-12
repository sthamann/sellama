/** Studio composition root: layout, scoped controller and modular workspace views. */
import { SetupProvider } from "../setup/SetupProvider";
import SetupBanner from "../setup/SetupBanner";
import WorkspacePinBridge from "../workspace/WorkspacePinBridge";
import { Suspense } from "react";

import { AppSurfaceProvider } from "../../shared/apps/AppSurfaces";
import "../../shared/styles/workbench.css";
import Icon from "../../shared/ui/Icon";
import WorkspaceBoundary from "../../shared/ui/WorkspaceBoundary";
import SettingsDialog from "../assistant/SettingsDialog";
import PreviewDialog from "../preview/PreviewDialog";
import "../styles/operations.css";
import "../styles/studio.css";
import "../styles/forms.css";
import "../styles/workspace-polish.css";
import "../styles/assistant-layout.css";
import { PreviewPanel } from "../preview/PreviewPanel";

import { StudioContext } from "./StudioContext";
import WorkspaceCopilot from "../assistant/WorkspaceCopilot";
import "../styles/workspace-copilot.css";
import StudioHeader from "./StudioHeader";
import StudioSignIn from "./StudioSignIn";
import { useB2BNavigation } from "./useB2BNavigation";
import StudioRoutes from "./StudioRoutes";
import StudioSidebar from "./StudioSidebar";
import { useStudioController } from "./useStudioController";
export default function Merchant(props: {
  onChanged: () => Promise<void>;
  onExit: () => void;
}) {
  const controller = useStudioController(props);
  const {
    request,
    workspace,
    environment,
    theme,
    t,
    menu,
    setMenu,
    w,
    environments,
    appSurface,
    tab,
    error,
    notice,
    setError,
    setNotice,
    selected,
    connected,
    sessionExpired,
    selectTab,
    intent,
    serverReady,
    x,
    updated,
    date,
    previewOpen,
    setPreviewOpen,
    settings,
    run,
    providers,
    provider,
    model,
    setProvider,
    setModel,
    setSettings,
    busy,
    refresh,
  } = controller;
  const b2bFeatures = useB2BNavigation(
    request,
    connected && controller.access.includes("b2b.read"),
  );
  if (!controller.auth.identity)
    return <StudioSignIn auth={controller.auth} onExit={props.onExit} />;
  return (
    <StudioContext.Provider value={{ ...controller, b2bFeatures }}>
      <WorkspacePinBridge />
      <AppSurfaceProvider
        request={request}
        scopeKey={`${workspace}:${environment}:${controller.auth.identity.user.id}`}
      >
        <SetupProvider key={`${workspace}:${controller.auth.identity.user.id}`}>
          <div className="studio" data-theme={theme} inert={sessionExpired}>
            <a className="studio-skip" href="#studio-content">
              {t("assistant")}
            </a>
            <StudioSidebar />
            {menu && (
              <button
                className="sidebar-scrim"
                aria-label={t("close")}
                onClick={() => setMenu(false)}
              />
            )}
            <div className="studio-shell">
              <StudioHeader />
              <SetupBanner />
              {environment && (
                <div className="sandbox-banner">
                  <span>
                    {w("stage")} ·{" "}
                    {environments.find((e) => e.id === environment)?.name}
                  </span>
                  <a
                    href={`/?shop=${environment}&sandbox=1#`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {w("preview")} ↗
                  </a>
                </div>
              )}
              <div
                className={`studio-body ${controller.copilot.open && (tab !== "assistant" || appSurface) ? "has-copilot" : ""}`}
              >
                <main
                  id="studio-content"
                  className={`studio-main view-${appSurface ? "app" : tab} ${!appSurface && ["assistant", "overview"].includes(tab) ? (selected ? "has-context" : "") : "is-workspace"}`}
                >
                  <div className="studio-content">
                    {(error || notice) && (
                      <div
                        className={`studio-notice ${error ? "is-error" : ""}`}
                        role={error ? "alert" : "status"}
                      >
                        <div>
                          {error ? (
                            <>
                              <b>
                                {t(
                                  sessionExpired ? "sessionExpired" : "failure",
                                )}
                              </b>
                              {sessionExpired && (
                                <button
                                  className="studio-primary"
                                  onClick={() => selectTab("users")}
                                >
                                  {x("studioSignIn")}
                                </button>
                              )}
                              <p>{error}</p>
                            </>
                          ) : (
                            t(
                              notice!.key,
                              notice?.count != null
                                ? { count: notice.count }
                                : {},
                            )
                          )}
                        </div>
                        <button
                          className="icon-button"
                          aria-label={t("close")}
                          onClick={() => {
                            setError("");
                            setNotice(undefined);
                          }}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    )}
                    <WorkspaceBoundary
                      key={`${workspace}:${environment}:${tab}:${appSurface?.surface.id ?? ""}:${controller.access.join(",")}`}
                      title={t("failure")}
                      retryLabel={t("refresh")}
                      onRetry={() => window.location.reload()}
                    >
                      <Suspense fallback={<p role="status">…</p>}>
                        <StudioRoutes />
                      </Suspense>
                    </WorkspaceBoundary>
                  </div>
                  {!appSurface &&
                    selected &&
                    ["assistant", "overview"].includes(tab) && (
                      <PreviewPanel
                        product={selected}
                        request={request}
                        connected={connected}
                        onIntent={intent}
                      />
                    )}
                </main>
                {controller.copilot.open &&
                  (tab !== "assistant" || appSurface) && (
                    <WorkspaceCopilot onClose={controller.copilot.hide} />
                  )}
              </div>
              <footer className="studio-statusbar">
                <span>
                  <i className={serverReady ? "on" : ""} />
                  {t("health")} ·{" "}
                  {x(serverReady ? "serverReady" : "serverUnavailable")}
                </span>
                <span>{t("demo")}</span>
                {updated && (
                  <span>
                    {t("lastUpdated")} {date(updated)}
                  </span>
                )}
              </footer>
            </div>
            {previewOpen && (
              <PreviewDialog onClose={() => setPreviewOpen(false)}>
                <PreviewPanel
                  product={selected}
                  request={request}
                  connected={connected}
                  onIntent={(text) => {
                    setPreviewOpen(false);
                    intent(text);
                  }}
                />
              </PreviewDialog>
            )}
            {settings && (
              <SettingsDialog
                connected={connected}
                providers={providers}
                provider={provider}
                model={model}
                onProvider={(s) => {
                  setProvider(s);
                  setModel(providers.find((p) => p.id === s)?.model || "");
                }}
                onModel={setModel}
                onClose={() => setSettings(false)}
                busy={busy}
                onIndex={() =>
                  run(async () => {
                    const v = await request("/api/knowledge/reindex", {});
                    await refresh();
                    setNotice({ key: "indexed", count: v.indexed });
                  })
                }
              />
            )}
          </div>
        </SetupProvider>
      </AppSurfaceProvider>
      {sessionExpired && (
        <StudioSignIn auth={controller.auth} onExit={props.onExit} overlay />
      )}
    </StudioContext.Provider>
  );
}
