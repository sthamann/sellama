/** Consistent navigation between visual definitions, provider contracts and immutable versions. */
import Icon, { type IconName } from "../../shared/ui/Icon";
import {
  useAppStudioText,
  type AppStudioKey,
} from "../../shared/i18n/app-studio-i18n";
export default function AppEditorNavigation({
  section,
  onSelect,
  versions,
  payments = false,
  compact = false,
}: {
  section: AppStudioKey;
  onSelect: (s: AppStudioKey) => void;
  versions: number;
  payments?: boolean;
  compact?: boolean;
}) {
  const { a } = useAppStudioText();
  const tabs = [
    "capability",
    "design",
    "data",
    "connect",
    "settings",
    "payments",
    "agent",
    "versions",
  ] as const;
  const icons: Record<(typeof tabs)[number], IconName> = {
    capability: "spark",
    design: "palette",
    data: "database",
    connect: "graph",
    settings: "settings",
    payments: "card",
    agent: "code",
    versions: "history",
  };
  if (compact)
    return (
      <select
        aria-label={a("studio")}
        value={section}
        onChange={(e) => onSelect(e.target.value as AppStudioKey)}
      >
        {tabs
          .filter((key) => key !== "payments" || payments)
          .map((key) => (
            <option key={key} value={key}>
              {a(key)}
              {key === "versions" ? ` (${versions})` : ""}
            </option>
          ))}
      </select>
    );
  return (
    <nav className="app-studio-tabs" aria-label={a("studio")}>
      {tabs
        .filter((key) => key !== "payments" || payments)
        .map((key) => (
          <button
            key={key}
            aria-current={section === key ? "page" : undefined}
            className={section === key ? "active" : ""}
            onClick={() => onSelect(key)}
          >
            <Icon name={icons[key]} size={17} />
            {a(key)}
            {key === "versions" && <span>{versions}</span>}
          </button>
        ))}
      <span className="app-tabs-caption">{a("pending")}</span>
    </nav>
  );
}
