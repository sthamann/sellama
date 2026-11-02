/** Explicit native saves and scope-safe reads; local undo never bypasses record CAS or staging review. */
import { useEffect, useRef, useState } from "react";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import {
  appPath,
  pageFields,
  normalizePage,
  newPage,
  type Page,
} from "../model";
import type { SiteProduct } from "../Renderer";
import type { AppSurface } from "../../../../frontend/src/shared/apps/AppSurfaces";
export type Context = {
  channels: { id: string; data: { name: Record<string, string> } }[];
  locales: string[];
  mainLocale: string;
  installed: string[];
  elements?: AppSurface[];
  catalogue: {
    elements: SiteProduct[];
    hasMore: boolean;
    nextCursor: string | null;
  };
};
export default function useDesigner(request: RequestFn, workspace: string) {
  const [context, setContext] = useState<Context>(),
    [pages, setPages] = useState<Page[]>([]),
    [draft, setDraft] = useState<Page>(),
    [channel, setChannel] = useState(
      new URLSearchParams(location.search).get("designChannel") ?? "default",
    );
  const [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [loaded, setLoaded] = useState(false),
    [more, setMore] = useState<string | null>(null);
  const [past, setPast] = useState<Page[]>([]),
    [future, setFuture] = useState<Page[]>([]),
    scope = useRef(0),
    baseline = useRef("");
  const working = useRef(
    new Map<
      string,
      {
        page: Page;
        base: string;
        past: Page[];
        future: Page[];
        selected: string;
      }
    >(),
  );
  const remember = () => {
    if (draft)
      working.current.set(draft.id, {
        page: draft,
        base: baseline.current,
        past,
        future,
        selected,
      });
  };
  const [catalogueLanguage, setCatalogueLanguage] = useState("");
  const contextScope = useRef("");
  contextScope.current = `${workspace}:${channel}:${catalogueLanguage}`;
  const readContext = async (query = "") =>
    request(
      `/api/merchant/site/context?channel=${encodeURIComponent(channel)}${query ? `&query=${encodeURIComponent(query)}` : ""}${catalogueLanguage ? `&locale=${encodeURIComponent(catalogueLanguage)}` : ""}`,
    ) as Promise<Context>;
  const load = async () => {
    const current = ++scope.current;
    setError("");
    setLoaded(false);
    try {
      const c = await readContext();
      if (current !== scope.current) return;
      setContext(c);
      const rows = c.installed.includes("site_builder")
        ? await request(`${appPath}editor_pages`, { limit: 100 })
        : { elements: [], nextCursor: null };
      if (current !== scope.current) return;
      setPages(rows.elements.map(normalizePage));
      setMore(rows.nextCursor ?? null);
      setLoaded(true);
    } catch (e) {
      if (current === scope.current) setError((e as Error).message);
    }
  };
  useEffect(() => {
    working.current.clear();
    setDraft(undefined);
    setPast([]);
    setFuture([]);
    void load();
    return () => {
      scope.current++;
    };
  }, [workspace, request]);
  useEffect(() => {
    if (!context) return;
    let active = true;
    void readContext()
      .then((c) => {
        if (active) setContext(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [channel, catalogueLanguage]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void readContext()
        .then((c) => {
          if (active) setContext(c);
        })
        .catch(() => {});
    };
    addEventListener("commerce.apps.changed", refresh);
    return () => {
      active = false;
      removeEventListener("commerce.apps.changed", refresh);
    };
  }, [workspace, request, channel, catalogueLanguage]);
  const dirty = !!draft && baseline.current !== JSON.stringify(draft);
  const hasUnsaved =
    dirty ||
    [...working.current.values()].some(
      (v) => v.page.id !== draft?.id && JSON.stringify(v.page) !== v.base,
    );
  useEffect(() => {
    if (!hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);
  const open = (page: Page, fresh = false) => {
    remember();
    if (fresh) working.current.delete(page.id);
    const kept = working.current.get(page.id);
    if (kept && !fresh) {
      setDraft(kept.page);
      baseline.current = kept.base;
      setPast(kept.past);
      setFuture(kept.future);
      setSelected(kept.selected);
      setSaved(false);
      return;
    }
    page = normalizePage(page);
    setDraft(page);
    baseline.current = page.revision ? JSON.stringify(page) : "";
    setSelected("");
    setPast([]);
    setFuture([]);
    setSaved(false);
  };
  const edit = (page: Page, previous = draft) => {
    if (previous) setPast((p) => [...p, previous].slice(-30));
    if (page.channel === "*" && channel !== "*") {
      page = { ...page, id: newPage(channel, "", "").id, revision: 0, channel };
    }
    setFuture([]);
    setDraft(page);
    setSaved(false);
  };
  const save = async (page = draft) => {
    if (!page || busy) return;
    if (page.channel === "*" && channel !== "*")
      page = { ...page, id: newPage(channel, "", "").id, revision: 0, channel };
    setBusy(true);
    setError("");
    const current = scope.current;
    try {
      const result = await request(`${appPath}save_page`, {
        id: page.id,
        revision: page.revision,
        fields: pageFields(page),
      });
      if (current !== scope.current) return;
      const next = {
        ...result.fields,
        id: result.id,
        revision: result.revision,
      } as Page;
      working.current.delete(page.id);
      setDraft(next);
      baseline.current = JSON.stringify(next);
      setPages((rows) => [...rows.filter((p) => p.id !== next.id), next]);
      setSaved(true);
      return next;
    } catch (e) {
      if (current === scope.current) setError((e as Error).message);
    } finally {
      if (current === scope.current) setBusy(false);
    }
  };
  return {
    context,
    setContext,
    setCatalogueLanguage,
    pages,
    workingPages: [
      ...new Map([
        ...pages.map((p) => [p.id, p] as const),
        ...Array.from(
          working.current.values(),
          (v) => [v.page.id, v.page] as const,
        ),
      ]).values(),
    ],
    setPages,
    draft,
    selected,
    setSelected,
    channel,
    changeChannel: (next: string) => {
      working.current.clear();
      setChannel(next);
      setDraft(undefined);
      setSelected("");
      setPast([]);
      setFuture([]);
      setSaved(false);
    },
    search: async (query: string) => {
      const current = scope.current;
      const context = contextScope.current;
      try {
        const c = await readContext(query);
        if (current === scope.current && context === contextScope.current)
          setContext(c);
      } catch (e) {
        if (current === scope.current) setError((e as Error).message);
      }
    },
    error,
    setError,
    busy,
    loaded,
    saved,
    dirty,
    hasUnsaved,
    open,
    close: () => {
      remember();
      setDraft(undefined);
      baseline.current = "";
      setSelected("");
    },
    edit,
    save,
    load,
    readContext,
    more,
    loadMore: async () => {
      const current = scope.current;
      try {
        const value = await request(`${appPath}editor_pages`, {
          limit: 100,
          after: more,
        });
        if (current !== scope.current) return;
        setPages((rows) => [...rows, ...value.elements]);
        setMore(value.nextCursor ?? null);
      } catch (e) {
        if (current === scope.current) setError((e as Error).message);
      }
    },
    canUndo: !!past.length,
    canRedo: !!future.length,
    undo: () => {
      const page = past.at(-1);
      if (!page || !draft) return;
      setFuture((f) => [draft, ...f]);
      setPast((p) => p.slice(0, -1));
      setDraft(page);
      setSaved(false);
    },
    redo: () => {
      const page = future[0];
      if (!page || !draft) return;
      setPast((p) => [...p, draft]);
      setFuture((f) => f.slice(1));
      setDraft(page);
      setSaved(false);
    },
  };
}
export type Designer = ReturnType<typeof useDesigner>;
