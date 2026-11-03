/** Native payment balances and observed financial jobs, shared with the order detail controls. */
import { useEffect, useRef, useState } from "react";
import { useAppText } from "../../shared/i18n/app-i18n";
import { useOperationsText } from "../../shared/i18n/operations-i18n";
import type { RequestFn } from "../shell/studio-types";
import PaymentActions from "../payments/PaymentActions";
import type { PaymentOptions, Settlement } from "../payments/payment-amount";
type Data = {
  providers: { id: string; configured: boolean }[];
  attempts: {
    id: string;
    orderId: string;
    state: string;
    currency: string;
    currencyScale: number;
    settlement: Settlement;
  }[];
  jobs: {
    id: string;
    attemptId: string;
    operation: string;
    state: string;
    error?: string;
  }[];
};
export default function PaymentManager({
  request,
  canWrite,
}: {
  request: RequestFn;
  token: string;
  canWrite: boolean;
}) {
  const { a } = useAppText(),
    { o } = useOperationsText();
  const [data, setData] = useState<Data>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Record<string, string>>({});
  const retries = useRef<Record<string, { signature: string; key: string }>>(
    {},
  );
  useEffect(() => {
    let active = true;
    request("/api/payments")
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [request]);
  const observe = async (id: string, job: string) => {
    for (let attempt = 0; attempt < 15; attempt++) {
      const result = await request(`/api/payments/jobs/${job}`);
      setData(await request("/api/payments"));
      if (["succeeded", "failed", "uncertain"].includes(result.state)) {
        setPending((old) => {
          const next = { ...old };
          delete next[id];
          return next;
        });
        if (result.state !== "succeeded") throw new Error(o("providerFailed"));
        delete retries.current[id];
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setError(o("providerPending"));
    return false;
  };
  const command = async (
    id: string,
    operation: string,
    amount?: number,
    options?: PaymentOptions,
  ) => {
    setBusy(true);
    setError("");
    try {
      if (pending[id]) return await observe(id, pending[id]);
      const signature = JSON.stringify({ operation, amount, options });
      if (retries.current[id]?.signature !== signature)
        retries.current[id] = { signature, key: crypto.randomUUID() };
      const result = await request(`/api/payments/${id}/${operation}`, {
        approve: true,
        requestKey: retries.current[id].key,
        ...(amount === undefined ? {} : { amountMinor: amount }),
        ...options,
      });
      setPending((old) => ({ ...old, [id]: result.jobId }));
      return await observe(id, result.jobId);
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="studio-card app-card">
      <h2>{o("payment")}</h2>
      <p>
        {data?.providers.some((p) => p.configured)
          ? a("connected")
          : a("missing")}
      </p>
      {data?.attempts.map((p) => (
        <article className="app-payment" key={p.id}>
          <div className="section-heading">
            <strong>{p.orderId}</strong>
            <span className="operation-status">{o(p.state)}</span>
          </div>
          {
            <PaymentActions
              readOnly={!canWrite}
              state={p.state}
              settlement={p.settlement}
              currency={p.currency}
              scale={p.currencyScale}
              busy={busy}
              pending={
                !!pending[p.id] ||
                !!data.jobs.find(
                  (j) =>
                    j.attemptId === p.id &&
                    ["queued", "running"].includes(j.state),
                )
              }
              onPayment={(op, amount, options) =>
                command(p.id, op, amount, options)
              }
              onCheck={() => void command(p.id, "reconcile")}
            />
          }
        </article>
      ))}
      {error && <p role="alert">{error}</p>}
      <button
        className="studio-secondary"
        disabled={busy}
        onClick={() =>
          void request("/api/payments")
            .then(setData)
            .catch((e) => setError(e.message))
        }
      >
        {a("refresh")}
      </button>
    </section>
  );
}
