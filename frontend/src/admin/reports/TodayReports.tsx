/** Shop-today presentation is saved in the existing actor-private revisioned workspace, never in shop configuration. */
import { useEffect, useRef, useState } from "react";
import { useStudio } from "../shell/StudioContext";
import type { WorkspaceRecord } from "../workspace/workspace-model";
import { useReportText } from "./report-i18n";
import { defaultReports, type ReportLayout } from "./model";
import ReportBoard from "./ReportBoard";
export default function TodayReports() {
  const { request, liveRequest, workspace, access } = useStudio(),
    t = useReportText();
  const [record, setRecord] = useState<{
      request: typeof liveRequest;
      record: WorkspaceRecord;
    }>(),
    [layout, setLayout] = useState<ReportLayout>(defaultReports),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [attempt, setAttempt] = useState(0);
  const scope = useRef(0);
  useEffect(() => {
    const generation = ++scope.current;
    let active = true;
    setError(false);
    setBusy(false);
    setSaved(false);
    void liveRequest("/api/studio/workspace")
      .then((record: WorkspaceRecord) => {
        if (active) {
          setRecord({ request: liveRequest, record });
          setLayout(record.data.todayReports ?? defaultReports());
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      if (scope.current === generation) scope.current++;
    };
  }, [workspace, liveRequest, attempt]);
  const current = record?.request === liveRequest ? record.record : undefined;
  const save = async () => {
    if (!current || busy) return;
    const generation = scope.current;
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const next = await liveRequest(
        "/api/studio/workspace",
        {
          revision: current.revision,
          data: { ...current.data, todayReports: layout },
        },
        "PUT",
      );
      if (generation === scope.current) {
        setRecord({ request: liveRequest, record: next });
        setSaved(true);
      }
    } catch {
      if (generation === scope.current) setError(true);
    } finally {
      if (generation === scope.current) setBusy(false);
    }
  };
  if (error && !current)
    return (
      <div className="report-error" role="alert">
        <p>{t("error")}</p>
        <button
          className="studio-secondary"
          onClick={() => setAttempt((v) => v + 1)}
        >
          {t("reload")}
        </button>
      </div>
    );
  if (!current) return <p role="status">{t("loading")}</p>;
  return (
    <>
      {error && (
        <div role="alert" className="report-error">
          <p>{t("saveError")}</p>
          <button className="studio-secondary" onClick={() => void save()}>
            {t("save")}
          </button>
          <button
            className="studio-secondary"
            onClick={() => setAttempt((v) => v + 1)}
          >
            {t("reload")}
          </button>
        </div>
      )}
      <ReportBoard
        layout={layout}
        onChange={(v) => {
          setLayout(v);
          setSaved(false);
        }}
        request={request}
        rights={access}
        save={() => void save()}
        saving={busy}
        saved={saved}
      />
    </>
  );
}
