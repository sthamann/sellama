/** Charts and ranked tables consume only the server snapshot, with explicit monetary and observation semantics. */
import { useLocale } from "../../shared/i18n/i18n";
import ReportChart, { type Point } from "./ReportChart";
import { useReportText } from "./report-i18n";
import { emptySales, type ReportData, type Widget } from "./model";
export default function ReportCard({
  widget,
  data,
  compare,
}: {
  widget: Widget;
  data: ReportData;
  compare: boolean;
}) {
  const t = useReportText(),
    { locale } = useLocale();
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: data.filters.currency,
      ...(data.filters.currencyScale === undefined
        ? {}
        : {
            minimumFractionDigits: data.filters.currencyScale,
            maximumFractionDigits: data.filters.currencyScale,
          }),
    }).format(n);
  const count = (n: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(n);
  const percent = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(n);
  const date = (s: string) =>
    new Intl.DateTimeFormat(locale, {
      ...(data.filters.interval === "year"
        ? { year: "numeric" as const }
        : data.filters.interval === "month"
          ? { month: "short" as const, year: "numeric" as const }
          : {
              month: "short" as const,
              day: "numeric" as const,
              year: "2-digit" as const,
            }),
      timeZone: "UTC",
    }).format(new Date(s + "T12:00:00Z"));
  const current = data.totals.find((v) => v.period === "current") ?? emptySales,
    previous = data.totals.find((v) => v.period === "previous") ?? emptySales;
  const traffic = data.traffic?.totals.find((v) => v.period === "current"),
    priorTraffic = data.traffic?.totals.find((v) => v.period === "previous");
  const kind = widget.kind,
    isTraffic = ["traffic", "conversion", "funnel"].includes(kind);
  if (
    (isTraffic && !data.permissions.traffic) ||
    (kind === "products" && !data.permissions.products)
  )
    return <p className="report-note">{t("permission")}</p>;
  const format =
    kind === "conversion"
      ? percent
      : kind === "orders" || kind === "traffic"
        ? count
        : money;
  const since = data.traffic?.coverage.map((c) => c.since).sort()[0];
  const value =
    kind === "traffic"
      ? (traffic?.visits ?? null)
      : kind === "conversion"
        ? traffic?.visits
          ? traffic.converted / traffic.visits
          : null
        : kind in current
          ? Number(current[kind as keyof typeof current])
          : null;
  const old =
    kind === "traffic"
      ? (priorTraffic?.visits ?? null)
      : kind === "conversion"
        ? priorTraffic?.visits
          ? priorTraffic.converted / priorTraffic.visits
          : null
        : kind in previous
          ? Number(previous[kind as keyof typeof previous])
          : null;
  const points: Point[] = data.trend.map((row) => {
    const tr = data.traffic?.daily.find((d) => d.day === row.day),
      covered = !!since && new Date(row.day + "T23:59:59Z") >= new Date(since);
    const amount =
      kind === "traffic"
        ? covered
          ? (tr?.visits ?? 0)
          : null
        : kind === "conversion"
          ? tr?.visits
            ? tr.converted / tr.visits
            : null
          : Number(row[kind as "orders" | "revenue" | "refunds" | "average"]);
    return { label: date(row.day), value: amount };
  });
  const channels = data.channels.map((c) => ({
    name:
      data.filters.channels.find((x) => x.id === c.channel)?.name ?? c.channel,
    revenue: c.revenue,
    count: c.orders,
    id: c.channel,
  }));
  const products = data.products.map((p) => ({
    name: p.name || p.id,
    revenue: p.revenue,
    count: Number(p.quantity),
    id: p.id,
  }));
  const ranked = kind === "channels" ? channels : products;
  if (kind === "products" || kind === "channels")
    return (
      <>
        {!ranked.length ? (
          <p className="report-note">{t("noData")}</p>
        ) : (
          <div className="report-table-wrap">
            <table
              className={`report-table ${widget.view === "bar" ? "report-ranked-bars" : ""}`}
            >
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t(kind === "products" ? "sold" : "orders")}</th>
                  <th>{t("revenue")}</th>
                  {kind === "channels" && data.permissions.traffic && (
                    <>
                      <th>{t("traffic")}</th>
                      <th>{t("conversion")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {ranked.map((row) => (
                  <tr key={row.id}>
                    <th>
                      {row.name}
                      {widget.view === "bar" && (
                        <span className="report-rank-track">
                          <span
                            style={{
                              width: `${Math.max(0, (Number(row.revenue) / Math.max(1, ...ranked.map((x) => Number(x.revenue)))) * 100)}%`,
                            }}
                          />
                        </span>
                      )}
                    </th>
                    <td>{count(row.count)}</td>
                    <td>{money(Number(row.revenue))}</td>
                    {kind === "channels" &&
                      data.permissions.traffic &&
                      (() => {
                        const observed = data.traffic?.channels?.find(
                          (c) => c.channel === row.id,
                        );
                        return (
                          <>
                            <td>{observed ? count(observed.visits) : "—"}</td>
                            <td>
                              {observed?.visits
                                ? percent(observed.converted / observed.visits)
                                : "—"}
                            </td>
                          </>
                        );
                      })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  if (kind === "funnel")
    return (
      <>
        {!traffic ? (
          <p className="report-note">{t("noTraffic")}</p>
        ) : (
          <ol
            className={`report-funnel ${widget.view === "table" ? "report-funnel-table" : ""}`}
          >
            {(
              ["visits", "viewed", "added", "checkout", "converted"] as const
            ).map((key, i) => (
              <li key={key}>
                <span>{t(key === "visits" ? "traffic" : key)}</span>
                <strong>{count(traffic[key])}</strong>
                <span className="report-funnel-track">
                  <span
                    style={{
                      width: `${Math.min(100, (traffic[key] / Math.max(1, traffic.visits)) * 100)}%`,
                    }}
                  />
                </span>
                {i > 0 && (
                  <small>
                    {percent(traffic[key] / Math.max(1, traffic.visits))}
                  </small>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="report-note">{t("trafficBasis")}</p>
      </>
    );
  return (
    <>
      <div className="report-total">
        <strong>{value === null ? "—" : format(value)}</strong>
        {compare && old !== null && (
          <span>
            {t("previous")}: {format(old)}
            {old !== 0 && value !== null && (
              <>
                {" "}
                · {value >= old ? "+" : ""}
                {percent((value - old) / Math.abs(old))}
              </>
            )}
          </span>
        )}
      </div>
      {widget.view === "table" ? (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t(kind)}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <th>{p.label}</th>
                  <td>{p.value === null ? "—" : format(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ReportChart
          title={t(kind)}
          points={points}
          format={format}
          view={widget.view}
        />
      )}
      {isTraffic && !traffic && <p className="report-note">{t("noTraffic")}</p>}
      {isTraffic ? (
        <p className="report-note">
          {t("trafficBasis")}
          {since && (
            <>
              {" "}
              {t("observedSince")}{" "}
              {new Intl.DateTimeFormat(locale).format(new Date(since))}.
            </>
          )}
        </p>
      ) : kind === "revenue" ? (
        <p className="report-note">{t("salesBasis")}</p>
      ) : null}
    </>
  );
}
