/** Reporting controls, stale-response/right fences, layout composition and safe export use synthetic native aggregates. */
import { useState } from "react";
import { it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import ReportBoard from "../../src/admin/reports/ReportBoard";
import { defaultReports, type ReportData } from "../../src/admin/reports/model";
import { reportCSV } from "../../src/admin/reports/export";
const report: ReportData = {
  totals: [
    {
      period: "current",
      orders: 3,
      revenue: "199.99",
      refunds: "0",
      average: "66.6633",
      simulated: 0,
    },
  ],
  trend: [
    {
      day: "2026-11-01",
      orders: 3,
      revenue: "199.99",
      refunds: "0",
      average: "66.6633",
    },
  ],
  products: [
    {
      id: "p",
      name: "Synthetic lamp",
      quantity: "4",
      revenue: "199.99",
      orders: 3,
    },
  ],
  channels: [
    {
      channel: "counter",
      kind: "pos",
      orders: 3,
      revenue: "199.99",
      refunds: "0",
    },
  ],
  traffic: {
    totals: [
      {
        period: "current",
        visits: 5,
        viewed: 4,
        added: 3,
        checkout: 2,
        converted: 1,
        pageviews: 8,
      },
    ],
    daily: [{ day: "2026-11-01", visits: 5, converted: 1, pageviews: 8 }],
    coverage: [{ channel: "counter", since: "2026-10-20T00:00:00Z", days: 30 }],
  },
  filters: {
    from: "2026-11-01",
    toExclusive: "2026-11-02",
    previousFrom: "2026-10-31",
    interval: "day",
    timezone: "UTC",
    currency: "EUR",
    currencies: ["EUR", "JPY"],
    channels: [{ id: "counter", name: "Synthetic counter", kind: "pos" }],
  },
  permissions: { traffic: true, products: true },
  sandbox: false,
};
const rights = [
  "overview.read",
  "catalog.read",
  "knowledge.read",
  "channels.read",
];
function wrap(node: React.ReactNode) {
  return <LocaleScope locale="en-GB">{node}</LocaleScope>;
}
it("composes reports, saves the same layout and sends native time/channel filters", async () => {
  const user = userEvent.setup(),
    request = vi.fn(async () => report),
    save = vi.fn();
  let latest = defaultReports();
  function Harness() {
    const [layout, setLayout] = useState(latest);
    return wrap(
      <ReportBoard
        layout={layout}
        onChange={(v) => {
          latest = v;
          setLayout(v);
        }}
        request={request}
        rights={rights}
        save={save}
      />,
    );
  }
  render(<Harness />);
  await screen.findByText("Synthetic lamp");
  await user.selectOptions(screen.getByLabelText("Period"), "year");
  await user.selectOptions(screen.getByLabelText("Group by"), "month");
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      "/api/merchant/reports",
      expect.objectContaining({ period: "year", interval: "month" }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Add report" }));
  await user.click(screen.getByRole("checkbox", { name: "Shopping funnel" }));
  expect(latest.widgets.some((w) => w.kind === "funnel")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Arrange reports" }));
  await user.click(
    screen.getByRole("button", { name: "Move up: Shopping funnel" }),
  );
  expect(latest.widgets[latest.widgets.length - 1].kind).not.toBe("funnel");
  await user.click(screen.getByRole("button", { name: "Save overview" }));
  expect(save).toHaveBeenCalledOnce();
});
it("hides cached product/channel data immediately when current rights change", async () => {
  const request = vi.fn(async () => report),
    layout = defaultReports();
  const { rerender } = render(
    wrap(
      <ReportBoard
        layout={layout}
        onChange={vi.fn()}
        request={request}
        rights={rights}
      />,
    ),
  );
  await screen.findByText("Synthetic lamp");
  request.mockImplementation(() => new Promise(() => {}));
  rerender(
    wrap(
      <ReportBoard
        layout={layout}
        onChange={vi.fn()}
        request={request}
        rights={["overview.read"]}
      />,
    ),
  );
  expect(screen.queryByText("Synthetic lamp")).toBeNull();
  expect(screen.queryByText("Synthetic counter")).toBeNull();
  expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
});
it("does not render a late response from the previous shop", async () => {
  let finish!: (v: ReportData) => void;
  const first = vi.fn(() => new Promise<ReportData>((r) => (finish = r)));
  const second = vi.fn(async () => ({ ...report, products: [] }));
  const { rerender } = render(
    wrap(
      <ReportBoard
        layout={defaultReports()}
        onChange={vi.fn()}
        request={first}
        rights={rights}
      />,
    ),
  );
  await waitFor(() => expect(first).toHaveBeenCalled());
  rerender(
    wrap(
      <ReportBoard
        layout={defaultReports()}
        onChange={vi.fn()}
        request={second}
        rights={rights}
      />,
    ),
  );
  finish(report);
  await waitFor(() => expect(second).toHaveBeenCalled());
  expect(screen.queryByText("Synthetic lamp")).toBeNull();
});
it("exports authorized aggregates with exact decimal strings and safe spreadsheet labels", () => {
  const text = reportCSV({
    ...report,
    products: [{ ...report.products[0], name: '=HYPERLINK("evil")' }],
  });
  expect(text).toContain("199.99");
  expect(text).toContain("'=HYPERLINK");
  expect(text).not.toContain("customerEmail");
});
