/** Resolve and observe the existing host theme without loading App records or gaining bridge authority. */
export function appTheme(frame: HTMLIFrameElement | null): "light" | "dark" {
  return frame && getComputedStyle(frame).colorScheme === "dark"
    ? "dark"
    : "light";
}
export function observeAppTheme(
  frame: HTMLIFrameElement | null,
  notify: (theme: "light" | "dark") => void,
) {
  const owner = frame?.closest("[data-theme]");
  const observer = new MutationObserver(() => notify(appTheme(frame)));
  if (owner)
    observer.observe(owner, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  return () => observer.disconnect();
}
