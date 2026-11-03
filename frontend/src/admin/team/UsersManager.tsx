/** Users Manager: Personal accounts, memberships, roles, invitations and scoped developer access.. */
import type { WorkspaceRole } from "./RolesManager";
import { contentText } from "../../shared/i18n/content-language";
import { usePermissionText } from "./permission-i18n";
import Icon from "../../shared/ui/Icon";
import CreateWorkspace from "./CreateWorkspace";
import { useWorkspaceCreateText } from "./workspace-create-i18n";
import "../styles/team-workspace.css";
import { useCallback, useEffect, useState } from "react";
import { shopApi } from "../../shared/api/shop-api";
import { useShopText } from "../../shared/i18n/shop-i18n";
import "../styles/commerce-manager.css";
import PersonalAccountForm from "./PersonalAccountForm";
import AccountSecurity from "../../shared/auth/AccountSecurity";
import type { Session } from "../../shared/api/account-types";
export type { Session } from "../../shared/api/account-types";
type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
export default function UsersManager({
  token,
  workspace,
  onSession,
  onWorkspace,
  onLogout,
}: {
  token: string;
  workspace: string;
  onSession: (s: Session) => void;
  onWorkspace: (id: string, name: string) => void;
  onLogout: () => void;
}) {
  const { s, locale } = useShopText();
  const pt = usePermissionText(),
    ct = useWorkspaceCreateText();
  const [roleDefinitions, setRoleDefinitions] = useState<WorkspaceRole[]>([]),
    [main, setMain] = useState("en-GB"),
    [grants, setGrants] = useState<string[]>([]);
  const roleName = (id: string) =>
    contentText(
      roleDefinitions.find((r) => r.id === id)?.data.name ?? {},
      locale,
      main,
    ) || s(id);
  const [mode, setMode] = useState("login");
  const [creating, setCreating] = useState(false);
  const [createdShop, setCreatedShop] = useState<{
    id: string;
    name: string;
  }>();
  const [inviteRole, setInviteRole] = useState("viewer");
  const [session, setSession] = useState<Session>();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [invitation, setInvitation] = useState("");
  const role = session?.workspaces.find((w) => w.id === workspace)?.role;
  const canManage = grants.includes("team.manage");
  const invitationRoles = roleDefinitions.filter(
    (r) => r.data.active && (r.id !== "owner" || role === "owner"),
  );
  const inviteAllowed = invitationRoles.some((r) => r.id === inviteRole);
  useEffect(() => {
    setInviteRole("viewer");
    setCreating(false);
    setCreatedShop(undefined);
  }, [workspace]);
  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await shopApi<Session>(
      "/api/auth/session",
      undefined,
      undefined,
      undefined,
      token,
    );
    setSession(data);
    const access = await shopApi<any>(
      "/api/auth/access",
      undefined,
      undefined,
      undefined,
      token,
    );
    setGrants(access.permissions);
    if (access.permissions.includes("team.manage")) {
      const definitions = await shopApi<any>(
        "/api/workspace/roles",
        undefined,
        undefined,
        undefined,
        token,
      );
      setRoleDefinitions(definitions.elements);
      setMain(definitions.mainLocale);
      setMembers(
        (
          await shopApi<{ members: Member[] }>(
            "/api/workspace/members",
            undefined,
            undefined,
            undefined,
            token,
          )
        ).members,
      );
    } else {
      setMembers([]);
      setRoleDefinitions([]);
    }
  }, [token, workspace, locale]);
  useEffect(() => {
    if (!token) {
      setSession(undefined);
      setMembers([]);
      return;
    }
    refresh().catch((e) => {
      setSession(undefined);
      setMembers([]);
      setError(e.message);
    });
  }, [refresh, token]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="commerce-manager users-manager">
      <div className="commerce-title">
        <div>
          <h1>{s("users")}</h1>
          <p>{s("workspaceHint")}</p>
        </div>
        {session && !creating && (
          <button
            className="studio-primary"
            disabled={busy}
            aria-expanded={creating}
            aria-controls="team-create-workspace"
            onClick={() => {
              setCreating(true);
              setError("");
            }}
          >
            <Icon name="plus" size={18} />
            {s("register")}
          </button>
        )}
      </div>
      {session && creating && (
        <CreateWorkspace
          busy={busy}
          onCancel={() => setCreating(false)}
          onCreate={(workspaceName, workspaceId) =>
            run(async () => {
              const created = await shopApi<Session>(
                "/api/workspaces",
                { workspaceName, workspaceId },
                undefined,
                undefined,
                token,
              );
              onSession(created);
              setCreating(false);
              setCreatedShop({ id: created.workspace, name: workspaceName });
            })
          }
        />
      )}
      {createdShop && (
        <div className="team-created" role="status">
          <div>
            <strong>{ct("created")}</strong>
            <p>{createdShop.name}</p>
          </div>
          <button
            className="studio-primary"
            onClick={() => onWorkspace(createdShop.id, createdShop.name)}
          >
            {ct("open")}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      )}
      {error && (
        <p className="commerce-error" role="alert">
          {error}
        </p>
      )}
      {!session ? (
        <section className="commerce-card">
          <p>{s("personalAccess")}</p>
          <div className="account-tabs">
            {["login", "register", "join"].map((m) => (
              <button
                className="studio-secondary"
                key={m}
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
              >
                {s(m)}
              </button>
            ))}
          </div>
          <PersonalAccountForm
            run={run}
            mode={mode}
            onSession={onSession}
            s={s}
            busy={busy}
          />
        </section>
      ) : (
        <>
          <div className="team-personal-grid">
            <section className="commerce-card">
              <h2>{session.user.name}</h2>
              <p>{session.user.email}</p>
              <label>
                {s("workspace")}
                <select
                  value={workspace}
                  onChange={(e) => {
                    const w = session.workspaces.find(
                      (w) => w.id === e.target.value,
                    )!;
                    onWorkspace(w.id, w.name);
                  }}
                >
                  {session.workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {roleName(w.role)}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            <AccountSecurity
              token={token}
              onLogout={onLogout}
              onSession={onSession}
            />
          </div>
          {canManage && (
            <>
              <section className="commerce-card">
                <h2>{s("invite")}</h2>
                <form
                  className="account-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (busy || !inviteAllowed) return;
                    const form = new FormData(e.currentTarget);
                    run(async () => {
                      const v = await shopApi<{ token: string }>(
                        "/api/workspace/invitations",
                        Object.fromEntries(form),
                        undefined,
                        undefined,
                        token,
                      );
                      setInvitation(v.token);
                      await refresh();
                    });
                  }}
                >
                  <label>
                    {s("email")}
                    <input name="email" type="email" required />
                  </label>
                  <label>
                    {s("role")}
                    <select
                      name="role"
                      required
                      value={inviteAllowed ? inviteRole : ""}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="" disabled>
                        {s("role")}
                      </option>
                      {invitationRoles.map(({ id: r }) => (
                        <option key={r} value={r}>
                          {roleName(r)} ({r})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="studio-primary"
                    disabled={busy || !inviteAllowed}
                  >
                    {s("invite")}
                  </button>
                </form>
                {invitation && (
                  <div className="invite-code">
                    <p role="status">{s("inviteCreated")}</p>
                    <label>
                      {s("invitationToken")}
                      <input
                        readOnly
                        value={invitation}
                        onFocus={(e) => e.target.select()}
                      />
                    </label>
                  </div>
                )}
              </section>
              <section className="commerce-card">
                <h2>{s("members")}</h2>
                <p>{pt("roleHint")}</p>
                {members.map((m) => (
                  <div className="member-row" key={m.id}>
                    <div>
                      <strong>{m.name}</strong>
                      <small>{m.email}</small>
                    </div>
                    <select
                      aria-label={`${s("role")} ${m.name}`}
                      value={m.role}
                      disabled={
                        busy || (role !== "owner" && m.role === "owner")
                      }
                      onChange={(e) => {
                        const next = e.target.value;
                        run(async () => {
                          await shopApi(
                            `/api/workspace/members/${m.id}`,
                            { role: next, active: m.active },
                            undefined,
                            "PUT",
                            token,
                          );
                          await refresh();
                        });
                      }}
                    >
                      {roleDefinitions
                        .filter(
                          (r) =>
                            (r.data.active &&
                              (r.id !== "owner" ||
                                role === "owner" ||
                                m.role === "owner")) ||
                            r.id === m.role,
                        )
                        .map(({ id: r }) => (
                          <option value={r} key={r}>
                            {roleName(r)} ({r})
                          </option>
                        ))}
                    </select>
                    <button
                      className="studio-secondary"
                      disabled={
                        busy || (role !== "owner" && m.role === "owner")
                      }
                      onClick={() =>
                        run(async () => {
                          await shopApi(
                            `/api/workspace/members/${m.id}`,
                            { role: m.role, active: !m.active },
                            undefined,
                            "PUT",
                            token,
                          );
                          await refresh();
                        })
                      }
                    >
                      {s(m.active ? "deactivate" : "activate")}
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
}
