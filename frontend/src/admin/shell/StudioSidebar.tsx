/** StudioSidebar: focused Studio view; state and commands come from the session-scoped controller. */
import { AdminAppNavigation } from "../../shared/apps/AppSurfaces";
import "../../shared/styles/workbench.css";
import Icon from "../../shared/ui/Icon";
import Brand, { BRAND } from "../../shared/ui/Brand";
import "../styles/operations.css";
import "../styles/studio.css";

import { canOpenStudio } from "./permissions";
import { useStudio } from "./StudioContext";
import { useAppSurfaces } from "../../shared/apps/AppSurfaces";
import { useCommerceNavText } from "./commerce-nav-i18n";
import type { Tab } from "./navigation";
import { useStudioText } from "../../shared/i18n/studio-ui-i18n";

export default function StudioSidebar() {
  const {
    menu,
    b2bFeatures,
    t,
    selectTab,
    workspaceName,
    busy,
    newChat,
    nav,
    id,
    access,
    appSurface,
    tab,
    setMenu,
    tabLabel,
    data,
    setAppSurface,
    conversations,
    connected,
    run,
    load,
    onExit,
  } = useStudio();
  const { u } = useStudioText(),
    n = useCommerceNavText();
  const surfaces = useAppSurfaces();
  const marketplace = surfaces.find(
    (surface) =>
      surface.app === "marketplaces" &&
      surface.surface.id === "connections" &&
      surface.surface.location === "admin.navigation",
  );
  const go = (id: Tab) => {
    selectTab(id);
    setMenu(false);
  };
  const selectSurface: Parameters<typeof AdminAppNavigation>[0]["onSelect"] = (
    surface,
  ) => {
    setAppSurface(surface);
    setMenu(false);
  };
  const groups: { label: string; tabs: Tab[] }[] = [
    {
      label: u("intelligence"),
      tabs: [
        "workspace",
        "setup",
        "assistant",
        "overview",
        "knowledge",
        "agents",
      ],
    },
    {
      label: u("commerce"),
      tabs: ["productData", "orders", "customers", "pos"],
    },
    {
      label: u("experiences"),
      tabs: ["design", "storyfronts", "channels", "automation", "apps"],
    },
    {
      label: u("workspace"),
      tabs: ["developers", "environments", "users", "commerce"],
    },
  ];
  return (
    <aside className={`studio-sidebar ${menu ? "open" : ""}`}>
      <a className="studio-brand" href="#merchant" aria-label={t("studio")}>
        <Brand />
      </a>
      <button
        disabled={!canOpenStudio("users", access)}
        className="workspace-switch"
        onClick={() => selectTab("users")}
      >
        <span className="shop-monogram">
          {workspaceName.slice(0, 1).toUpperCase()}
        </span>
        <span>
          {workspaceName}
          <small>{t("demo")}</small>
        </span>
        <Icon name="settings" size={16} />
      </button>
      <button
        className="studio-primary new-conversation"
        disabled={busy || !canOpenStudio("assistant", access)}
        onClick={newChat}
      >
        <Icon name="plus" size={18} />
        {t("newChat")}
      </button>
      <nav aria-label={t("studio")}>
        {groups
          .filter((group) => group.tabs.some((id) => canOpenStudio(id, access)))
          .map((group) => (
            <div className="sidebar-nav-group" key={group.label}>
              <span className="sidebar-group-label">{group.label}</span>
              {group.tabs
                .map((id) => nav.find((n) => n.id === id)!)
                .filter((n) => canOpenStudio(n.id, access))
                .map((n) => (
                  <button
                    key={n.id}
                    aria-current={
                      !appSurface && tab === n.id ? "page" : undefined
                    }
                    className={!appSurface && tab === n.id ? "active" : ""}
                    onClick={() => {
                      selectTab(n.id);
                      setMenu(false);
                    }}
                  >
                    <Icon name={n.icon} />
                    <span>{tabLabel(n.id)}</span>
                    {n.id === "overview" && data?.summary.ordersToday ? (
                      <b>{data.summary.ordersToday}</b>
                    ) : null}
                  </button>
                ))}
            </div>
          ))}
        {b2bFeatures?.enabled && (
          <details
            className="sidebar-nav-group sidebar-commerce-group"
            open={
              tab === "b2b" ||
              tab === "b2bQuotes" ||
              appSurface?.app === "edi" ||
              undefined
            }
          >
            <summary>
              <Icon name="people" />
              {n("b2b")}
            </summary>
            <button
              onClick={() => go("b2b")}
              aria-current={!appSurface && tab === "b2b" ? "page" : undefined}
            >
              <Icon name="people" />
              {n("companies")}
            </button>
            {b2bFeatures.quotes && canOpenStudio("b2bQuotes", access) && (
              <button
                onClick={() => go("b2bQuotes")}
                aria-current={
                  !appSurface && tab === "b2bQuotes" ? "page" : undefined
                }
              >
                <Icon name="chat" />
                {n("quotes")}
              </button>
            )}
            {b2bFeatures.edi && (
              <AdminAppNavigation
                selected={appSurface}
                onSelect={selectSurface}
                include={(s) => s.app === "edi"}
              />
            )}
          </details>
        )}
        {marketplace && (
          <button
            type="button"
            aria-current={
              appSurface?.app === "marketplaces" ? "page" : undefined
            }
            className={appSurface?.app === "marketplaces" ? "active" : ""}
            onClick={() => selectSurface(marketplace)}
          >
            <Icon name="layers" />
            <span>{n("marketplaces")}</span>
          </button>
        )}
        <AdminAppNavigation
          selected={appSurface}
          onSelect={selectSurface}
          include={(s) => s.app !== "edi" && s.app !== "marketplaces"}
        />
      </nav>
      {access.includes("assistant.use") && (
        <div className="sidebar-conversations">
          <span className="section-label">{t("conversations")}</span>
          {conversations.length ? (
            conversations.map((c) => (
              <button
                key={c.id}
                disabled={busy || !connected}
                title={c.title}
                className={id === c.id ? "selected" : ""}
                onClick={() => run(() => load(c.id))}
              >
                <Icon name="chat" size={15} />
                <span>{c.title}</span>
              </button>
            ))
          ) : (
            <p>{t("conversationEmpty")}</p>
          )}
        </div>
      )}
      <div className="sidebar-bottom">
        <button onClick={onExit}>
          <Icon name="arrow" />
          {t("storefront")}
        </button>
        <a href={BRAND.repository} target="_blank" rel="noreferrer">
          {t("source")}
          <span>v0.5</span>
        </a>
      </div>
    </aside>
  );
}
