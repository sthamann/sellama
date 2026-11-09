/** Render server-selected MCP App results in an opaque iframe inside the conversation. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RequestFn } from "../api/types";
import { conversationAppText } from "../i18n/conversation-app-i18n";
import { useLocale } from "../i18n/i18n";
import "./conversation-app-views.css";

export type ConversationAppView = {
  resourceUri: string;
  arguments: Record<string, unknown>;
  result: { structuredContent: unknown };
};

type Definition = {
  label: Record<string, string>;
  view: object;
  toolName: string;
  localeChain: string[];
  filter?: { name: string; choices: { value: string }[] } | null;
  productReference?: string | null;
};

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
  request,
  locale,
  renderProducts,
}: {
  view: ConversationAppView;
  request: RequestFn;
  locale: string;
  renderProducts?: (ids: string[]) => ReactNode;
}) {
  const [definition, setDefinition] = useState<Definition>();
  const [visibleResult, setVisibleResult] = useState<unknown>();
  const [unavailable, setUnavailable] = useState(false);
  const [height, setHeight] = useState(116);
  const frame = useRef<HTMLIFrameElement>(null);
  const {
    title: name,
    loading,
    unavailable: error,
  } = conversationAppText(locale);
  useEffect(() => {
    let current = true;
    setDefinition(undefined);
    setUnavailable(false);
    const uri = view.resourceUri;
    request("/mcp", {
      jsonrpc: "2.0",
      id: "app-resource",
      method: "resources/read",
      params: { uri },
    })
      .then((response) => {
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
          setDefinition(data);
        } else setUnavailable(true);
      })
      .catch(() => current && setUnavailable(true));
    return () => {
      current = false;
    };
  }, [request, view.resourceUri]);
  useLayoutEffect(() => {
    if (!definition) return;
    let ready = false;
    let initialized = false;
    let reading = false;
    let current = true;
    const reply = (message: object) =>
      frame.current?.contentWindow?.postMessage(
        { jsonrpc: "2.0", ...message },
        "*",
      );
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
            hostCapabilities: { serverTools: {} },
            hostContext: { locale, "ai.veyndo/definition": definition },
          },
        });
      }
      if (
        message.method === "ui/notifications/initialized" &&
        ready &&
        !initialized
      ) {
        initialized = true;
        setVisibleResult(view.result.structuredContent);
        reply({
          method: "ui/notifications/tool-input",
          params: { arguments: view.arguments },
        });
        reply({
          method: "ui/notifications/tool-result",
          params: { content: [], ...view.result },
        });
      }
      if (
        message.method === "tools/call" &&
        initialized &&
        (typeof message.id === "string" ||
          (typeof message.id === "number" && Number.isFinite(message.id)))
      ) {
        const { id, params } = message;
        const after = params?.arguments?.after;
        const filters = params?.arguments?.filter;
        const baseFilters = view.arguments.filter;
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
        const args = { ...view.arguments };
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
            _meta: { "ai.veyndo/resourceUri": view.resourceUri },
          },
        })
          .then((rpc) => {
            if (current) {
              if (rpc.result && !rpc.result.isError)
                setVisibleResult(rpc.result.structuredContent);
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
      window.clearTimeout(timeout);
      window.removeEventListener("message", handle);
    };
  }, [definition, locale, request, view]);
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
  request,
  renderProducts,
}: {
  views?: ConversationAppView[];
  request: RequestFn;
  renderProducts?: (ids: string[]) => ReactNode;
}) {
  const { locale } = useLocale();
  return (
    views?.map((view, index) => (
      <Frame
        key={`${view.resourceUri}:${index}`}
        view={view}
        request={request}
        locale={locale}
        renderProducts={renderProducts}
      />
    )) ?? null
  );
}
