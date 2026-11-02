/** Native commerce handoffs keep the open editor mounted and protect unfinished edits before target replacement. */
import { useEffect, useState } from "react";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
type Target = { kind: "product" | "category"; id: string };
export default function useCommerceCanvas(
  request: RequestFn,
  workspace: string,
  channel: string,
  onOpen: () => void,
) {
  const [target, setTarget] = useState<Target>(),
    [visible, setVisible] = useState(false),
    [dirty, setDirty] = useState(false),
    [pending, setPending] = useState<Target>();
  const clear = () => {
    setTarget(undefined);
    setVisible(false);
    setDirty(false);
    setPending(undefined);
  };
  useEffect(clear, [request, workspace, channel]);
  const enter = (next: Target) => {
    setTarget(next);
    setVisible(true);
    onOpen();
  };
  return {
    target,
    visible,
    setVisible,
    dirty,
    setDirty,
    pending,
    clear,
    pick: (kind: Target["kind"], id: string) => {
      if (dirty && (target?.kind !== kind || target.id !== id))
        setPending({ kind, id });
      else enter({ kind, id });
    },
    cancel: () => setPending(undefined),
    confirm: () => {
      if (pending) {
        enter(pending);
        setDirty(false);
        setPending(undefined);
      }
    },
  };
}
