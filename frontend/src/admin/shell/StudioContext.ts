/** Typed, local Studio context; never shared across a different mounted Studio. */
import { createContext, useContext } from "react";
import type { StudioController } from "./useStudioController";
import type { useB2BNavigation } from "./useB2BNavigation";
type StudioState = StudioController & {
  b2bFeatures?: ReturnType<typeof useB2BNavigation>;
};
export const StudioContext = createContext<StudioState | null>(null);
export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio view requires StudioContext");
  return value;
}
