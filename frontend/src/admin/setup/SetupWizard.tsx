/** Guided review links native setup owners and the existing agent without duplicating configuration or publication. */
import { useCallback, useEffect, useRef, useState } from "react";
import SetupBasics from "./SetupBasics";
import { useStudio } from "../shell/StudioContext";
import { canOpenStudio } from "../shell/permissions";
import { useShopSetup } from "./SetupProvider";
import { useSetupText } from "./setup-i18n";
import { useStepText } from "./step-i18n";
import {
  newProgress,
  reviewStep,
  steps,
  stepTarget,
  type SetupStep,
} from "./setup-model";
import { useSetupFacts } from "./useSetupFacts";
import SetupWelcome from "./SetupWelcome";
import Icon from "../../shared/ui/Icon";
import { storefrontURL } from "../../shared/api/shop-scope";
import "./setup.css";
import "./setup-responsive.css";
export default function SetupWizard() {
  const studio = useStudio(),
    guide = useShopSetup(),
    t = useSetupText(),
    text = useStepText();
  const [dirty, setDirty] = useState(false);
  const [factRevision, setFactRevision] = useState(0);
  const onBasicsSaved = useCallback(() => setFactRevision((n) => n + 1), []);
  const { facts, refresh } = useSetupFacts(guide.available, factRevision);
  const progress = guide.progress,
    step = progress?.step ?? "basics",
    copy = text(step);
  const heading = useRef<HTMLHeadingElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  useEffect(() => {
    rail.current
      ?.querySelector<HTMLElement>('[aria-current="step"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: "start" });
  }, [step]);
  const open = (
    tab: Parameters<typeof studio.selectTab>[0],
    settings?: string,
  ) => {
    const url = new URL(location.href);
    url.searchParams.delete("settings");
    if (settings) url.searchParams.set("settings", settings);
    history.replaceState(null, "", url);
    studio.selectTab(tab);
  };
  const agent = () => studio.intent(t("aiPrompt", { step: copy.title }));
  const activate = async () =>
    progress?.state !== "dismissed" ||
    (await guide.save({ ...progress, state: "active" }));
  const primary = async () => {
    if (!(await activate())) return;
    const target = stepTarget[step];
    open(target.tab, target.settings);
  };
  const secondary = async () => {
    if (!(await activate())) return;
    if (step === "basics") open("commerce", "languages");
    else if (step === "products") agent();
    else if (step === "design") open("environments");
    else if (step === "checkout") open("commerce", "payment");
    else if (step === "legal") open("commerce", "masterData");
    else open("orders");
  };
  const secondaryAllowed =
    step === "products"
      ? canOpenStudio("assistant", studio.access)
      : step === "design"
        ? canOpenStudio("environments", studio.access)
        : step === "test"
          ? canOpenStudio("orders", studio.access)
          : studio.access.includes("settings.write");
  const choose = (next: SetupStep) =>
    void guide.save({
      ...(progress ?? newProgress()),
      state: "active",
      step: next,
    });
  if (!guide.available)
    return <p role="alert">{t(studio.environment ? "liveOnly" : "rights")}</p>;
  if (guide.loading)
    return (
      <div className="setup-loading" role="status">
        {t("loading")}
      </div>
    );
  const error = guide.error && (
    <div className="setup-error" role="alert">
      <p>{guide.error}</p>
      <button className="studio-secondary" onClick={guide.reload}>
        {t("retry")}
      </button>
    </div>
  );
  if (!guide.record) return <div className="setup-workspace">{error}</div>;
  if (!progress)
    return (
      <div className="setup-workspace">
        {error}
        <SetupWelcome />
      </div>
    );
  if (progress.state === "complete")
    return (
      <div className="setup-workspace setup-complete">
        {error}
        <Icon name="check" size={38} />
        <h1>{t("done")}</h1>
        <p>{t("doneHint")}</p>
        <p>{t("progress", { done: steps.length, total: steps.length })}</p>
        <div className="setup-actions">
          <button className="studio-primary" onClick={() => open("workspace")}>
            {t("workspace")}
          </button>
          <a
            className="studio-secondary"
            href={storefrontURL(studio.workspace)}
            target="_blank"
            rel="noreferrer"
          >
            {t("preview")}
            <Icon name="arrow" size={16} />
          </a>
        </div>
        <h2>{t("next")}</h2>
        <div className="setup-actions">
          {canOpenStudio("users", studio.access) && (
            <button onClick={() => open("users")}>{t("team")}</button>
          )}
          {canOpenStudio("apps", studio.access) && (
            <button onClick={() => open("apps")}>{t("apps")}</button>
          )}
          <button onClick={() => void guide.save(newProgress())}>
            {t("reset")}
          </button>
        </div>
      </div>
    );
  return (
    <div className="setup-workspace">
      <header className="setup-heading">
        <div>
          <h1>{t("title")}</h1>
          <p>{t("hint")}</p>
        </div>
        <button
          className="studio-secondary"
          disabled={guide.busy || dirty}
          onClick={async () => {
            if (await guide.save({ ...progress, state: "dismissed" }))
              open("workspace");
          }}
        >
          {t("pause")}
        </button>
      </header>
      {error}
      <div className="setup-layout">
        <nav className="setup-steps" aria-label={t("title")}>
          <p>
            {t("progress", {
              done: progress.reviewed.length,
              total: steps.length,
            })}
          </p>
          <progress
            max={steps.length}
            value={progress.reviewed.length}
            aria-label={t("progress", {
              done: progress.reviewed.length,
              total: steps.length,
            })}
          />
          <ol ref={rail}>
            {steps.map((id, index) => (
              <li key={id}>
                <button
                  disabled={guide.busy || dirty}
                  aria-current={step === id ? "step" : undefined}
                  onClick={() => choose(id)}
                >
                  <span className="setup-step-marker">
                    {progress.reviewed.includes(id) ? (
                      <Icon name="check" size={16} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span>
                    {text(id).title}
                    <small>
                      {t(
                        progress.reviewed.includes(id) ? "checked" : "pending",
                      )}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <section className="setup-task" aria-labelledby="setup-step-title">
          <Icon name={stepTarget[step].icon} size={30} />
          <h2 id="setup-step-title" ref={heading} tabIndex={-1}>
            {copy.title}
          </h2>
          <p className="setup-task-hint">{copy.hint}</p>
          <section className="setup-facts" aria-label={t("current")}>
            <h3>{t("current")}</h3>
            {!facts ? (
              <p role="status">{t("loading")}</p>
            ) : facts.failed ? (
              <p role="alert">{t("factsError")}</p>
            ) : (
              <ul>
                {facts.company && (
                  <li>
                    <Icon name="building" size={18} />
                    {t(
                      facts.company.name && facts.company.email
                        ? "companyPresent"
                        : "companyMissing",
                    )}
                  </li>
                )}
                {facts.products !== undefined && (
                  <li>
                    <Icon name="box" size={18} />
                    {t(facts.products ? "hasProducts" : "noProducts")}
                  </li>
                )}
                {facts.commerce && (
                  <li>
                    <Icon name="truck" size={18} />
                    {t("methods", {
                      shipping: (facts.commerce.shipping ?? []).filter(
                        (s) => s.active,
                      ).length,
                      payment: (facts.commerce.payments ?? []).filter(
                        (p) => p.active,
                      ).length,
                    })}
                  </li>
                )}
              </ul>
            )}
            <button className="setup-text-button" onClick={refresh}>
              {t("retry")}
            </button>
          </section>
          {step === "basics" && (
            <SetupBasics onDirty={setDirty} onSaved={onBasicsSaved} />
          )}
          {dirty && (
            <p role="status" className="setup-note">
              {t("dirty")}
            </p>
          )}
          <div className="setup-actions">
            {step === "test" ? (
              <a
                className="studio-primary"
                href={storefrontURL(studio.workspace)}
                target="_blank"
                rel="noreferrer"
              >
                {copy.action}
                <Icon name="arrow" size={18} />
              </a>
            ) : (
              <button
                className="studio-primary"
                disabled={
                  guide.busy ||
                  dirty ||
                  !studio.access.includes(stepTarget[step].right) ||
                  !canOpenStudio(stepTarget[step].tab, studio.access)
                }
                onClick={() => void primary()}
              >
                {copy.action}
                <Icon name="arrow" size={18} />
              </button>
            )}
            <button
              className="studio-secondary"
              disabled={!secondaryAllowed || guide.busy || dirty}
              onClick={() => void secondary()}
            >
              {copy.secondary}
            </button>
          </div>
          {step === "checkout" || step === "test" ? (
            <p className="setup-note">
              <Icon name="card" size={18} />
              {t("simulation")}
            </p>
          ) : null}
          {step === "design" || step === "products" ? (
            <div className="setup-note">
              <Icon name="lock" size={18} />
              <span>
                {t("liveWarning")}
                {canOpenStudio("environments", studio.access) && (
                  <button
                    className="setup-text-button"
                    onClick={() => open("environments")}
                  >
                    {t("sandbox")}
                  </button>
                )}
              </span>
            </div>
          ) : null}
          <footer className="setup-task-footer">
            {step !== "products" &&
              canOpenStudio("assistant", studio.access) && (
                <button
                  className="studio-secondary"
                  disabled={dirty}
                  onClick={agent}
                >
                  <Icon name="spark" size={17} />
                  {t("ai")}
                </button>
              )}
            <button
              className="studio-primary"
              disabled={guide.busy || dirty}
              onClick={() => void guide.save(reviewStep(progress))}
            >
              {t("reviewed")}
              <Icon name="check" size={17} />
            </button>
          </footer>
          <p className="setup-caption" role="status">
            {guide.busy ? t("loading") : t("saved")}
          </p>
        </section>
      </div>
    </div>
  );
}
