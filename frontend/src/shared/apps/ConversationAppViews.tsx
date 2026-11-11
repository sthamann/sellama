/** Render server-selected MCP App results in an opaque iframe inside the conversation. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RequestFn } from "../api/types";
import { appTheme, observeAppTheme } from "./conversation-app-theme";
import { conversationAppText } from "../i18n/conversation-app-i18n";
import { useLocale } from "../i18n/i18n";
import {
  verifiedAppFilter,
  type AppFilterContext,
} from "./conversation-app-context";
import "./conversation-app-views.css";

export type ConversationAppReference = {
  attachmentId?: number;
  resourceUri: string;
  arguments: Record<string, unknown>;
};

type AppResult = { structuredContent: unknown };
export type ConversationAppView = ConversationAppReference & {
  result: AppResult;
};

type Definition = {
  label: Record<string, string>;
  view: object;
  toolName: string;
  localeChain: string[];
  filter?: { name: string; choices: { value: string }[] } | null;
  productReference?: string | null;
};
type UseFilter = (
  filter: AppFilterContext,
  previous?: AppFilterContext,
) => boolean;

function productIds(result: unknown, reference: string | null | undefined) {
  const rows = (result as { elements?: unknown } | undefined)?.elements;
  if (!reference || !Array.isArray(rows)) return [];
  return [
    ...new Set(
      rows.flatMap((row) => {
        const id = row?.[reference];
        return typeof id === "string" && id.length > 0 && id.length <= 200
          ? [id]
          : [];
      }),
    ),
  ].slice(0, 8);
}
function Frame({
  view,
  readCurrent,
  request,
  locale,
  renderProducts,
  onUseFilter,
}: {
  view: ConversationAppReference & { result?: AppResult };
  readCurrent: boolean;
  request: RequestFn;
  locale: string;
  renderProducts?: (ids: string[]) => ReactNode;
  onUseFilter?: UseFilter;
}) {
  const uri = view.resourceUri;
  const argumentsKey = JSON.stringify(view.arguments);
  const suppliedResult = readCurrent ? undefined : view.result;
  const [loaded, setLoaded] = useState<{
    definition: Definition;
    result: AppResult;
  }>();
  const definition = loaded?.definition;
  const [visibleResult, setVisibleResult] = useState<unknown>();
  const [unavailable, setUnavailable] = useState(false);
  const [height, setHeight] = useState(116);
  const frame = useRef<HTMLIFrameElement>(null);
  const useFilter = useRef(onUseFilter);
  useFilter.current = onUseFilter;
  const {
    title: name,
    loading,
    unavailable: error,
  } = conversationAppText(locale);
  useEffect(() => {
    let current = true;
    setLoaded(undefined);
    setUnavailable(false);
    request("/mcp", {
      jsonrpc: "2.0",
      id: "app-resource",
      method: "resources/read",
      params: { uri },
    })
      .then(async (response) => {
        if (!current) return;
        const content = response.result?.contents?.[0];
        const data = content?._meta?.["ai.veyndo/definition"];
        if (
          content?.uri === uri &&
          content?.mimeType === "text/html;profile=mcp-app" &&
          data?.view &&
          data.label &&
          typeof data.toolName === "string"
        ) {
          let result = suppliedResult;
          if (readCurrent) {
            const rpc = await request("/mcp", {
              jsonrpc: "2.0",
              id: "app-initial-read",
              method: "tools/call",
              params: {
                name: data.toolName,
                arguments: JSON.parse(argumentsKey),
                _meta: { "ai.veyndo/resourceUri": uri },
              },
            });
            if (!current) return;
            if (
              !rpc.result?.isError &&
              Array.isArray(rpc.result?.structuredContent?.elements)
            ) {
              result = { structuredContent: rpc.result.structuredContent };
            }
          }
          if (result) setLoaded({ definition: data, result });
          else setUnavailable(true);
        } else setUnavailable(true);
      })
      .catch(() => current && setUnavailable(true));
    return () => {
      current = false;
    };
  }, [request, uri, argumentsKey, readCurrent, suppliedResult]);
  useLayoutEffect(() => {
    if (!loaded) return;
    const { definition, result } = loaded;
    const argsForView = JSON.parse(argumentsKey) as Record<string, unknown>;
    let ready = false;
    let initialized = false;
    let reading = false;
    let current = true;
    let applied: AppFilterContext | undefined;
    let drafted: AppFilterContext | undefined;
    const reply = (message: object) =>
      frame.current?.contentWindow?.postMessage(
        { jsonrpc: "2.0", ...message },
        "*",
      );
    const stopTheme = observeAppTheme(frame.current, (theme) => {
      if (initialized)
        reply({
          method: "ui/notifications/host-context-changed",
          params: { theme },
        });
    });
    const handle = (event: MessageEvent) => {
      const message = event.data;
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== "null" ||
        message?.jsonrpc !== "2.0"
      )
        return;
      if (
        message.method === "ui/initialize" &&
        !ready &&
        message.params?.protocolVersion === "2026-01-26"
      ) {
        ready = true;
        reply({
          id: message.id,
          result: {
            protocolVersion: "2026-01-26",
            hostInfo: { name: "Veyndo", version: "1.0.0" },
            hostCapabilities: {
              serverTools: {},
              ...(useFilter.current && definition.filter
                ? { updateModelContext: { structuredContent: {} } }
                : {}),
            },
            hostContext: {
              locale,
              theme: appTheme(frame.current),
              "ai.veyndo/definition": definition,
            },
          },
        });
      }
      if (
        message.method === "ui/notifications/initialized" &&
        ready &&
        !initialized
      ) {
        initialized = true;
        setVisibleResult(result.structuredContent);
        reply({
          method: "ui/notifications/tool-input",
          params: { arguments: argsForView },
        });
        reply({
          method: "ui/notifications/tool-result",
          params: { content: [], ...result },
        });
      }
      if (
        initialized &&
        (typeof message.id === "string" ||
          (typeof message.id === "number" && Number.isFinite(message.id)))
      ) {
        if (message.method === "ui/update-model-context") {
          const selection = verifiedAppFilter(message.params, applied);
          const accepted =
            !reading && selection && useFilter.current?.(selection, drafted);
          if (accepted) drafted = selection;
          reply(
            accepted
              ? { id: message.id, result: {} }
              : {
                  id: message.id,
                  error: { code: -32000, message: "Context update denied" },
                },
          );
          return;
        }
        if (message.method !== "tools/call") return;
        const { id, params } = message;
        const after = params?.arguments?.after;
        const filters = params?.arguments?.filter;
        const baseFilters = argsForView.filter;
        const filter = definition.filter;
        const allowedFilter =
          filter &&
          !(baseFilters && Object.hasOwn(baseFilters, filter.name)) &&
          Object.keys(baseFilters ?? {}).length < 4;
        const selected = allowedFilter ? filters?.[filter.name] : undefined;
        const validSelection =
          allowedFilter &&
          filter.choices.some(({ value }) => value === selected);
        if (
          reading ||
          params?.name !== definition.toolName ||
          (after !== undefined &&
            (typeof after !== "string" || !after || after.length > 100)) ||
          (after === undefined && !allowedFilter) ||
          (filters !== undefined &&
            (!filters ||
              typeof filters !== "object" ||
              Object.keys(filters).some(
                (key) =>
                  key !== filter?.name &&
                  !Object.hasOwn(baseFilters ?? {}, key),
              ))) ||
          (selected !== undefined && !validSelection)
        ) {
          reply({
            id,
            error: { code: -32602, message: "App read unavailable" },
          });
          return;
        }
        const args = { ...argsForView };
        delete args.after;
        if (after !== undefined) args.after = after;
        if (validSelection && filter) {
          args.filter = { ...(baseFilters as object), [filter.name]: selected };
        }
        reading = true;
        request("/mcp", {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: {
            name: definition.toolName,
            arguments: args,
            _meta: { "ai.veyndo/resourceUri": uri },
          },
        })
          .then((rpc) => {
            if (current) {
              if (
                rpc.result &&
                !rpc.result.isError &&
                Array.isArray(rpc.result.structuredContent?.elements)
              ) {
                setVisibleResult(rpc.result.structuredContent);
                applied =
                  validSelection && filter && typeof selected === "string"
                    ? {
                        tool: definition.toolName,
                        field: filter.name,
                        value: selected,
                      }
                    : undefined;
              }
              reply(
                rpc.result
                  ? { id, result: rpc.result }
                  : {
                      id,
                      error: { code: -32602, message: "App read unavailable" },
                    },
              );
            }
          })
          .catch(() => {
            if (current)
              reply({
                id,
                error: { code: -32603, message: "App read unavailable" },
              });
          })
          .finally(() => {
            reading = false;
          });
      }
      if (
        message.method === "ui/notifications/size-changed" &&
        initialized &&
        Number.isFinite(message.params?.height)
      ) {
        setHeight(Math.max(80, Math.min(520, message.params.height)));
      }
    };
    window.addEventListener("message", handle);
    const timeout = window.setTimeout(() => {
      if (!initialized) setUnavailable(true);
    }, 8000);
    return () => {
      current = false;
      stopTheme();
      window.clearTimeout(timeout);
      window.removeEventListener("message", handle);
    };
  }, [loaded, locale, request, uri, argumentsKey]);
  if (unavailable)
    return (
      <p className="conversation-app-status" role="status">
        {error}
      </p>
    );
  if (!definition)
    return (
      <p className="conversation-app-status" role="status">
        {loading}
      </p>
    );
  const label = definition.localeChain
    ?.map((key) => definition.label[key])
    .find((value) => value != null);
  return (
    <>
      <iframe
        key={locale}
        ref={frame}
        className="conversation-app-frame"
        title={label || name}
        src="/app-ui/mcp-view"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        height={height}
      />
      {renderProducts?.(productIds(visibleResult, definition.productReference))}
    </>
  );
}

export default function ConversationAppViews({
  views,
  readCurrent = false,
  request,
  renderProducts,
  onUseFilter,
}: {
  views?: (ConversationAppReference & { result?: AppResult })[];
  readCurrent?: boolean;
  request: RequestFn;
  renderProducts?: (ids: string[]) => ReactNode;
  onUseFilter?: UseFilter;
}) {
  const { locale } = useLocale();
  return (
    views?.map((view, index) => (
      <Frame
        key={`${view.resourceUri}:${view.attachmentId ?? index}`}
        view={view}
        readCurrent={readCurrent}
        request={request}
        locale={locale}
        renderProducts={renderProducts}
        onUseFilter={onUseFilter}
      />
    )) ?? null
  );
}
