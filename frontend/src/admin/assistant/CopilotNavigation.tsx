/** Suggested navigation stays explicit, using the shared native route. */
import Icon from "../../shared/ui/Icon";
import { useExperienceUIText } from "../../shared/i18n/experience-ui-i18n";
import { useStudio } from "../shell/StudioContext";
import { admitNavigation } from "./copilot-navigation";
import type { EntityTarget } from "../shell/useEntityNavigation";
export default function CopilotNavigation({ value }: { value: unknown }) {
  const { access, tabLabel, openEntity, selectTab } = useStudio(),
    { u } = useExperienceUIText();
  const target = admitNavigation(value, access);
  if (!target) return null;
  return (
    <button
      className="copilot-native-link"
      type="button"
      onClick={() => {
        if (target.id)
          openEntity(target.view as EntityTarget["tab"], target.id);
        else selectTab(target.view);
      }}
    >
      <Icon name="arrow" size={18} />
      <span>
        {u("openNative", { area: tabLabel(target.view) })}
        {target.id && <small> · {target.id}</small>}
      </span>
    </button>
  );
}
