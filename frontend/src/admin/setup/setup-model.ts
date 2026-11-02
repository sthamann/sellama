/** Setup records contain personal guidance only; native settings remain the source of truth. */
import type { Workspace } from "../workspace/workspace-model";
import type { IconName } from "../../shared/ui/Icon";
import type { Tab } from "../shell/navigation";
export const steps = [
  "basics",
  "products",
  "design",
  "checkout",
  "legal",
  "test",
] as const;
export type SetupStep = (typeof steps)[number];
export type SetupProgress = {
  version: 1;
  state: "active" | "dismissed" | "complete";
  step: SetupStep;
  reviewed: SetupStep[];
};
export const stepTarget: Record<
  SetupStep,
  { icon: IconName; tab: Tab; settings?: string; right: string }
> = {
  basics: {
    icon: "building",
    tab: "commerce",
    settings: "masterData",
    right: "settings.write",
  },
  products: { icon: "box", tab: "productData", right: "catalog.write" },
  design: { icon: "palette", tab: "design", right: "channels.manage" },
  checkout: {
    icon: "card",
    tab: "commerce",
    settings: "shipping",
    right: "settings.write",
  },
  legal: {
    icon: "lock",
    tab: "commerce",
    settings: "legal",
    right: "settings.write",
  },
  test: { icon: "check", tab: "channels", right: "channels.read" },
};
export function newProgress(): SetupProgress {
  return { version: 1, state: "active", step: "basics", reviewed: [] };
}
export function reviewStep(progress: SetupProgress): SetupProgress {
  const reviewed = [...new Set([...progress.reviewed, progress.step])];
  const next = steps.find((s) => !reviewed.includes(s));
  return {
    ...progress,
    reviewed,
    step: next ?? progress.step,
    state: next ? "active" : "complete",
  };
}
export function withSetup(data: Workspace, setup: SetupProgress): Workspace {
  return { ...data, setup };
}
