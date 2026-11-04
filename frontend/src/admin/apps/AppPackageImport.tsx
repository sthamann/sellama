/** Import a bounded manifest through the same server review and approval as built-in apps. */
import { useRef, useState } from "react";
import type { RequestFn } from "../shell/studio-types";
import { useLibraryText } from "../../shared/i18n/app-library-i18n";
import AppConsent from "./AppConsent";

export default function AppPackageImport({
  request,
  onImported,
}: {
  request: RequestFn;
  onImported: (id: string) => Promise<void>;
}) {
  const l = useLibraryText(),
    input = useRef<HTMLInputElement>(null);
  const [manifest, setManifest] = useState<Record<string, unknown>>(),
    [error, setError] = useState("");
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label={l("importPackage")}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          setError("");
          try {
            if (file.size > 48 * 1024) throw new Error();
            const parsed: unknown = JSON.parse(await file.text());
            if (
              !parsed ||
              Array.isArray(parsed) ||
              typeof parsed !== "object" ||
              !("id" in parsed) ||
              typeof parsed.id !== "string" ||
              !parsed.id.trim() ||
              !("version" in parsed) ||
              typeof parsed.version !== "string" ||
              !parsed.version.trim()
            )
              throw new Error();
            setManifest(parsed as Record<string, unknown>);
          } catch {
            setError(l("invalidPackage"));
          }
        }}
      />
      <button
        type="button"
        className="studio-secondary"
        onClick={() => input.current?.click()}
      >
        {l("importPackage")}
      </button>
      {error && <p role="alert">{error}</p>}
      {manifest && (
        <AppConsent
          app={manifest.id as string}
          manifest={manifest}
          request={request}
          onCancel={() => setManifest(undefined)}
          onInstall={async (consent) => {
            await request("/api/apps", {
              manifest,
              approve: true,
              digest: consent.digest,
              permissions: consent.permissions,
            });
            await onImported(consent.app);
            setManifest(undefined);
          }}
        />
      )}
    </>
  );
}
