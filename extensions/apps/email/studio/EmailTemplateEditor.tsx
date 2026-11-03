/** One template type and content language at a time, using the installed email app's defaults and overrides. */
import { ContentLanguage } from "../../../../frontend/src/shared/i18n/ContentLanguage";
import ContentLanguagePicker from "../../../../frontend/src/shared/i18n/ContentLanguagePicker";
import { useEmailText } from "./email-i18n";
export default function EmailTemplateEditor({
  status,
  settings,
  manage,
  busy,
  language,
  onLanguageChange,
  kind,
  onKindChange,
  change,
}: {
  status: any;
  settings: any;
  manage: boolean;
  busy: boolean;
  language: string;
  onLanguageChange: (language: string) => void;
  kind: "order" | "instructions";
  onKindChange: (kind: "order" | "instructions") => void;
  change: (key: string, value: unknown) => void;
}) {
  const { e } = useEmailText();
  const key = kind === "order" ? "templates" : "paymentTemplates";
  const defaults =
    kind === "order" ? status.defaultTemplates : status.defaultPaymentTemplates;
  const template = { ...defaults?.[language], ...settings[key]?.[language] };
  const edit = (field: string, value: string) =>
    change(key, {
      ...settings[key],
      [language]: { ...template, [field]: value },
    });
  return (
    <section>
      <h3>{e("templateLibrary")}</h3>
      <label>
        {e("templateKind")}
        <select
          value={kind}
          disabled={busy}
          onChange={(event) =>
            onKindChange(event.target.value as "order" | "instructions")
          }
        >
          <option value="order">{e("orderTemplate")}</option>
          <option value="instructions">{e("paymentTemplate")}</option>
        </select>
      </label>
      <ContentLanguage
        locales={Object.keys(defaults ?? settings[key] ?? {})}
        mainLocale={settings.locale ?? "en"}
        language={language}
        onLanguageChange={onLanguageChange}
      >
        <ContentLanguagePicker />
      </ContentLanguage>
      <p>{e("variables")}</p>
      <p>{e("paymentVariables")}</p>
      {["subject", "text", "html"].map((field) => (
        <label key={field}>
          {e(field)}
          {field === "subject" ? (
            <input
              disabled={!manage || busy}
              value={template[field] ?? ""}
              onChange={(event) => edit(field, event.target.value)}
            />
          ) : (
            <textarea
              rows={field === "text" ? 4 : 2}
              disabled={!manage || busy}
              value={template[field] ?? ""}
              onChange={(event) => edit(field, event.target.value)}
            />
          )}
        </label>
      ))}
    </section>
  );
}
