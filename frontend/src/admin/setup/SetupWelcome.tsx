/** A short, optional welcome demonstrates the actual setup path before asking for any work. */
import { useStudio } from "../shell/StudioContext";
import { useShopSetup } from "./SetupProvider";
import { useSetupText } from "./setup-i18n";
import { useStepText } from "./step-i18n";
import { newProgress, steps, stepTarget } from "./setup-model";
import Icon from "../../shared/ui/Icon";
export default function SetupWelcome() {
  const { workspaceName, selectTab } = useStudio();
  const guide = useShopSetup(),
    t = useSetupText(),
    text = useStepText();
  return (
    <div className="setup-welcome">
      <div className="setup-welcome-copy">
        <h1>{t("welcome")}</h1>
        <p>{t("welcomeHint")}</p>
        <div className="setup-actions">
          <button
            className="studio-primary"
            disabled={guide.busy}
            onClick={async () => {
              if (await guide.save(newProgress())) selectTab("setup");
            }}
          >
            {t("begin")}
            <Icon name="arrow" size={18} />
          </button>
          <button
            className="studio-secondary"
            disabled={guide.busy}
            onClick={async () => {
              if (await guide.save({ ...newProgress(), state: "dismissed" }))
                selectTab("workspace");
            }}
          >
            {t("later")}
          </button>
        </div>
        <p className="setup-caption">{t("hint")}</p>
      </div>
      <section className="setup-route" aria-label={t("title")}>
        <h2>{workspaceName}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step}>
              <Icon name={stepTarget[step].icon} size={20} />
              <span>{text(step).title}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
