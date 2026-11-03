/** Export only the already authorized aggregate snapshot; escape spreadsheet formulas in merchant labels. */
import type { ReportData } from "./model";
export function reportCSV(data: ReportData) {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const rows: unknown[][] = [
    ["currency", data.filters.currency],
    ["from", data.filters.from],
    ["toExclusive", data.filters.toExclusive],
    ["timezone", data.filters.timezone],
    ["interval", data.filters.interval],
    [],
    ["period", "orders", "revenue", "refunds", "average", "simulated"],
    ...data.totals.map((v) => [
      v.period,
      v.orders,
      v.revenue,
      v.refunds,
      v.average,
      v.simulated,
    ]),
    [],
    ["day", "orders", "revenue", "refunds", "average"],
    ...data.trend.map((v) => [
      v.day,
      v.orders,
      v.revenue,
      v.refunds,
      v.average,
    ]),
    [],
    ["channel", "orders", "revenue", "refunds"],
    ...data.channels.map((v) => [
      data.filters.channels.find((c) => c.id === v.channel)?.name ?? v.channel,
      v.orders,
      v.revenue,
      v.refunds,
    ]),
    [],
    ["product", "quantity", "revenue"],
    ...data.products.map((v) => [v.name, v.quantity, v.revenue]),
  ];
  if (data.permissions.traffic && data.traffic) {
    rows.push(
      [],
      [
        "period",
        "observed_contexts",
        "product_viewed",
        "cart_added",
        "checkout",
        "converted",
        "pageviews",
      ],
      ...data.traffic.totals.map((v) => [
        v.period,
        v.visits,
        v.viewed,
        v.added,
        v.checkout,
        v.converted,
        v.pageviews,
      ]),
      [],
      ["day", "observed_contexts", "converted", "pageviews"],
      ...data.traffic.daily.map((v) => [
        v.day,
        v.visits,
        v.converted,
        v.pageviews,
      ]),
    );
  }
  return "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}
export function downloadReport(data: ReportData) {
  const url = URL.createObjectURL(
    new Blob([reportCSV(data)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `reports-${data.filters.from}-${data.filters.currency}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
