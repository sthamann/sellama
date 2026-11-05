/** Native editor handoffs preserve dirty data and retain catalogue permission boundaries. */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import CanvasCommerceEditor from "../../src/admin/catalog/CanvasCommerceEditor";
import { LocaleScope } from "../../src/shared/i18n/i18n";
vi.mock("../../src/admin/catalog/ProductEditor", () => ({
  default: ({
    canWrite,
    onDirtyChange,
  }: {
    canWrite: boolean;
    onDirtyChange: (dirty: boolean) => void;
  }) => (
    <button disabled={!canWrite} onClick={() => onDirtyChange(true)}>
      Change product
    </button>
  ),
}));
it("protects unfinished native edits on return and cancels without losing them", async () => {
  const back = vi.fn(),
    dirty = vi.fn();
  render(
    <LocaleScope locale="en-GB">
      <CanvasCommerceEditor
        kind="product"
        id="chair"
        request={vi.fn(async () => ({ elements: [] }))}
        canWrite
        onBack={back}
        onSaved={() => {}}
        onDirtyChange={dirty}
      />
    </LocaleScope>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Change product" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Back to page overview" }),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(back).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(dirty).toHaveBeenLastCalledWith(true);
  fireEvent.click(
    screen.getByRole("button", { name: "Back to page overview" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(back).toHaveBeenCalledOnce();
});
it("passes read-only permission through and explains how to start editing", async () => {
  render(
    <LocaleScope locale="en-GB">
      <CanvasCommerceEditor
        kind="product"
        id="chair"
        request={vi.fn(async () => ({ elements: [] }))}
        canWrite={false}
        onBack={() => {}}
        onSaved={() => {}}
      />
    </LocaleScope>,
  );
  expect(
    await screen.findByRole("button", { name: "Change product" }),
  ).toBeDisabled();
  expect(screen.getByText(/Read-only/)).toBeVisible();
});
