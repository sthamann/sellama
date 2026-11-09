/** Current source passages for the order workspace. The query contains no order or customer data. */
import { useEffect, useState } from "react";
import type { RequestFn } from "../shell/studio-types";
import type { PreviewResult } from "../intelligence/knowledge-types";
import { useCompositionText } from "./composition-i18n";

export default function OrderShippingPolicy({
  request,
}: {
  request: RequestFn;
}) {
  const t = useCompositionText();
  const query = t("shippingQuery");
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{
    request: RequestFn;
    query: string;
    retry: number;
    sources?: PreviewResult["sources"];
  }>();

  useEffect(() => {
    let current = true;
    request("/api/knowledge/preview", {
      audience: "merchant",
      query,
      includeExternal: false,
    })
      .then(({ sources }: PreviewResult) => {
        if (current) setResponse({ request, query, retry, sources });
      })
      .catch(() => {
        if (current) setResponse({ request, query, retry });
      });
    return () => {
      current = false;
    };
  }, [request, query, retry]);

  const latest =
    response?.request === request &&
    response.query === query &&
    response.retry === retry
      ? response
      : undefined;
  const sources = latest?.sources;
  return (
    <section className="agent-shipping-policy" aria-label={t("shippingPolicy")}>
      <h3>{t("shippingPolicy")}</h3>
      {!latest ? (
        <p role="status">{t("shippingLoading")}</p>
      ) : !sources ? (
        <>
          <p role="alert">{t("shippingError")}</p>
          <button
            type="button"
            className="studio-secondary"
            onClick={() => setRetry(retry + 1)}
          >
            {t("shippingRetry")}
          </button>
        </>
      ) : sources.length === 0 ? (
        <p>{t("shippingEmpty")}</p>
      ) : (
        <ul>
          {sources.slice(0, 3).map((source) => (
            <li key={source.sourceId}>
              <strong lang={source.locale}>{source.title}</strong>
              <p lang={source.locale}>{source.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
