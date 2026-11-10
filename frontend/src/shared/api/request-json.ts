/** Coalesce simultaneous identical core reads with complete identity; no persisted response cache. */
import {
  reportMerchantSessionFailure,
  merchantRequestSuspended,
} from "./merchant-session";
import { readAgentStream, type AgentStreamEvent } from "./agent-stream";
import {
  browserRequest,
  browserSessionMarker,
  browserSessionScope,
} from "./browser-session";
type JsonResponse = {
  value: any;
  ok: boolean;
  status: number;
  statusText: string;
  checkoutAdmissionRefused?: boolean;
};
const pending = new Map<string, Promise<JsonResponse>>();
let generation = 0;
export async function requestJson(
  path: string,
  init: RequestInit,
  onEvent?: AgentStreamEvent,
): Promise<JsonResponse> {
  if (merchantRequestSuspended(path, init.headers))
    return {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      value: {
        errors: [{ detail: "Session or integration key expired or invalid" }],
      },
    };
  const method = (init.method ?? "GET").toUpperCase();
  const prepared = browserRequest(path, init);
  const merchantProof =
    new Headers(init.headers).get("authorization") ===
    `Bearer ${browserSessionMarker}`
      ? browserSessionScope()
      : undefined;
  const read =
    !init.signal &&
    !onEvent &&
    !path.startsWith("/api/apps/") &&
    (method === "GET" ||
      (method === "POST" &&
        [
          "/store-api/product",
          "/api/search/product",
          "/api/search/order",
        ].includes(path)));
  if (!read) {
    generation++;
    pending.clear();
  }
  const headers = [...new Headers(prepared.headers).entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const key = JSON.stringify([
    generation,
    path,
    method,
    headers,
    init.body,
    prepared.credentials,
    init.mode,
  ]);
  const existing = read ? pending.get(key) : undefined;
  if (existing) return structuredClone(await existing);
  const operation = (async () => {
    const response = await fetch(path, prepared);
    const value =
      response.ok &&
      response.headers?.get("content-type")?.includes("text/event-stream")
        ? await readAgentStream(response, onEvent)
        : await response.json();
    if (merchantProof === undefined || merchantProof === browserSessionScope())
      reportMerchantSessionFailure(
        path,
        init.headers,
        value.errors?.[0]?.status ?? response.status,
        value.errors?.[0]?.detail,
      );
    return {
      value,
      ok: response.ok && !value.errors,
      status: value.errors?.[0]?.status ?? response.status,
      statusText: response.statusText,
      ...(response.status === 429 &&
      value.errors?.[0]?.retryable === true &&
      response.headers?.get("x-veyndo-checkout-admission") === "refused" &&
      response.headers?.get("retry-after") === "1"
        ? { checkoutAdmissionRefused: true }
        : {}),
    };
  })();
  const admitted = read && pending.size < 128;
  if (admitted) pending.set(key, operation);
  try {
    return structuredClone(await operation);
  } finally {
    if (pending.get(key) === operation) pending.delete(key);
    if (!read) {
      generation++;
      pending.clear();
    }
  }
}
