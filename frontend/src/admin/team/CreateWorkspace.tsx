/** Visible native shop creation keeps identifiers editable and submits only through its account owner. */
import { useId, useState } from "react";
import { useShopText } from "../../shared/i18n/shop-i18n";
import Icon from "../../shared/ui/Icon";
import { useWorkspaceCreateText } from "./workspace-create-i18n";
export default function CreateWorkspace({
  busy,
  onCreate,
  onCancel,
}: {
  busy: boolean;
  onCreate: (name: string, id: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { s } = useShopText(),
    t = useWorkspaceCreateText();
  const [name, setName] = useState(""),
    [id, setId] = useState("");
  const [customId, setCustomId] = useState(false);
  const hintId = useId();
  return (
    <section
      id="team-create-workspace"
      className="commerce-card team-create-workspace"
    >
      <header>
        <h2>{s("register")}</h2>
        <p>{t("hint")}</p>
      </header>
      <form
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void onCreate(name.trim(), id);
        }}
      >
        <fieldset disabled={busy}>
          <div className="team-create-fields">
            <label>
              {s("workspaceName")}
              <input
                name="workspaceName"
                required
                maxLength={100}
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!customId)
                    setId(
                      e.target.value
                        .normalize("NFKD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                        .slice(0, 48),
                    );
                }}
              />
            </label>
            <div className="team-create-identifier">
              <label>
                {s("workspaceId")}
                <input
                  name="workspaceId"
                  required
                  minLength={2}
                  maxLength={48}
                  pattern="[a-z0-9][a-z0-9\-]{1,47}"
                  autoComplete="off"
                  aria-describedby={hintId}
                  placeholder={s("shopSlugExample")}
                  value={id}
                  onChange={(e) => {
                    setCustomId(true);
                    setId(e.target.value);
                  }}
                />
              </label>
              <small id={hintId}>{t("idHint")}</small>
            </div>
          </div>
          <footer className="team-form-actions">
            <button type="submit" className="studio-primary">
              <Icon name="plus" size={18} />
              {busy ? t("creating") : s("register")}
            </button>
            <button
              type="button"
              className="studio-secondary"
              onClick={onCancel}
            >
              {t("cancel")}
            </button>
          </footer>
        </fieldset>
      </form>
    </section>
  );
}
