/** Native commerce sections share the channel page document and its existing publication boundary. */
import { effectivePages, type Page } from "./model";

export const commerceSections = {
  product: ["purchase", "details", "assistance", "reviews"],
  category: ["filters", "listing"],
} as const;
export type CommerceLayout = keyof typeof commerceSections;
export const commerceSlug = (kind: CommerceLayout) => `layout-${kind}`;

export function layoutKind(page?: Page): CommerceLayout | undefined {
  if (!page?.content.blocks.some((block) => block.kind === "native")) return;
  if (page.slug === commerceSlug("product")) return "product";
  if (page.slug === commerceSlug("category")) return "category";
}

export function commercePage(
  pages: Page[],
  channel: string,
  kind: CommerceLayout,
) {
  return effectivePages(
    pages.filter((page) => layoutKind(page) === kind),
    channel,
  ).find((page) => page.status !== "archived");
}
