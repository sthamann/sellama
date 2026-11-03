/** Shared configurable reporting canvas; late data is fenced by request identity, filters and current rights. */
import { useEffect, useRef, useState } from "react";
import type { RequestFn } from "../../shared/api/types";
import Icon from "../../shared/ui/Icon";
import { useReportText } from "./report-i18n";
import {
  kinds,
  moveWidget,
  trafficAllowed,
  type ReportLayout,
  type ReportData,
} from "./model";
import ReportFilters from "./ReportFilters";
import ReportCard from "./ReportCard";
import { downloadReport } from "./export";
import "./reports.css";
export default function ReportBoard({
  layout,
  onChange,
  request,
  rights,
  save,
  saving,
  saved,
}: {
  layout: ReportLayout;
  onChange: (v: ReportLayout) => void;
  request: RequestFn;
  rights: string[];
  save?: () => void;
  saving?: boolean;
  saved?: boolean;
}) {
  const t = useReportText(),
    [editing, setEditing] = useState(false),
    [adding, setAdding] = useState(false),
    [attempt, setAttempt] = useState(0),
    [error, setError] = useState(false),
    [drop, setDrop] = useState<string | null>(null);
  const [result, setResult] = useState<{
    key: string;
    authority: string;
    request: RequestFn;
    data: ReportData;
  }>();
  const drag = useRef<string | null>(null);
  const authority = JSON.stringify([...rights].sort());
  const key = JSON.stringify([layout.query, authority]),
    allowed =
      rights.includes("overview.read") || rights.includes("orders.read");
  useEffect(() => {
    let active = true;
    setError(false);
    if (!allowed) return;
    const timer = setTimeout(() => {
      void request("/api/merchant/reports", layout.query)
        .then((data: ReportData) => {
          if (active) setResult({ key, authority, request, data });
        })
        .catch(() => {
          if (active) setError(true);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [request, key, allowed, attempt, rights.join(",")]);
  const metadata =
    result?.request === request && result.authority === authority
      ? result.data
      : undefined;
  const data =
    result?.request === request && result.key === key ? result.data : undefined;
  if (!allowed) return null;
  const widgets = layout.widgets.filter(
    (w) =>
      trafficAllowed(w.kind, rights) &&
      (w.kind !== "products" || rights.includes("catalog.read")),
  );
  const changeWidgets = (items: ReportLayout["widgets"]) =>
    onChange({ ...layout, widgets: items });
  return (
    <section className="report-board" aria-label={t("title")}>
      <div className="report-actions">
        <div>
          <button
            type="button"
            className="studio-primary"
            onClick={() => setAdding(!adding)}
            aria-expanded={adding}
          >
            <Icon name="plus" size={17} />
            {t("add")}
          </button>
          <button
            type="button"
            className="studio-secondary"
            onClick={() => setEditing(!editing)}
            aria-pressed={editing}
          >
            <Icon name="settings" size={16} />
            {t(editing ? "done" : "customize")}
          </button>
        </div>
        <div>
          <button
            type="button"
            className="studio-secondary"
            disabled={!data}
            onClick={() => data && downloadReport(data)}
          >
            {t("export")}
          </button>
          {save && (
            <button
              type="button"
              className="studio-primary"
              disabled={saving}
              onClick={save}
            >
              <Icon name="check" size={17} />
              {t("save")}
            </button>
          )}
        </div>
      </div>
      {saved && (
        <p role="status" className="report-note">
          {t("saved")}
        </p>
      )}
      {adding && (
        <fieldset className="report-library">
          <legend>{t("add")}</legend>
          {kinds.map((kind) => {
            const checked = layout.widgets.some((w) => w.kind === kind);
            const disabled =
              !trafficAllowed(kind, rights) ||
              (kind === "products" && !rights.includes("catalog.read"));
            return (
              <label key={kind}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={
                    disabled || (!checked && layout.widgets.length >= 12)
                  }
                  onChange={() =>
                    changeWidgets(
                      checked
                        ? layout.widgets.filter((w) => w.kind !== kind)
                        : [
                            ...layout.widgets,
                            {
                              id: `report_${crypto.randomUUID().slice(0, 8)}`,
                              kind,
                              view:
                                kind === "products" || kind === "funnel"
                                  ? "table"
                                  : kind === "channels"
                                    ? "bar"
                                    : "line",
                              width: "half",
                            },
                          ],
                    )
                  }
                />
                <Icon
                  name={
                    kind === "channels"
                      ? "layers"
                      : kind === "products"
                        ? "box"
                        : kind === "traffic"
                          ? "people"
                          : kind === "conversion"
                            ? "percent"
                            : "chart"
                  }
                />
                <span>{t(kind)}</span>
                {disabled && <small>{t("permission")}</small>}
              </label>
            );
          })}
        </fieldset>
      )}
      <ReportFilters
        value={layout.query}
        onChange={(query) => {
          if (query.period === "custom" && layout.query.period !== "custom") {
            query = {
              ...query,
              from: data?.filters.from ?? new Date().toISOString().slice(0, 10),
              to: data
                ? new Date(
                    new Date(data.filters.toExclusive).getTime() - 86400000,
                  )
                    .toISOString()
                    .slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            };
          }
          onChange({ ...layout, query });
        }}
        data={metadata}
      />
      {data && (
        <p className="report-range">
          {data.filters.from} —{" "}
          {new Date(new Date(data.filters.toExclusive).getTime() - 86400000)
            .toISOString()
            .slice(0, 10)}{" "}
          · {data.filters.currency} · {data.filters.timezone}
          {data.sandbox && <span>{t("sandbox")}</span>}
        </p>
      )}
      {error ? (
        <div role="alert" className="report-error">
          <p>{t("error")}</p>
          <button
            type="button"
            className="studio-secondary"
            onClick={() => setAttempt((v) => v + 1)}
          >
            {t("reload")}
          </button>
        </div>
      ) : !data ? (
        <div className="report-skeleton" role="status">
          {t("loading")}
        </div>
      ) : (
        <>
          {!widgets.length && <p className="report-note">{t("noReports")}</p>}
          <div className="report-grid">
            {widgets.map((w) => {
              const index = layout.widgets.findIndex((v) => v.id === w.id);
              return (
                <article
                  key={w.id}
                  className={`report-panel report-width-${w.width} ${drop === w.id ? "report-drop" : ""}`}
                  draggable={editing}
                  onDragStart={(e) => {
                    drag.current = w.id;
                    e.dataTransfer.setData("text/plain", w.id);
                  }}
                  onDragEnd={() => {
                    drag.current = null;
                    setDrop(null);
                  }}
                  onDragOver={(e) => {
                    if (editing && drag.current && drag.current !== w.id) {
                      e.preventDefault();
                      setDrop(w.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = layout.widgets.findIndex(
                      (v) => v.id === drag.current,
                    );
                    changeWidgets(moveWidget(layout.widgets, from, index));
                    drag.current = null;
                    setDrop(null);
                  }}
                >
                  {drop === w.id && (
                    <p className="report-drop-label">{t("drop")}</p>
                  )}
                  <header>
                    <h2>{t(w.kind)}</h2>
                    {editing && (
                      <div className="report-order">
                        <button
                          type="button"
                          className="studio-icon-button"
                          disabled={!index}
                          aria-label={`${t("up")}: ${t(w.kind)}`}
                          onClick={() =>
                            changeWidgets(
                              moveWidget(layout.widgets, index, index - 1),
                            )
                          }
                        >
                          <Icon name="chevron-left" />
                        </button>
                        <button
                          type="button"
                          className="studio-icon-button"
                          disabled={index === layout.widgets.length - 1}
                          aria-label={`${t("down")}: ${t(w.kind)}`}
                          onClick={() =>
                            changeWidgets(
                              moveWidget(layout.widgets, index, index + 1),
                            )
                          }
                        >
                          <Icon name="chevron-left" />
                        </button>
                        <button
                          type="button"
                          className="studio-icon-button"
                          aria-label={`${t("remove")}: ${t(w.kind)}`}
                          onClick={() =>
                            changeWidgets(
                              layout.widgets.filter((v) => v.id !== w.id),
                            )
                          }
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    )}
                  </header>
                  {editing && (
                    <div className="report-widget-options">
                      <label>
                        {t("view")}
                        <select
                          value={w.view}
                          onChange={(e) =>
                            changeWidgets(
                              layout.widgets.map((v) =>
                                v.id === w.id
                                  ? {
                                      ...v,
                                      view: e.target.value as typeof w.view,
                                    }
                                  : v,
                              ),
                            )
                          }
                        >
                          {(w.kind === "funnel"
                            ? (["bar", "table"] as const)
                            : w.kind === "products" || w.kind === "channels"
                              ? (["bar", "table"] as const)
                              : (["line", "bar", "table"] as const)
                          ).map((v) => (
                            <option key={v} value={v}>
                              {t(v)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t("size")}
                        <select
                          value={w.width}
                          onChange={(e) =>
                            changeWidgets(
                              layout.widgets.map((v) =>
                                v.id === w.id
                                  ? {
                                      ...v,
                                      width: e.target.value as typeof w.width,
                                    }
                                  : v,
                              ),
                            )
                          }
                        >
                          <option value="half">{t("half")}</option>
                          <option value="full">{t("full")}</option>
                        </select>
                      </label>
                    </div>
                  )}
                  <ReportCard
                    widget={w}
                    data={data}
                    compare={layout.query.compare}
                  />
                </article>
              );
            })}
          </div>
          {!!data.totals.find((v) => v.period === "current")?.simulated && (
            <p className="report-note">
              {t("simulation")}:{" "}
              {data.totals.find((v) => v.period === "current")?.simulated}
            </p>
          )}
        </>
      )}
    </section>
  );
}
