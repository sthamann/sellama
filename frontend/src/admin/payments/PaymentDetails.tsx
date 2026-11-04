/** Read-only transaction observation and native financial history, shared across Studio views. */
import { useState } from "react";
import type { RequestFn } from "../shell/studio-types";
import { useLocale } from "../../shared/i18n/i18n";
import { useOperationsText } from "../../shared/i18n/operations-i18n";
import {
  paymentDetailsWords,
  usePaymentDetailsText,
} from "../../shared/i18n/payment-details-i18n";
import "./payment-details.css";
import { usePaymentDiagnosticText } from "../../shared/i18n/payment-diagnostic-i18n";
type Amount = { amountMinor: number; currency: string; currencyScale: number };
type Entry = Amount & {
  id: string;
  status: string;
  createdAt?: string;
  fees: { kind: "provider" | "platform"; amount: Amount }[];
  net?: Amount;
};
type Details = {
  providerObservation: {
    status: "available" | "unavailable" | "unsupported" | "not_created";
    transaction?: {
      reference: string;
      captures: Entry[];
      authorizations: Entry[];
      refunds: Entry[];
    };
  };
  history: {
    id: number;
    at: string;
    state: string;
    capturedMinor?: number;
    refundedMinor?: number;
  }[];
  jobs: {
    id: string;
    operation: string;
    state: string;
    at: string;
    diagnosticCode?: string | null;
  }[];
  currency: string;
  currencyScale: number;
};
export default function PaymentDetails({
  id,
  request,
}: {
  id: string;
  request: RequestFn;
}) {
  const t = usePaymentDetailsText(),
    explain = usePaymentDiagnosticText(),
    { o } = useOperationsText(),
    { locale } = useLocale();
  const [data, setData] = useState<Details>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await request(`/api/payments/${encodeURIComponent(id)}/details`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const money = (v: Amount) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: v.currency,
    }).format(v.amountMinor / 10 ** v.currencyScale);
  const date = (value: string) => new Date(value).toLocaleString(locale);
  const jobLabel = (key: string) =>
    key in paymentDetailsWords
      ? t(key as keyof typeof paymentDetailsWords)
      : o(key);
  const transaction = data?.providerObservation.transaction;
  return (
    <details
      className="payment-details"
      onToggle={(e) => {
        if (e.currentTarget.open && !data && !busy) void load();
      }}
    >
      <summary>{t("title")}</summary>
      {busy && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <p className="payment-details-hint">{t("readOnly")}</p>
          {data.providerObservation.status !== "available" && (
            <p role="status">{t(data.providerObservation.status)}</p>
          )}
          {transaction && (
            <>
              <p className="payment-reference">{transaction.reference}</p>
              {(["authorizations", "captures", "refunds"] as const).map(
                (group) =>
                  transaction[group].length > 0 && (
                    <section key={group}>
                      <h3>{t(group)}</h3>
                      <ul className="payment-receipts">
                        {transaction[group].map((entry) => (
                          <li key={entry.id}>
                            <div className="payment-receipt-heading">
                              <strong>{money(entry)}</strong>
                              <span>{o(entry.status.toLowerCase())}</span>
                            </div>
                            <small>
                              {entry.id}
                              {entry.createdAt && (
                                <> · {date(entry.createdAt)}</>
                              )}
                            </small>
                            {entry.fees.length > 0 && (
                              <dl>
                                {entry.fees.map((fee, index) => (
                                  <div key={index}>
                                    <dt>{t(fee.kind)}</dt>
                                    <dd>{money(fee.amount)}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            {entry.net && (
                              <dl>
                                <div>
                                  <dt>{t("net")}</dt>
                                  <dd>{money(entry.net)}</dd>
                                </div>
                              </dl>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ),
              )}
            </>
          )}
          <section>
            <h3>{t("history")}</h3>
            {data.history.length === 0 ? (
              <p>{t("noHistory")}</p>
            ) : (
              <ol className="payment-history">
                {data.history.map((item) => (
                  <li key={item.id}>
                    <time dateTime={item.at}>{date(item.at)}</time>
                    <strong>{o(item.state)}</strong>
                  </li>
                ))}
              </ol>
            )}
          </section>
          {data.jobs.length > 0 && (
            <section>
              <h3>{t("commands")}</h3>
              <ul className="payment-history">
                {data.jobs.map((job) => (
                  <li key={job.id}>
                    <time dateTime={job.at}>{date(job.at)}</time>
                    <div className="payment-job-result">
                      {jobLabel(job.operation)} · {jobLabel(job.state)}
                      {["failed", "uncertain"].includes(job.state) &&
                        explain(job.diagnosticCode) && (
                          <p className="payment-job-diagnostic" role="note">
                            {explain(job.diagnosticCode)}
                          </p>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <small>{t("bounded")}</small>
        </>
      )}
      <button
        type="button"
        className="studio-secondary"
        disabled={busy}
        onClick={() => void load()}
      >
        {t("refresh")}
      </button>
    </details>
  );
}
