/** Private model bytes require the same explicit browser transport as native Studio requests. */
import { afterEach, expect, it, vi } from "vitest";
import { modelSource } from "../../src/shared/media/model-source";
import { activateBrowserSession } from "../../src/shared/api/browser-session";
afterEach(() => vi.unstubAllGlobals());
it("uses explicit authenticated transport and releases private preview bytes", async () => {
  const proof = "a".repeat(64);
  activateBrowserSession({ browserSession: true, browserCsrf: proof });
  const request = vi.fn(
    async (_url: string, _options: RequestInit) =>
      new Response("glb", {
        headers: { "content-type": "model/gltf-binary" },
      }),
  );
  vi.stubGlobal("fetch", request);
  const create = vi
    .spyOn(URL, "createObjectURL")
    .mockReturnValue("blob:preview");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const source = await modelSource(
    "/api/merchant/assets/model?shop=unit-shop",
    new AbortController().signal,
  );
  const options = request.mock.calls[0][1] as RequestInit;
  expect(options.credentials).toBe("same-origin");
  expect(new Headers(options.headers).get("x-veyndo-browser-session")).toBe(
    "1",
  );
  expect(new Headers(options.headers).get("x-veyndo-csrf")).toBe(proof);
  expect(new Headers(options.headers).has("authorization")).toBe(false);
  expect(source.url).toBe("blob:preview");
  source.release();
  expect(create).toHaveBeenCalledOnce();
  expect(revoke).toHaveBeenCalledWith("blob:preview");
});
it("leaves public models on the managed asset route and rejects private error or wrong media", async () => {
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  const url = "/store-api/assets/model?shop=unit-shop&productId=sku";
  expect((await modelSource(url, new AbortController().signal)).url).toBe(url);
  expect(request).not.toHaveBeenCalled();
  for (const response of [
    new Response("denied", { status: 403 }),
    new Response("image", { headers: { "content-type": "image/png" } }),
  ]) {
    request.mockResolvedValueOnce(response);
    await expect(
      modelSource("/api/merchant/assets/model", new AbortController().signal),
    ).rejects.toThrow("unavailable");
  }
});
