/** One filter bar controls the same native report query in Shop today and personal areas. */
import type { ReportData, ReportQuery } from "./model";
import { useReportText } from "./report-i18n";
export default function ReportFilters({
  value,
  onChange,
  data,
}: {
  value: ReportQuery;
  onChange: (q: ReportQuery) => void;
  data?: ReportData;
}) {
  const t = useReportText();
  const set = (patch: Partial<ReportQuery>) => onChange({ ...value, ...patch });
  return (
    <div className="report-filters">
      <label>
        {t("period")}
        <select
          value={value.period}
          onChange={(e) => set({ period: e.target.value })}
        >
          {(
            [
              "today",
              "yesterday",
              "week",
              "last7",
              "last30",
              "last90",
              "month",
              "lastMonth",
              "year",
              "lastYear",
              "all",
              "custom",
            ] as const
          ).map((v) => (
            <option key={v} value={v}>
              {t(v)}
            </option>
          ))}
        </select>
      </label>
      {value.period === "custom" && (
        <>
          <label>
            {t("from")}
            <input
              type="date"
              value={value.from ?? ""}
              onChange={(e) => set({ from: e.target.value })}
            />
          </label>
          <label>
            {t("to")}
            <input
              type="date"
              value={value.to ?? ""}
              onChange={(e) => set({ to: e.target.value })}
            />
          </label>
        </>
      )}
      <label>
        {t("interval")}
        <select
          value={value.interval}
          onChange={(e) => set({ interval: e.target.value })}
        >
          {(["auto", "day", "week", "month", "year"] as const).map((v) => (
            <option key={v} value={v}>
              {t(v === "auto" ? v : `${v}Group`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("currency")}
        <select
          value={value.currency ?? data?.filters.currency ?? ""}
          onChange={(e) => set({ currency: e.target.value })}
        >
          {!data && <option value="">{t("loading")}</option>}
          {data?.filters.currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("channelType")}
        <select
          value={value.channelType}
          onChange={(e) => set({ channelType: e.target.value, channel: null })}
        >
          {(
            ["all", "storefront", "headless", "marketplace", "pos"] as const
          ).map((v) => (
            <option key={v} value={v}>
              {t(v === "all" ? "allTypes" : v)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("channel")}
        <select
          value={value.channel ?? ""}
          onChange={(e) => set({ channel: e.target.value || null })}
        >
          <option value="">{t("allChannels")}</option>
          {data?.filters.channels
            .filter(
              (c) =>
                value.channelType === "all" || c.kind === value.channelType,
            )
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        {t("timezone")}
        <select
          value={value.timezone}
          onChange={(e) => set({ timezone: e.target.value })}
        >
          {[
            ...new Set([
              value.timezone,
              "UTC",
              Intl.DateTimeFormat().resolvedOptions().timeZone,
              "Europe/Berlin",
              "America/New_York",
              "Asia/Tokyo",
            ]),
          ].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="report-compare">
        <input
          type="checkbox"
          checked={value.compare}
          onChange={(e) => set({ compare: e.target.checked })}
        />
        {t("compare")}
      </label>
    </div>
  );
}
