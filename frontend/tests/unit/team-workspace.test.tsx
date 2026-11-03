/** Team creation and delayed role loading preserve native account requests and explicit least privilege. */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { LocaleScope } from "../../src/shared/i18n/i18n";
import CreateWorkspace from "../../src/admin/team/CreateWorkspace";
import UsersManager from "../../src/admin/team/UsersManager";
import { session } from "./fixtures";
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LocaleScope locale="en-GB">{children}</LocaleScope>
);
it("suggests an editable shop identifier and keeps the explicit choice when its name changes", async () => {
  const user = userEvent.setup(),
    create = vi.fn(async () => {}),
    cancel = vi.fn();
  const page = render(
    <CreateWorkspace busy={false} onCreate={create} onCancel={cancel} />,
    { wrapper },
  );
  await user.type(screen.getByLabelText("Shop name"), "Möbel Atelier");
  expect(screen.getByLabelText("Shop ID")).toHaveValue("mobel-atelier");
  await user.clear(screen.getByLabelText("Shop ID"));
  await user.type(screen.getByLabelText("Shop ID"), "atelier-2026");
  await user.type(screen.getByLabelText("Shop name"), " North");
  expect(screen.getByLabelText("Shop ID")).toHaveValue("atelier-2026");
  await user.click(screen.getByRole("button", { name: "Create shop" }));
  expect(create).toHaveBeenCalledExactlyOnceWith(
    "Möbel Atelier North",
    "atelier-2026",
  );
  page.rerender(
    <CreateWorkspace busy={true} onCreate={create} onCancel={cancel} />,
  );
  expect(screen.getByRole("button", { name: "Creating shop…" })).toBeDisabled();
  expect(screen.getByLabelText("Shop ID")).toBeDisabled();
});
it("keeps invalid shop identifiers out of native creation and cancels without a write", async () => {
  const user = userEvent.setup(),
    create = vi.fn(async () => {}),
    cancel = vi.fn();
  render(<CreateWorkspace busy={false} onCreate={create} onCancel={cancel} />, {
    wrapper,
  });
  await user.type(screen.getByLabelText("Shop name"), "Test shop");
  const id = screen.getByLabelText("Shop ID") as HTMLInputElement;
  const pattern = new RegExp(`^(?:${id.pattern})$`, "v");
  expect(pattern.test("two-shops")).toBe(true);
  expect(pattern.test("Other/Shop")).toBe(false);
  await user.clear(id);
  await user.type(id, "Other/Shop");
  await user.click(screen.getByRole("button", { name: "Create shop" }));
  expect(create).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(cancel).toHaveBeenCalledOnce();
  expect(create).not.toHaveBeenCalled();
});
function accountNetwork(roles: Promise<unknown>, createError = false) {
  const fetcher = vi.fn(
    async (path: RequestInfo | URL, _init?: RequestInit) => ({
      ok: !(String(path) === "/api/workspaces" && createError),
      status: String(path) === "/api/workspaces" && createError ? 409 : 200,
      json: async () =>
        String(path) === "/api/auth/session"
          ? session
          : String(path) === "/api/auth/access"
            ? { permissions: ["team.manage"] }
            : String(path) === "/api/workspace/roles"
              ? roles
              : String(path) === "/api/workspace/members"
                ? { members: [] }
                : String(path) === "/api/auth/mfa"
                  ? { enabled: false, revision: 0, recoveryCodesRemaining: 0 }
                  : String(path) === "/api/workspaces"
                    ? createError
                      ? { errors: [{ detail: "Workspace ID already exists" }] }
                      : session
                    : {},
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
const roleDefinitions = {
  mainLocale: "en-GB",
  elements: [
    { id: "admin", data: { name: { "en-GB": "Administrator" }, active: true } },
    { id: "viewer", data: { name: { "en-GB": "Viewer" }, active: true } },
  ],
};
it("waits for roles and keeps Viewer selected after asynchronous role options arrive", async () => {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const roles = new Promise((resolve) => {
    finish = resolve;
  });
  const fetcher = accountNetwork(roles);
  render(
    <UsersManager
      token="synthetic-team-test"
      workspace={session.workspace}
      onSession={vi.fn()}
      onWorkspace={vi.fn()}
      onLogout={vi.fn()}
    />,
    { wrapper },
  );
  const role = await screen.findByRole("combobox", {
    name: "Role",
  });
  expect(role).toHaveValue("");
  expect(screen.getByRole("button", { name: "Invite user" })).toBeDisabled();
  await act(async () => finish(roleDefinitions));
  await waitFor(() => expect(role).toHaveValue("viewer"));
  await user.type(
    screen.getByRole("textbox", { name: "Email" }),
    "viewer@example.test",
  );
  await user.click(screen.getByRole("button", { name: "Invite user" }));
  const call = fetcher.mock.calls.find(
    ([p]) => String(p) === "/api/workspace/invitations",
  );
  expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
    role: "viewer",
    email: "viewer@example.test",
  });
});
it("opens native shop creation prominently and preserves the fields after a rejected identifier", async () => {
  const user = userEvent.setup(),
    accepted = vi.fn();
  const fetcher = accountNetwork(Promise.resolve(roleDefinitions), true);
  render(
    <UsersManager
      token="synthetic-team-test"
      workspace={session.workspace}
      onSession={accepted}
      onWorkspace={vi.fn()}
      onLogout={vi.fn()}
    />,
    { wrapper },
  );
  await screen.findByRole("heading", { name: session.user.name });
  await user.click(screen.getByRole("button", { name: "Create shop" }));
  await screen.findByLabelText("Shop name");
  const form = document.getElementById("team-create-workspace")!;
  await user.type(within(form).getByLabelText("Shop name"), "Retry shop");
  await user.click(within(form).getByRole("button", { name: "Create shop" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This shop ID is already in use. Choose another ID and create the shop again.",
  );
  expect(within(form).getByLabelText("Shop name")).toHaveValue("Retry shop");
  expect(within(form).getByLabelText("Shop ID")).toHaveValue("retry-shop");
  const call = fetcher.mock.calls.find(
    ([p]) => String(p) === "/api/workspaces",
  );
  expect(JSON.parse(String(call?.[1]?.body))).toEqual({
    workspaceName: "Retry shop",
    workspaceId: "retry-shop",
  });
  expect(accepted).not.toHaveBeenCalled();
});
