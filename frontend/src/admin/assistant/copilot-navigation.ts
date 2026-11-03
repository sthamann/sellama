/** Only registered native destinations survive model/replay admission. Entity editors recheck current server access. */
import { canOpenStudio } from "../shell/permissions";
import type { Tab } from "../shell/navigation";
export type CopilotNavigation = { view: Tab; id?: string | null };
const targets: Tab[] = [
  "productData",
  "orders",
  "customers",
  "overview",
  "knowledge",
  "commerce",
  "channels",
  "design",
  "automation",
  "apps",
  "storyfronts",
  "developers",
  "environments",
  "users",
  "b2b",
  "pos",
];
export function admitNavigation(
  value: unknown,
  rights: string[],
): CopilotNavigation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => k !== "view" && k !== "id") ||
    !targets.includes(v.view as Tab) ||
    !canOpenStudio(v.view as Tab, rights)
  )
    return null;
  if (
    v.id != null &&
    (typeof v.id !== "string" ||
      !v.id.length ||
      v.id.length > 160 ||
      !["productData", "orders", "customers"].includes(String(v.view)))
  )
    return null;
  return { view: v.view as Tab, id: v.id as string | null | undefined };
}
