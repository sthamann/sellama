/** Display business navigation only after the active workspace confirms its feature switches. */
import { useEffect, useState } from "react";
import type { RequestFn } from "../../shared/api/types";

type Features = { enabled: boolean; quotes: boolean; edi: boolean };
export const b2bChanged = "commerce.b2b.changed";

export function useB2BNavigation(request: RequestFn, admitted: boolean) {
  const [result, setResult] = useState<{
    request: RequestFn;
    features: Features;
  }>();
  useEffect(() => {
    if (!admitted) {
      setResult(undefined);
      return;
    }
    let active = true,
      sequence = 0;
    const refresh = async () => {
      const current = ++sequence;
      const response = await request("/api/b2b/configuration", {}).catch(
        () => undefined,
      );
      if (active && sequence === current)
        setResult(
          response?.features
            ? { request, features: response.features }
            : undefined,
        );
    };
    void refresh();
    window.addEventListener(b2bChanged, refresh);
    window.addEventListener("commerce.apps.changed", refresh);
    return () => {
      active = false;
      window.removeEventListener(b2bChanged, refresh);
      window.removeEventListener("commerce.apps.changed", refresh);
    };
  }, [request, admitted]);
  return admitted && result?.request === request ? result.features : undefined;
}
