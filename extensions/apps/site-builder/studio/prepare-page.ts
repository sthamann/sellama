/** Agent work starts from a native saved page revision, including a scoped copy of an inherited home. */
import { homeDraft } from "./home-draft";
import type { Designer } from "./useDesigner";
import type { HomeSnapshot } from "./StorefrontCanvas";
export async function preparePage(
  d: Designer,
  writable: boolean,
  onSetup: () => void,
  snapshot: HomeSnapshot | undefined,
  mainLocale: string,
  language: string,
  unavailable: string,
) {
  if (!writable) {
    onSetup();
    return;
  }
  if (
    d.draft?.revision &&
    !d.dirty &&
    (d.draft.channel !== "*" || d.channel === "*")
  )
    return d.draft;
  const candidate =
    d.draft ??
    (snapshot
      ? homeDraft(
          d.channel,
          mainLocale,
          language,
          d.context!.catalogue.elements,
          snapshot,
        )
      : undefined);
  if (!candidate) {
    d.setError(unavailable);
    return;
  }
  return d.save(candidate);
}
