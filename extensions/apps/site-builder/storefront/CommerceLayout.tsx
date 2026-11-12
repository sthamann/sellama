/** Render a published channel template around the storefront's original commerce controls. */
import { Fragment, useContext, type ReactNode } from "react";
import { getContentLocale } from "../../../../frontend/src/shared/api/shop-api";
import { useAppRegistry } from "../../../../frontend/src/shared/apps/AppSurfaces";
import { StorefrontContext } from "../../../../frontend/src/storefront/shell/StorefrontContext";
import { productURL } from "../../../../frontend/src/storefront/catalog/product-url";
import { inheritedTheme, explicitTheme } from "../model";
import { commercePage, type CommerceLayout as Kind } from "../commerce-layout";
import { usePublishedSite } from "./PublishedSite";
import SiteRenderer from "../Renderer";

export default function CommerceLayout({
  kind,
  sections,
}: {
  kind: Kind;
  sections: Record<string, ReactNode>;
}) {
  const { pages } = usePublishedSite();
  const { request, mainLocale } = useAppRegistry();
  const shop = useContext(StorefrontContext);
  const page = shop ? commercePage(pages, shop.salesChannel, kind) : undefined;
  if (!page || !shop)
    return (
      <>
        {Object.entries(sections).map(([id, section]) => (
          <Fragment key={id}>{section}</Fragment>
        ))}
      </>
    );
  const { salesChannel, products, add } = shop;
  return (
    <SiteRenderer
      page={page}
      products={products}
      theme={{
        ...inheritedTheme(pages, salesChannel),
        ...explicitTheme(page.theme),
      }}
      language={getContentLocale()}
      mainLocale={mainLocale}
      channel={salesChannel}
      request={request}
      nativeSections={sections}
      onProduct={(id) => {
        const product = products.find((p) => p.id === id);
        if (product) location.href = productURL(product);
      }}
      onAdd={(id) => void add(id, 1)}
    />
  );
}
