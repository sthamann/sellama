/** Route the first eligible live-shop visit to the optional welcome, preserving ordinary workspace navigation. */
import { lazy } from "react";
import { useStudio } from "../shell/StudioContext";
import { useShopSetup } from "./SetupProvider";
const PersonalWorkspace = lazy(() => import("../workspace/PersonalWorkspace"));
const SetupWizard = lazy(() => import("./SetupWizard"));
export default function SetupEntry() {
  const { tab } = useStudio();
  const guide = useShopSetup();
  return tab === "setup" ||
    guide.autoOpen ||
    (guide.available && guide.loading) ? (
    <SetupWizard />
  ) : (
    <PersonalWorkspace />
  );
}
