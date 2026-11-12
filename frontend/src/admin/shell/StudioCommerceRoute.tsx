/** Installed app and business entry points stay within the active Studio workspace. */
import { lazy } from "react";
import { AppSurfaceView, useAppRegistry } from "../../shared/apps/AppSurfaces";
import { useCommerceNavText } from "./commerce-nav-i18n";
import { useStudio } from "./StudioContext";

const MarketplacePanel = lazy(
  () =>
    import("../../../../extensions/apps/marketplaces/studio/MarketplacePanel"),
);
const B2BWorkspace = lazy(() => import("../b2b/B2BWorkspace"));

export default function StudioCommerceRoute() {
  const {
    appSurface,
    b2bFeatures,
    tab,
    request,
    access,
    environment,
    workspace,
    selectTab,
  } = useStudio();
  const registry = useAppRegistry(),
    t = useCommerceNavText();
  if (appSurface) {
    if (appSurface.app === "edi" && (!b2bFeatures?.enabled || !b2bFeatures.edi))
      return null;
    if (appSurface.app !== "marketplaces")
      return <AppSurfaceView selected={appSurface} />;
    const market = registry.surfaces.find(
      (s) => s.app === "marketplaces" && s.surface.id === appSurface.surface.id,
    );
    if (!market || !access.includes("apps.manage")) return null;
    return (
      <div className="studio-page marketplace-workspace">
        <header className="page-intro">
          <h1>{t("marketplaces")}</h1>
          <p>{t("marketplaceHint")}</p>
        </header>
        <MarketplacePanel
          request={request}
          manage
          mainLocale={market.mainLocale ?? registry.mainLocale}
        />
      </div>
    );
  }
  if (!b2bFeatures) return null;
  if (!b2bFeatures.enabled || (tab === "b2bQuotes" && !b2bFeatures.quotes))
    return (
      <p className="studio-page" role="status">
        {t("b2bDisabled")}
      </p>
    );
  return (
    <B2BWorkspace
      key={`${environment || workspace}:${tab}`}
      quotes={tab === "b2bQuotes"}
      onQuotes={() => selectTab("b2bQuotes")}
      onCompanies={() => selectTab("b2b")}
      request={request}
      rights={access}
      onSettings={() => {
        const url = new URL(location.href);
        url.searchParams.set("settings", "b2b");
        history.replaceState(null, "", url);
        selectTab("commerce");
      }}
    />
  );
}
