/** Restore native section navigation after SPA rendering, with cancellation and reduced-motion support. */
import { useEffect } from "react";
export function useStorefrontAnchors(id: string | undefined, path: string) {
  useEffect(() => {
    if (id || !["#assistant", "#collection"].includes(path)) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(path.slice(1))?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [path, id]);
}

/** Keep native product and collection navigation in the storefront shell. */
export function useStorefrontNavigation(
  productId: () => string,
  setId: (id: string) => void,
  setAppPath: (path: string) => void,
) {
  useEffect(() => {
    const hash = () => {
      const id = productId();
      setId(id);
      setAppPath(location.hash);
      if (id) window.scrollTo({ top: 0, behavior: "instant" });
    };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        !link ||
        link.target ||
        link.download ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        !(url.pathname === "/" || url.pathname.startsWith("/products/"))
      )
        return;
      if (["#merchant", "#login", "#platform"].includes(url.hash)) return;
      event.preventDefault();
      history.pushState(null, "", url);
      hash();
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("popstate", hash);
    document.addEventListener("click", navigate);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("popstate", hash);
      document.removeEventListener("click", navigate);
    };
  }, [productId, setId, setAppPath]);
}
