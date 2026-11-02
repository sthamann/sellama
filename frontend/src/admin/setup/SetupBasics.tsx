/** A focused first company form reuses native fields, geography, revisioned settings and the shared save bar. */
import { useEffect, useState } from "react";
import { useStudio } from "../shell/StudioContext";
import { useSettingsDraft } from "../settings/useSettingsDraft";
import CompanyField from "../settings/CompanyField";
import SettingsSaveBar from "../settings/SettingsSaveBar";
import type { CompanyData } from "../settings/company-types";
import type { CountryCatalogue } from "../../shared/geography/geography-types";
import type { CompanyWord } from "../../shared/i18n/company-i18n";
import { useSetupText } from "./setup-i18n";
import "../styles/company-settings.css";
export default function SetupBasics({
  onDirty,
  onSaved,
}: {
  onDirty: (dirty: boolean) => void;
  onSaved: () => void;
}) {
  const { request, access } = useStudio(),
    t = useSetupText();
  const state = useSettingsDraft<CompanyData>(
    request,
    "/api/settings/master-data",
  );
  const [world, setWorld] = useState<CountryCatalogue>(),
    [worldError, setWorldError] = useState(false);
  const canWrite = access.includes("settings.write");
  useEffect(() => {
    let active = true;
    request("/store-api/countries")
      .then((v) => {
        if (!Array.isArray(v.countries)) throw new Error();
        if (active) setWorld(v);
      })
      .catch(() => {
        if (active) setWorldError(true);
      });
    return () => {
      active = false;
    };
  }, [request]);
  useEffect(() => {
    onDirty(state.dirty || state.busy);
  }, [state.dirty, state.busy, onDirty]);
  useEffect(() => {
    if (state.saved) onSaved();
  }, [state.saved, onSaved]);
  if (!state.value)
    return (
      <p role={state.error ? "alert" : "status"}>
        {state.error || t("loading")}
      </p>
    );
  const fields: CompanyWord[] = [
    "name",
    "email",
    "street",
    "houseNumber",
    "postalCode",
    "city",
    "country",
  ];
  return (
    <form
      className="setup-basics"
      onSubmit={(e) => {
        e.preventDefault();
        if (canWrite) void state.save();
      }}
    >
      {(state.error || worldError) && (
        <p role="alert">{state.error || t("factsError")}</p>
      )}
      <fieldset disabled={!canWrite || state.busy}>
        <div className="setup-basics-fields">
          {fields.map((field) => (
            <CompanyField
              key={field}
              field={field}
              data={state.value!.data}
              base={{}}
              channel={false}
              world={world}
              onChange={state.change}
            />
          ))}
        </div>
      </fieldset>
      <SettingsSaveBar {...state} canWrite={canWrite} />
    </form>
  );
}
