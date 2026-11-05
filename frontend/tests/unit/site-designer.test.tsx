/** Register package-owned cases and isolate browser frame rendering in component-level tests. */
import { vi } from "vitest";
vi.mock(
  "../../../extensions/apps/site-builder/studio/StorefrontCanvas",
  () => ({
    default: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="actual-storefront">
        {children || "Native storefront"}
      </div>
    ),
  }),
);
vi.mock("../../src/admin/catalog/CanvasCommerceEditor", () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <section>
      <h2>Native data editor</h2>
      <button onClick={onBack}>Back to canvas</button>
    </section>
  ),
}));
import "../../../extensions/apps/site-builder/tests/designer-cases";
import "../../../extensions/apps/site-builder/tests/onboarding-cases";
import "../../../extensions/apps/site-builder/tests/overview-cases";
