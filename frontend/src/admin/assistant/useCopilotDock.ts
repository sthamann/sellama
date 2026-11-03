/** One actor/shop-scoped assistant dock. Hiding never discards a conversation or starts a model call. */
import { useCallback, useState } from "react";
export function useCopilotDock(scope: string, allowed: boolean) {
  const [state, setState] = useState<{ scope: string; open: boolean }>();
  const open = allowed && state?.scope === scope && state.open;
  const show = useCallback(() => setState({ scope, open: true }), [scope]);
  const hide = useCallback(() => setState({ scope, open: false }), [scope]);
  return { open, show, hide, toggle: () => setState({ scope, open: !open }) };
}
