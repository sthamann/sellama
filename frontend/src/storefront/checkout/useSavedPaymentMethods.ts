/** Account-owned saved-method loading and revocation use the shared Store API and clear stale tenant/session data. */
import { useEffect, useState } from "react";
import { shopApi } from "../../shared/api/shop-api";
import { shopScope } from "../../shared/api/shop-scope";
import { customerSessionGeneration } from "../../shared/api/customer-session";
export type SavedMethod = {
  id: string;
  provider: string;
  method: string;
  environment: string;
  metadata: { brand?: string; last4?: string };
};
export function useSavedPaymentMethods(customerId?: string | null) {
  const scope = shopScope(),
    generation = customerSessionGeneration(scope);
  const [methods, setMethods] = useState<SavedMethod[]>([]),
    [supported, setSupported] = useState<string[]>([]);
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let current = true;
    setMethods([]);
    setSupported([]);
    setFailed(false);
    setLoading(false);
    if (!customerId) return;
    setLoading(true);
    shopApi<{ elements: SavedMethod[]; supportedMethods: string[] }>(
      "/store-api/account/payment-methods",
    )
      .then((v) => {
        if (current && customerSessionGeneration(scope) === generation) {
          setMethods(v.elements);
          setSupported(v.supportedMethods);
        }
      })
      .catch(() => {
        if (current) setFailed(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [scope, generation, customerId, refresh]);
  const revoke = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await shopApi(
        "/store-api/account/payment-methods/" +
          encodeURIComponent(id) +
          "/revoke",
        { requestKey: crypto.randomUUID() },
      );
      if (customerSessionGeneration(scope) === generation)
        setMethods((v) => v.filter((m) => m.id !== id));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return {
    methods,
    supported,
    loading,
    busy,
    failed,
    revoke,
    reload: () => setRefresh((v) => v + 1),
  };
}
