/** One media contract keeps 3D files out of image-only thumbnails and commerce summaries. */
export type ProductMedia = {
  id: string;
  url: string;
  view: string;
  type?: "image" | "model";
  modelVariant?: string | null;
};
export const isModel = (media: Pick<ProductMedia, "type">) =>
  media.type === "model";
export const mediaImage = (media?: Pick<ProductMedia, "type" | "url">[]) =>
  media?.find((item) => !isModel(item))?.url;

/** Binary subrequests carry only public channel/product selectors; Studio preview still requires the personal cookie. */
export function modelURL(url: string, productId?: string, preview = false) {
  const source = new URL(url, location.origin);
  if (
    source.origin !== location.origin ||
    !source.pathname.startsWith("/store-api/assets/")
  )
    return "";
  if (preview)
    source.pathname = source.pathname.replace(
      "/store-api/assets/",
      "/api/merchant/assets/",
    );
  if (productId && !preview) source.searchParams.set("productId", productId);
  const channel = new URLSearchParams(location.search).get("channel");
  if (channel && !preview) source.searchParams.set("channel", channel);
  return source.pathname + source.search;
}
