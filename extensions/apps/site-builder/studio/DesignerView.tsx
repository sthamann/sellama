/** Three-panel standard-shop editor inside the native shell; Storyfront retains its separate original editor. */
import { useEffect, useRef, useState } from "react";
import { useAppPanelSizing } from "../../../../frontend/src/admin/developer/AppPanelSizing";
import { useContentLanguage } from "../../../../frontend/src/shared/i18n/ContentLanguage";
import ConfirmDialog from "../../../../frontend/src/shared/ui/ConfirmDialog";
import type { PreviewCategory } from "./NativeCategoryPreview";
import {
  commercePage,
  layoutKind,
  type CommerceLayout,
} from "../commerce-layout";
import { commerceDraft } from "./commerce-layout-draft";
import DesignerPreviewPane from "./DesignerPreviewPane";
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
    panels = useAppPanelSizing(),
    { language, mainLocale } = useContentLanguage();
  useEffect(() => {
    d.setCatalogueLanguage(language);
  }, [language]);
  const intent = designIntent();
  const resumeLayout =
    intent === "product-layout" || intent === "category-layout";
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(() =>
      window.matchMedia("(max-width: 650px)").matches ? "mobile" : "desktop",
    ),
    [showPages, setShowPages] = useState(resumeLayout),
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
  const [previewId, setPreviewId] = useState("");
  const [previewCategories, setPreviewCategories] = useState<PreviewCategory[]>(
    [],
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
  const openLayout = (kind: CommerceLayout, id: string) => {
    setPreviewId(id);
    setOverview(false);
    setToolsOpen(true);
    setShowPages(true);
    if (layoutKind(d.draft) !== kind)
      open(
        commercePage(d.workingPages, d.channel, kind) ??
          commerceDraft(kind, d.channel, mainLocale, language),
      );
    if (!writable)
      beginSetup(kind === "product" ? "product-layout" : "category-layout");
    else setMode("edit");
  };
  const layout = layoutKind(d.draft);
  const previewProducts = d.context!.catalogue.elements;
  const previewOptions =
    layout === "product" ? previewProducts : previewCategories;
  const currentPreviewId =
    previewOptions.find((item) => item.id === previewId)?.id ??
    previewOptions[0]?.id ??
    "";
  useEffect(() => {
    if (!d.loaded || d.draft || resumeLayout) return;
    const pages = effectivePages(d.pages, d.channel);
    const home = pages.find(
      (p) => p.slug === "home" && p.status !== "archived",
    );
    if (home) d.open(home);
  }, [d.loaded, d.pages, d.channel, d.draft, resumeLayout]);
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
          dataEditing={commerce.visible && !overview}
          rights={rights}
          sandbox={sandbox}
          writable={writable}
          creating={false}
          selectionError={!!selection.error}
          onChannel={(channel) => {
            if (d.hasUnsaved || commerce.dirty) setPendingChannel(channel);
            else d.changeChannel(channel);
          }}
          onSandbox={() =>
            beginSetup(
              layout === "product"
                ? "product-layout"
                : layout === "category"
                  ? "category-layout"
                  : "edit",
            )
          }
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
          style={panels.style}
        >
          {showPages && !overview && !commerce.visible && (
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
          <DesignerPreviewPane
            {...{
              d,
              workspace,
              shopName,
              request,
              language,
              mainLocale,
              rights,
              sandbox,
              overview,
              setOverview,
              commerce,
              showPages,
              setShowPages,
              toolsOpen,
              setToolsOpen,
              writable,
              device,
              setDevice,
              scopeKey,
              openLayout,
              open,
              setPendingHome,
              layout,
              previewId: currentPreviewId,
              setPreviewId,
              setPreviewCategories,
              theme,
              products: selection.products,
              comparison,
              onHome: customizeHome,
              onSnapshot: (snapshot) => {
                nativeSnapshot.current = snapshot;
                setSnapshotScope(scopeKey);
              },
              onEdit: () => {
                setMode("edit");
                setToolsOpen(true);
              },
            }}
          />
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
              width={panels.widths.inspector}
              onWidth={(value) => panels.resize("inspector", value)}
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
