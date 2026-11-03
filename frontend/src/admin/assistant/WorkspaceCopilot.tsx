/** Contextual drawer reuses the existing scoped conversation, permissions and proposal execution without unmounting editors. */
import { useEffect } from "react";
import { useExperienceUIText } from "../../shared/i18n/experience-ui-i18n";
import { surfaceLabel } from "../../shared/apps/AppSurfaces";
import Icon from "../../shared/ui/Icon";
import { useStudio } from "../shell/StudioContext";
import StudioConversation from "../shell/StudioConversation";
import "../styles/workspace-copilot.css";
export default function WorkspaceCopilot({ onClose }: { onClose: () => void }) {
  const { u } = useExperienceUIText();
  const {
    t,
    error,
    setError,
    workspaceName,
    environment,
    environments,
    tab,
    tabLabel,
    entityTarget,
    setDraft,
    composer,
    busy,
    setSettings,
    sessionExpired,
    appSurface,
    locale,
  } = useStudio();
  useEffect(() => {
    if (sessionExpired) onClose();
  }, [sessionExpired, onClose]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        onClose();
        document.querySelector<HTMLButtonElement>(".copilot-launch")?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  const contextName = environment
    ? (environments.find((entry) => entry.id === environment)?.name ??
      environment)
    : workspaceName;
  const area = appSurface ? surfaceLabel(appSurface, locale) : tabLabel(tab);
  const choose = (task: "readPrompt" | "improvePrompt" | "planPrompt") => {
    setDraft(
      u("contextPrompt", {
        workspace: contextName,
        area,
        entity: entityTarget ? u("entity", { id: entityTarget.id }) : "",
        task: u(task),
      }),
    );
    requestAnimationFrame(() => composer.current?.focus());
  };
  return (
    <aside
      id="workspace-copilot"
      className="workspace-copilot"
      aria-labelledby="copilot-title"
    >
      <header className="copilot-header">
        <div>
          <span className="copilot-mark">
            <Icon name="spark" />
          </span>
          <h2 id="copilot-title">{u("copilot")}</h2>
        </div>
        <button
          className="icon-button"
          aria-label={t("close")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      {error && (
        <div className="studio-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setError("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <div className="copilot-context">
        <small>{u("context")}</small>
        <strong>
          {contextName} / {area}
        </strong>
        {entityTarget && <span>{entityTarget.id}</span>}
        <details className="copilot-guidance">
          <summary>{u("copilotHint")}</summary>
          <div className="copilot-tasks">
            {(
              [
                ["readTask", "readPrompt"],
                ["improveTask", "improvePrompt"],
                ["planTask", "planPrompt"],
              ] as const
            ).map(([label, task]) => (
              <button key={task} disabled={busy} onClick={() => choose(task)}>
                {u(label)}
                <Icon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </details>
      </div>
      <StudioConversation
        compact
        onProviderSettings={() => {
          onClose();
          setSettings(true);
        }}
      />
    </aside>
  );
}
