/** Shared installed-provider onboarding and channel connection controls for merchant Apps and App Studio. */
import { useEffect, useRef, useState } from "react";
import type { RequestFn } from "../shell/studio-types";
import type { CountryCatalogue } from "../../shared/geography/geography-types";
import CountryPicker from "../../shared/geography/CountryPicker";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { usePaymentProviderText } from "../../shared/i18n/payment-provider-i18n";
import "../styles/provider-account.css";
export default function ProviderAccount({
  provider,
  request,
  canWrite = true,
}: {
  provider: string;
  request: RequestFn;
  canWrite?: boolean;
}) {
  const t = usePaymentProviderText(),
    [geo, setGeo] = useState<CountryCatalogue>(),
    [channel, setChannel] = useState("default"),
    [environment, setEnvironment] = useState(""),
    [environments, setEnvironments] = useState<string[]>([]),
    [savedAccounts, setSavedAccounts] = useState<
      {
        provider: string;
        channel: string;
        environment: string;
        ready: boolean;
      }[]
    >([]),
    [channels, setChannels] = useState<{ id: string }[]>([]),
    [country, setCountry] = useState(["DE"]),
    [busy, setBusy] = useState(false),
    [confirmDisconnect, setConfirmDisconnect] = useState(false),
    [error, setError] = useState(""),
    [account, setAccount] = useState<{
      ready: boolean;
      onboardingUrl?: string;
    }>();
  const scope = `${provider}:${channel}:${environment}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => {
    let active = true;
    void request("/store-api/countries")
      .then((v) => {
        if (active) setGeo(v);
      })
      .catch(() => {});
    setAccount(undefined);
    setEnvironments([]);
    setEnvironment("");
    setError("");
    void request("/api/payment-providers")
      .then((v) => {
        if (!active) return;
        setChannels(v.channels ?? []);
        setSavedAccounts(v.accounts ?? []);
        const configuration = v.providers?.find(
          (p: { id: string }) => p.id === provider,
        )?.configuration;
        setEnvironments(configuration?.environments ?? []);
        setEnvironment(configuration?.defaultEnvironment ?? "");
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [request, provider]);
  useEffect(() => {
    setAccount(
      savedAccounts.find(
        (a) =>
          a.provider === provider &&
          a.channel === channel &&
          a.environment === environment,
      ),
    );
  }, [provider, channel, environment, savedAccounts]);
  const connect = async (operation: "start" | "status" | "disconnect") => {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/api/payment-providers/${provider}/onboarding`,
        {
          operation,
          channel,
          environment,
          country: country[0],
          approve: operation !== "status",
          requestKey: crypto.randomUUID(),
        },
      );
      if (currentScope.current === scope) setAccount(result);
    } catch (e) {
      if (currentScope.current === scope) setError((e as Error).message);
    } finally {
      setBusy(false);
      setConfirmDisconnect(false);
    }
  };
  return (
    <section className="provider-account">
      <h2>{t("account")}</h2>
      <label>
        {t("channel")}
        <select
          disabled={busy}
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setAccount(undefined);
          }}
        >
          {[...new Set(["default", ...channels.map((c) => c.id)])].map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("environment")}
        <select
          disabled={busy || !environments.length}
          value={environment}
          onChange={(e) => {
            setEnvironment(e.target.value);
            setAccount(undefined);
          }}
        >
          {!environments.length && (
            <option value="">{t("unconfigured")}</option>
          )}
          {environments.map((env) => (
            <option key={env} value={env}>
              {env === "contract-fixture"
                ? t("fixture")
                : t(env as "simulation" | "sandbox" | "live")}
            </option>
          ))}
        </select>
      </label>
      {!environments.length && <p role="status">{t("deploy")}</p>}
      {environment === "simulation" && (
        <p role="status">{t("simulationHint")}</p>
      )}
      <CountryPicker
        countries={geo?.countries ?? []}
        value={country}
        single
        label={t("country")}
        onChange={setCountry}
      />
      <div className="workbench-row">
        <button
          disabled={busy || !canWrite || !environment}
          className="studio-secondary"
          onClick={() => void connect("status")}
        >
          {t("refresh")}
        </button>
        <button
          disabled={busy || !canWrite || !environment}
          className="studio-primary"
          onClick={() => void connect("start")}
        >
          {t("start")}
        </button>
      </div>
      {account && (
        <button
          disabled={busy || !canWrite || !environment}
          className="studio-secondary"
          onClick={() => setConfirmDisconnect(true)}
        >
          {t("disconnect")}
        </button>
      )}
      {confirmDisconnect && (
        <ConfirmDialog
          title={t("disconnect")}
          onCancel={() => setConfirmDisconnect(false)}
          onConfirm={() => void connect("disconnect")}
          confirmLabel={t("disconnect")}
          disabled={busy || !canWrite || !environment}
        >
          <p>{t("disconnectHint")}</p>
        </ConfirmDialog>
      )}
      {error && <p role="alert">{error}</p>}
      {account && <p>{t(account.ready ? "ready" : "pending")}</p>}
      {account?.onboardingUrl && (
        <a
          className="studio-primary"
          href={account.onboardingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("continue")}
        </a>
      )}
    </section>
  );
}
