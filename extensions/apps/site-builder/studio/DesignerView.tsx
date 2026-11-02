/** Three-panel standard-shop editor inside the native shell; Storyfront retains its separate original editor. */
import { useEffect, useRef, useState } from "react";
import { useContentLanguage } from "../../../../frontend/src/shared/i18n/ContentLanguage";
import ConfirmDialog from "../../../../frontend/src/shared/ui/ConfirmDialog";
import type { SiteProduct } from "../Renderer";
import DesignerPreview from "./DesignerPreview";
import CanvasCommerceEditor from "../../../../frontend/src/admin/catalog/CanvasCommerceEditor";
import ShopOverview from "./ShopOverview";
import DesignerPreviewBar from "./DesignerPreviewBar";
import { homeDraft } from "./home-draft";
import {
  inheritedTheme,
  effectivePages,
  explicitTheme,
  type Page,
} from "../model";
import { useDesignText } from "./design-i18n";
import { useEditorText } from "./editor-i18n";
import { type Designer } from "./useDesigner";
import PageTree from "./PageTree";
import usePageProducts from "../usePageProducts";
import DesignerInspector, { type DesignerMode } from "./DesignerInspector";
import DesignerHeader from "./DesignerHeader";
import type { HomeSnapshot } from "./StorefrontCanvas";
import "./designer.css";
import "./canvas.css";
import "./inspector.css";
import "./workspace.css";
import "./navigation.css";
import "./palette.css";
import { BlockEditingContext, useBlockEditing } from "./useBlockEditing";
import "./interactions.css";
import DesignSetup, { designIntent } from "./DesignSetup";
import type { Props } from "./ShopDesigner";
import useCommerceCanvas from "./useCommerceCanvas";
import { preparePage } from "./prepare-page";
import useDesignResume from "./useDesignResume";
export default function DesignerView({
  request,
  workspace,
  shopName,
  initialReference,
  rights,
  sandbox,
  onEnvironments,
  onTest,
  onSandbox,
  d,
}: Props & { d: Designer }) {
  const t = useDesignText(),
    e = useEditorText(),
    { language, mainLocale } = useContentLanguage();
  useEffect(() => {
    d.setCatalogueLanguage(language);
  }, [language]);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(() =>
      window.matchMedia("(max-width: 650px)").matches ? "mobile" : "desktop",
    ),
    [showPages, setShowPages] = useState(false),
    [overview, setOverview] = useState(!initialReference && !designIntent()),
    [toolsOpen, setToolsOpen] = useState(
      !!initialReference || !!designIntent(),
    ),
    [pendingChannel, setPendingChannel] = useState<string>(),
    [pendingHome, setPendingHome] = useState(false);

  const [mode, setMode] = useState<DesignerMode>(
    initialReference || designIntent() === "agent"
      ? "agent"
      : designIntent() === "blocks"
        ? "blocks"
        : "edit",
  );
  const commerce = useCommerceCanvas(request, workspace, d.channel, () =>
    setOverview(false),
  );
  const nativeSnapshot = useRef<HomeSnapshot | undefined>(undefined);
  const [snapshotScope, setSnapshotScope] = useState("");
  const scopeKey = `${workspace}:${d.channel}:${language}`;
  const [comparison, setComparison] = useState<Page | null>(null);
  useEffect(() => setComparison(null), [workspace, d.channel, request]);
  const requiresForms =
    d.draft?.content.blocks.some((block) => block.kind === "form") ?? false;
  const missing = (
    requiresForms ? ["site_builder", "site_forms"] : ["site_builder"]
  ).find((id) => !d.context!.installed.includes(id));
  const writable = sandbox && rights.includes("channels.manage") && !missing;
  const open = (page: Page) => {
    d.open(page);
    commerce.setVisible(false);
    setComparison(null);
  };
  const beginSetup = useDesignResume({
    workspace,
    request,
    sandbox,
    writable,
    missing,
    d,
    language,
    mainLocale,
    nativeSnapshot,
    snapshotScope,
    scopeKey,
    setMode,
  });
  useEffect(() => {
    if (!d.loaded || d.draft) return;
    const pages = effectivePages(d.pages, d.channel);
    const home = pages.find(
      (p) => p.slug === "home" && p.status !== "archived",
    );
    if (home) d.open(home);
  }, [d.loaded, d.pages, d.channel, d.draft]);
  const customizeHome = (
    snapshot: HomeSnapshot,
    section: "hero" | "products",
  ) => {
    if (d.draft) return;
    if (!sandbox || missing) {
      beginSetup(section);
      return;
    }
    if (!writable) {
      d.setError(t("readOnly"));
      return;
    }
    const page = homeDraft(
      d.channel,
      mainLocale,
      language,
      d.context!.catalogue.elements,
      snapshot,
    );
    d.open(page);
    setMode("edit");
    d.setSelected(
      section === "hero"
        ? page.content.blocks[0].id
        : page.content.blocks[1].id,
    );
  };
  const editing = useBlockEditing({
    d,
    enabled: writable && !comparison,
    scope: `${workspace}:${d.channel}:${language}`,
    prepare: () =>
      nativeSnapshot.current
        ? homeDraft(
            d.channel,
            mainLocale,
            language,
            d.context!.catalogue.elements,
            nativeSnapshot.current,
          )
        : undefined,
    onSelect: () => {
      setMode("edit");
      setToolsOpen(true);
    },
  });
  const theme = {
    ...inheritedTheme(d.pages, d.channel),
    ...explicitTheme(d.draft?.theme),
  };
  const selection = usePageProducts(
    comparison ?? d.draft,
    d.context!.catalogue.elements,
    `${workspace}:${d.channel}:${language}`,
    async (ids) =>
      (
        await request(
          `/api/merchant/site/context?channel=${encodeURIComponent(d.channel)}&locale=${encodeURIComponent(language)}&ids=${encodeURIComponent(JSON.stringify(ids))}`,
        )
      ).catalogue.elements,
  );
  const setup =
    !writable || missing ? (
      <DesignSetup
        request={request}
        workspace={workspace}
        rights={rights}
        sandbox={sandbox}
        installed={d.context!.installed}
        requiresForms={requiresForms}
        loaded={d.loaded}
        onSandbox={onSandbox}
        onReload={d.load}
      />
    ) : null;
  return (
    <BlockEditingContext.Provider value={editing}>
      <div className="shop-designer">
        <DesignerHeader
          d={d}
          rights={rights}
          sandbox={sandbox}
          writable={writable}
          creating={false}
          selectionError={!!selection.error}
          onChannel={(channel) => {
            if (d.hasUnsaved || commerce.dirty) setPendingChannel(channel);
            else d.changeChannel(channel);
          }}
          onSandbox={() => beginSetup("edit")}
          onEnvironments={onEnvironments}
          onTest={onTest}
          onAgent={() => {
            setOverview(false);
            commerce.setVisible(false);
            setToolsOpen(true);
            if (!writable || missing) beginSetup("agent");
            else setMode("agent");
          }}
          agentOpen={mode === "agent"}
        />

        <div
          className={`designer-layout ${overview || commerce.visible || !toolsOpen ? "is-overview" : showPages ? "with-pages" : ""}`}
        >
          {showPages && !overview && (
            <PageTree
              d={d}
              writable={writable}
              onOpen={open}
              onAdd={() => setMode("blocks")}
              onEdit={() => setMode("edit")}
              onHome={() => {
                if (d.dirty) setPendingHome(true);
                else d.close();
              }}
            />
          )}
          <section className="designer-canvas">
            <DesignerPreviewBar
              d={d}
              writable={writable}
              overview={overview}
              showPages={showPages}
              device={device}
              onDevice={setDevice}
              onOverview={() => {
                setOverview(!overview);
                commerce.setVisible(false);
              }}
              toolsOpen={toolsOpen}
              onTools={() => setToolsOpen(!toolsOpen)}
              onPages={() => {
                setOverview(false);
                setShowPages(!showPages);
                commerce.setVisible(false);
              }}
            />
            {overview ? (
              <ShopOverview
                key={scopeKey}
                d={d}
                request={request}
                workspace={workspace}
                shopName={shopName}
                language={language}
                mainLocale={mainLocale}
                device={device}
                onCommerce={
                  rights.includes("catalog.read") ? commerce.pick : undefined
                }
                onOpen={(page) => {
                  commerce.setVisible(false);
                  setOverview(false);
                  if (page && page.id === d.draft?.id) return;
                  if (page) open(page);
                  else if (d.dirty) setPendingHome(true);
                  else d.close();
                }}
              />
            ) : !commerce.visible ? (
              <DesignerPreview
                d={d}
                request={request}
                workspace={workspace}
                shopName={shopName}
                language={language}
                mainLocale={mainLocale}
                device={device}
                theme={theme}
                products={selection.products as SiteProduct[]}
                comparison={comparison}
                writable={writable}
                onHome={customizeHome}
                onSnapshot={(snapshot) => {
                  nativeSnapshot.current = snapshot;
                  setSnapshotScope(scopeKey);
                }}
                onEdit={() => {
                  setMode("edit");
                  setToolsOpen(true);
                }}
              />
            ) : null}
            {commerce.target && (
              <div hidden={!commerce.visible || overview}>
                <CanvasCommerceEditor
                  key={`${commerce.target.kind}:${commerce.target.id}`}
                  kind={commerce.target.kind}
                  id={commerce.target.id}
                  onDirtyChange={commerce.setDirty}
                  request={request}
                  canWrite={sandbox && rights.includes("catalog.write")}
                  onBack={() => {
                    commerce.clear();
                    setOverview(true);
                  }}
                  onSaved={() => void d.search("")}
                />
              </div>
            )}
          </section>
          <div
            hidden={overview || commerce.visible || !toolsOpen}
            style={{
              display:
                overview || commerce.visible || !toolsOpen
                  ? "none"
                  : "contents",
            }}
          >
            <DesignerInspector
              initialReference={initialReference}
              onViewport={setDevice}
              scopeKey={`${workspace}:${d.channel}`}
              d={d}
              request={request}
              rights={rights}
              writable={writable}
              theme={theme}
              products={selection.products}
              setShowPages={setShowPages}
              setup={setup}
              mode={mode}
              onMode={(next) => {
                if (!writable || missing)
                  beginSetup(next === "history" ? "edit" : next);
                else {
                  setMode(next);
                  setToolsOpen(true);
                }
              }}
              onPrepare={() =>
                preparePage(
                  d,
                  !!writable,
                  () => beginSetup("edit"),
                  nativeSnapshot.current,
                  mainLocale,
                  language,
                  e("unavailable"),
                )
              }
              onPreview={setComparison}
            />
          </div>
        </div>
        {(commerce.pending || pendingHome || pendingChannel !== undefined) && (
          <ConfirmDialog
            title={t("discardTitle")}
            onCancel={() => {
              commerce.cancel();
              setPendingHome(false);
              setPendingChannel(undefined);
            }}
            onConfirm={() => {
              commerce.confirm();
              if (pendingHome) d.close();
              setPendingHome(false);
              if (pendingChannel !== undefined) {
                commerce.setDirty(false);
                d.changeChannel(pendingChannel);
              }
              setPendingChannel(undefined);
            }}
            confirmLabel={t("discardTitle")}
          >
            <p>{t("discardHint")}</p>
          </ConfirmDialog>
        )}
      </div>
    </BlockEditingContext.Provider>
  );
}
