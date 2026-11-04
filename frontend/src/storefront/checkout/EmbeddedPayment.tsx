/** A scoped provider frame receives a short-lived token; messages only trigger server reconciliation. */
import { useEffect, useRef, useState } from "react";
import { shopApi } from "../../shared/api/shop-api";
import { useCheckoutText } from "../../shared/i18n/checkout-i18n";
type Session = {
  uiUrl: string;
  sessionToken: string;
  nonce: string;
  expiresIn: number;
  readySignal?: boolean;
};
export default function EmbeddedPayment({
  id,
  token,
  onChanged,
  approvalUrl,
}: {
  id: string;
  token: string;
  onChanged: () => void;
  approvalUrl?: string;
}) {
  const { x } = useCheckoutText(),
    frame = useRef<HTMLIFrameElement>(null),
    [session, setSession] = useState<Session>(),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [reload, setReload] = useState(0);
  const timeoutText = x("paymentLoadTimeout");
  const changed = useRef(onChanged);
  changed.current = onChanged;
  useEffect(() => {
    let active = true;
    setSession(undefined);
    setLoaded(false);
    setError("");
    void shopApi<Session>(
      `/store-api/payments/${id}/session?parentOrigin=${encodeURIComponent(window.location.origin)}`,
      undefined,
      token,
    )
      .then((v) => {
        if (active) setSession(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, token, reload]);
  useEffect(() => {
    if (loaded || error) return;
    const timer = window.setTimeout(() => setError(timeoutText), 20_000);
    return () => window.clearTimeout(timer);
  }, [session, loaded, error, timeoutText]);
  useEffect(() => {
    if (!session) return;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== new URL(session.uiUrl).origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.nonce !== session.nonce ||
        ![
          "veyndo.payment.ready",
          "veyndo.payment.changed",
          "veyndo.payment.redirect",
        ].includes(event.data?.type)
      )
        return;
      if (event.data.type === "veyndo.payment.ready") {
        setLoaded(true);
        setError("");
      } else if (event.data.type === "veyndo.payment.redirect") {
        if (approvalUrl && event.data.url === approvalUrl)
          window.location.assign(approvalUrl);
      } else changed.current();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [session, approvalUrl]);
  useEffect(() => {
    if (!session || loaded || error) return;
    // Cached documents and delayed SDK loading must not lose the single onLoad handshake.
    const timer = window.setInterval(() => {
      frame.current?.contentWindow?.postMessage(
        {
          type: "veyndo.payment.init",
          sessionToken: session.sessionToken,
          nonce: session.nonce,
        },
        new URL(session.uiUrl).origin,
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [session, loaded, error]);
  return (
    <div className="embedded-payment">
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="shop-secondary"
            onClick={() => setReload((n) => n + 1)}
          >
            {x("paymentReload")}
          </button>
          {approvalUrl && (
            <a
              className="shop-primary"
              href={approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {x("continueProvider")}
            </a>
          )}
        </div>
      ) : (
        !loaded && <p role="status">{x("paymentLoading")}</p>
      )}
      {session && (
        <iframe
          ref={frame}
          title={x("securePayment")}
          hidden={Boolean(error)}
          src={session.uiUrl}
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-popups-to-escape-sandbox"
          allow="payment"
          style={{
            width: "100%",
            minHeight: 380,
            border: 0,
            visibility: "visible",
          }}
          onLoad={() => {
            if (!session.readySignal) {
              setLoaded(true);
              setError("");
            }
            frame.current?.contentWindow?.postMessage(
              {
                type: "veyndo.payment.init",
                sessionToken: session.sessionToken,
                nonce: session.nonce,
              },
              new URL(session.uiUrl).origin,
            );
          }}
        />
      )}
    </div>
  );
}
