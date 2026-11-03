/** Fine-grained team overrides, revocable invitations and personal session inventory. */
import IntegrationKeys from "../developer/api/IntegrationKeys";
import RolesManager from "./RolesManager";
import PermissionPicker from "./PermissionPicker";
import { usePermissionText } from "./permission-i18n";
import { useCallback, useEffect, useState } from "react";
import { useOperationsText } from "../../shared/i18n/operations-i18n";
import type { RequestFn } from "../shell/studio-types";
export default function AccessManager({ request }: { request: RequestFn }) {
  const pt = usePermissionText();
  const [granted, setGranted] = useState<string[]>([]);
  const { o, locale } = useOperationsText();
  const [members, setMembers] = useState<any[]>([]),
    [invites, setInvites] = useState<any[]>([]),
    [sessions, setSessions] = useState<any[]>([]),
    [scopes, setScopes] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const load = useCallback(async () => {
    const access = await request("/api/auth/access");
    setScopes(access.available);
    setGranted(access.permissions);
    setCanManage(access.permissions.includes("team.manage"));
    if (access.permissions.includes("team.manage")) {
      const v = await request("/api/workspace/members");
      setMembers(v.members);
      setInvites(v.invitations);
    }
    setSessions((await request("/api/auth/sessions")).sessions);
  }, [request]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="studio-page workbench team-access">
      {canManage && (
        <RolesManager request={request} onChanged={() => void load()} />
      )}
      <section className="studio-card">
        <h2>{o("access")}</h2>
        <p>{o("accessHint")}</p>
        {members
          .filter((m) => m.role !== "owner")
          .map((m) => (
            <details key={m.id}>
              <summary>
                {m.name} · {m.email}
              </summary>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={m.permissions === null}
                  onChange={(e) =>
                    setMembers(
                      members.map((x) =>
                        x.id === m.id
                          ? { ...x, permissions: e.target.checked ? null : [] }
                          : x,
                      ),
                    )
                  }
                />
                {pt("inherited")}
              </label>
              {m.permissions !== null && (
                <PermissionPicker
                  available={scopes}
                  granted={granted}
                  disabled={busy}
                  value={m.permissions}
                  onChange={(permissions) =>
                    setMembers(
                      members.map((x) =>
                        x.id === m.id ? { ...x, permissions } : x,
                      ),
                    )
                  }
                />
              )}
              <button
                disabled={busy}
                className="studio-primary"
                onClick={() =>
                  run(() =>
                    request(
                      `/api/workspace/members/${m.id}`,
                      {
                        role: m.role,
                        active: m.active,
                        permissions: m.permissions,
                      },
                      "PUT",
                    ),
                  )
                }
              >
                {o("save")}
              </button>
            </details>
          ))}
        {invites.length > 0 && (
          <>
            <h3>{o("invites")}</h3>
            {invites.map((i) => (
              <div key={i.id} className="operation-row">
                <span>{i.email}</span>
                <span>{new Date(i.expires).toLocaleString(locale)}</span>
                <button
                  disabled={busy}
                  className="studio-secondary"
                  onClick={() =>
                    run(() =>
                      request(
                        `/api/workspace/invitations/${i.id}`,
                        undefined,
                        "DELETE",
                      ),
                    )
                  }
                >
                  {o("revoke")}
                </button>
              </div>
            ))}
          </>
        )}
      </section>
      <section className="studio-card">
        <h2>{o("sessions")}</h2>
        {sessions.map((s) => (
          <div className="operation-row" key={s.id}>
            <span>{new Date(s.createdAt).toLocaleString(locale)}</span>
            {s.current ? (
              <span>{o("current")}</span>
            ) : (
              <button
                disabled={busy}
                className="studio-secondary"
                onClick={() =>
                  run(() =>
                    request(`/api/auth/sessions/${s.id}`, undefined, "DELETE"),
                  )
                }
              >
                {o("revoke")}
              </button>
            )}
          </div>
        ))}
      </section>
      {canManage && <IntegrationKeys request={request} />}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
