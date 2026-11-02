/** Read only current native setup data; unavailable sources never become successful checks. */
import { useEffect, useState } from "react";
import { useStudio } from "../shell/StudioContext";
import type { CompanyData } from "../settings/company-types";
import type { Config } from "../../shared/api/shop-api";
export function useSetupFacts(enabled = true, changed = 0) {
  const { request, workspace, access } = useStudio();
  const [result, setResult] = useState<{
    request: typeof request;
    workspace: string;
    company?: CompanyData;
    commerce?: Config;
    products?: boolean;
    failed: boolean;
  }>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (!enabled) return;
    const read = (right: string, path: string) =>
      access.includes(right) ? request(path) : Promise.resolve(undefined);
    void Promise.allSettled([
      read("settings.read", "/api/settings/master-data"),
      read("settings.read", "/api/merchant/commerce"),
      read("catalog.read", "/api/merchant/products?limit=1"),
    ]).then(([company, commerce, products]) => {
      if (!active) return;
      setResult({
        request,
        workspace,
        company:
          company.status === "fulfilled" ? company.value?.data : undefined,
        commerce:
          commerce.status === "fulfilled" ? commerce.value?.data : undefined,
        products:
          products.status === "fulfilled" && products.value
            ? products.value.elements?.length > 0
            : undefined,
        failed: [company, commerce, products].some(
          (v) => v.status === "rejected",
        ),
      });
    });
    return () => {
      active = false;
    };
  }, [enabled, changed, request, workspace, access, revision]);
  return {
    facts:
      enabled && result?.request === request && result.workspace === workspace
        ? result
        : undefined,
    refresh: () => setRevision((n) => n + 1),
  };
}
