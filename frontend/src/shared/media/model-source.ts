/** Private model previews reuse explicit browser-session transport; temporary preview bytes stay in a revocable blob, with no credential in the URL. */
import { browserCredential, browserRequest } from "../api/browser-session";
export async function modelSource(url: string, signal: AbortSignal) {
  if (!url.startsWith("/api/merchant/assets/"))
    return { url, release: () => {} };
  const response = await fetch(
    url,
    browserRequest(url, {
      signal,
      headers: { Authorization: `Bearer ${browserCredential()}` },
    }),
  );
  if (
    !response.ok ||
    response.headers.get("content-type") !== "model/gltf-binary"
  )
    throw new Error("Model preview unavailable");
  const blob = await response.blob();
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (!blob.size || blob.size > 20 * 1024 * 1024)
    throw new Error("Invalid model preview size");
  const source = URL.createObjectURL(blob);
  return { url: source, release: () => URL.revokeObjectURL(source) };
}
