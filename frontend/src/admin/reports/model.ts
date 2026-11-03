/** Saved report definitions contain presentation/filter choices only; the server remains the source of every value. */
export type ReportKind =
  | "revenue"
  | "orders"
  | "average"
  | "refunds"
  | "traffic"
  | "conversion"
  | "products"
  | "channels"
  | "funnel";
export type ReportQuery = {
  period: string;
  from?: string | null;
  to?: string | null;
  interval: string;
  timezone: string;
  channel?: string | null;
  channelType: string;
  currency?: string | null;
  compare: boolean;
};
export type Widget = {
  id: string;
  kind: ReportKind;
  view: "line" | "bar" | "table";
  width: "half" | "full";
};
export type ReportLayout = { query: ReportQuery; widgets: Widget[] };
export type SalesTotal = {
  period: string;
  orders: number;
  revenue: string;
  refunds: string;
  average: string;
  simulated: number;
};
export type Trend = {
  day: string;
  orders: number;
  revenue: string;
  refunds: string;
  average: string;
};
export type TrafficTotal = {
  period: string;
  visits: number;
  viewed: number;
  added: number;
  checkout: number;
  converted: number;
  pageviews: number;
};
export type ReportData = {
  totals: SalesTotal[];
  trend: Trend[];
  products: {
    id: string;
    name: string;
    quantity: string;
    revenue: string;
    orders: number;
  }[];
  channels: {
    channel: string;
    kind: string;
    orders: number;
    revenue: string;
    refunds: string;
  }[];
  traffic: null | {
    totals: TrafficTotal[];
    daily: {
      day: string;
      visits: number;
      converted: number;
      pageviews: number;
    }[];
    channels?: { channel: string; visits: number; converted: number }[];
    coverage: { channel: string; since: string; days: number }[];
  };
  filters: {
    from: string;
    toExclusive: string;
    previousFrom: string;
    interval: string;
    timezone: string;
    currency: string;
    currencyScale?: number;
    channels: { id: string; name: string; kind: string }[];
    currencies: string[];
  };
  permissions: { traffic: boolean; products: boolean };
  sandbox: boolean;
};
export const kinds: ReportKind[] = [
  "revenue",
  "orders",
  "average",
  "refunds",
  "traffic",
  "conversion",
  "products",
  "channels",
  "funnel",
];
export function defaultReports(): ReportLayout {
  return {
    query: {
      period: "last30",
      interval: "auto",
      timezone: "UTC",
      channelType: "all",
      compare: true,
    },
    widgets: [
      { id: "sales", kind: "revenue", view: "line", width: "full" },
      { id: "channels", kind: "channels", view: "bar", width: "half" },
      { id: "products", kind: "products", view: "table", width: "half" },
      { id: "visits", kind: "traffic", view: "line", width: "half" },
      { id: "conversion", kind: "conversion", view: "line", width: "half" },
    ],
  };
}
export function moveWidget(widgets: Widget[], from: number, to: number) {
  const next = [...widgets];
  if (from < 0 || to < 0 || from >= next.length || to >= next.length)
    return next;
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
export function trafficAllowed(kind: ReportKind, rights: string[]) {
  return (
    !["traffic", "conversion", "funnel"].includes(kind) ||
    rights.includes("knowledge.read")
  );
}
export const emptySales: SalesTotal = {
  period: "current",
  orders: 0,
  revenue: "0",
  refunds: "0",
  average: "0",
  simulated: 0,
};
