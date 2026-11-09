/** Render server-selected MCP App results in an opaque iframe inside the conversation. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
};
function Frame({
  view,
  request,
  locale,
}: {
  view: ConversationAppView;
  request: RequestFn;
  locale: string;
}) {
  const [definition, setDefinition] = useState<Definition>();
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
        reply({
          method: "ui/notifications/tool-input",
          params: { arguments: view.arguments },
        });
        reply({ method: "ui/notifications/tool-result", params: view.result });
      }
      if (
        message.method === "tools/call" &&
        initialized &&
        typeof message.id === "string"
      ) {
        const { id, params } = message;
        if (
          reading ||
          params?.name !== definition.toolName ||
          typeof params.arguments?.after !== "string"
        ) {
          reply({
            id,
            error: { code: -32602, message: "App read unavailable" },
          });
          return;
        }
        reading = true;
        request("/mcp", {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: {
            name: definition.toolName,
            arguments: { ...view.arguments, after: params.arguments.after },
            _meta: { "ai.veyndo/resourceUri": view.resourceUri },
          },
        })
          .then((rpc) => {
            if (current)
              reply(
                rpc.result
                  ? { id, result: rpc.result }
                  : {
                      id,
                      error: { code: -32602, message: "App read unavailable" },
                    },
              );
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
  );
}

export default function ConversationAppViews({
  views,
  request,
}: {
  views?: ConversationAppView[];
  request: RequestFn;
}) {
  const { locale } = useLocale();
  return (
    views?.map((view, index) => (
      <Frame
        key={`${view.resourceUri}:${index}`}
        view={view}
        request={request}
        locale={locale}
      />
    )) ?? null
  );
}
