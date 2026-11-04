/** Custom packages retain server review, exact consent and revision isolation. */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AppPackageImport from "../../src/admin/apps/AppPackageImport";
import AppConsent from "../../src/admin/apps/AppConsent";
import { LocaleProvider } from "../../src/shared/i18n/i18n";
const review = {
  app: "private-app",
  name: { "en-GB": "Private app" },
  version: "1.6.0",
  digest: "checked-digest",
  permissions: ["payments.manage"],
  added: [],
  previousVersion: "1.2.0",
};
it("reviews a custom manifest before submitting its exact digest and permissions", async () => {
  const request = vi.fn().mockResolvedValue(review),
    imported = vi.fn().mockResolvedValue(undefined);
  render(
    <LocaleProvider>
      <AppPackageImport request={request} onImported={imported} />
    </LocaleProvider>,
  );
  const manifest = { id: "private-app", version: "1.6.0" };
  fireEvent.change(screen.getByLabelText("Import app package"), {
    target: {
      files: [{ size: 200, text: async () => JSON.stringify(manifest) }],
    },
  });
  const button = await screen.findByRole("button", { name: "Upgrade" });
  expect(request).toHaveBeenCalledWith("/api/apps/review", { manifest });
  fireEvent.click(button);
  await waitFor(() => expect(imported).toHaveBeenCalledWith("private-app"));
  expect(request).toHaveBeenLastCalledWith("/api/apps", {
    manifest,
    approve: true,
    digest: "checked-digest",
    permissions: ["payments.manage"],
  });
});
it("rejects oversized files without transmitting them", async () => {
  const request = vi.fn();
  render(
    <LocaleProvider>
      <AppPackageImport request={request} onImported={vi.fn()} />
    </LocaleProvider>,
  );
  fireEvent.change(screen.getByLabelText("Import app package"), {
    target: { files: [{ size: 50000, text: async () => "{}" }] },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JSON");
  expect(request).not.toHaveBeenCalled();
});
it("invalidates consent when the manifest changes while the app ID stays the same", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(review)
    .mockReturnValue(new Promise(() => {}));
  const first = { id: "private-app", version: "1.6.0" },
    next = { ...first, version: "1.7.0" };
  const view = (manifest: Record<string, unknown>) => (
    <LocaleProvider>
      <AppConsent
        app="private-app"
        manifest={manifest}
        request={request}
        onCancel={vi.fn()}
        onInstall={vi.fn()}
      />
    </LocaleProvider>
  );
  const ui = render(view(first));
  expect(await screen.findByRole("button", { name: "Upgrade" })).toBeEnabled();
  ui.rerender(view(next));
  expect(screen.getByRole("button", { name: "Install" })).toBeDisabled();
});
