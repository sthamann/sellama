/** Shared localized caption edits and explicit AI proposal review; native owners retain persistence and publication. */
import { useEffect, useRef, useState } from "react";
import type { RequestFn } from "../api/types";
import { useContentLanguage } from "../i18n/ContentLanguage";
import {
  contentKey,
  contentText,
  type LocalizedText,
} from "../i18n/content-language";
import LocalizedField from "../i18n/LocalizedField";
import Icon from "../ui/Icon";
import { useCaptionText } from "./caption-i18n";
import "./captions.css";
type Proposal = { caption: string; basis: "image" | "context" };
export default function MediaCaptionEditor({
  value,
  scopeKey = "",
  onChange,
  context,
  imageUrl = "",
  request,
  disabled = false,
  canGenerate = false,
}: {
  scopeKey?: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  context: string;
  imageUrl?: string;
  request?: RequestFn;
  disabled?: boolean;
  canGenerate?: boolean;
}) {
  const t = useCaptionText(),
    { language, mainLocale, locales } = useContentLanguage();
  const [proposal, setProposal] = useState<Proposal>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const fingerprint = JSON.stringify([
    scopeKey,
    language,
    mainLocale,
    context,
    imageUrl,
    value,
    disabled,
    canGenerate,
  ]);
  const current = useRef({ fingerprint, request });
  current.current = { fingerprint, request };
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setProposal(undefined);
    setError(false);
    setBusy(false);
    return () => {
      generation.current++;
    };
  }, [fingerprint, request]);
  async function generate() {
    if (!request || disabled || !canGenerate || busy) return;
    const turn = ++generation.current;
    setBusy(true);
    setError(false);
    setProposal(undefined);
    const active = () =>
      generation.current === turn &&
      current.current.fingerprint === fingerprint &&
      current.current.request === request;
    try {
      const result = await request("/api/merchant/media/caption", {
        locale: language,
        context: context.slice(0, 4000),
        imageUrl,
        caption: contentText(value, language, mainLocale),
      });
      if (!active()) return;
      if (
        result.locale !== language ||
        !["image", "context"].includes(result.basis) ||
        typeof result.caption !== "string" ||
        !result.caption.trim() ||
        new TextEncoder().encode(result.caption).length > 600 ||
        /[<>\x00-\x1f]/.test(result.caption)
      )
        throw new Error("Invalid proposal");
      setProposal({ caption: result.caption, basis: result.basis });
    } catch {
      if (active()) setError(true);
    } finally {
      if (active()) setBusy(false);
    }
  }
  return (
    <section className="media-caption-editor" aria-label={t("caption")}>
      <LocalizedField
        label={t("caption")}
        value={value}
        onChange={onChange}
        multiline
        maxLength={600}
        disabled={disabled}
      />
      <small>{t("hint")}</small>
      {request && canGenerate && (
        <button
          type="button"
          className="studio-secondary"
          disabled={disabled || busy || !context.trim()}
          onClick={() => void generate()}
        >
          <Icon name="spark" size={15} />
          {t(busy ? "working" : "generate")}
        </button>
      )}
      {error && <p role="alert">{t("error")}</p>}
      {proposal && !disabled && (
        <div className="media-caption-proposal" aria-live="polite">
          <strong>{t("proposal")}</strong>
          <label>
            {t("caption")}
            <textarea
              rows={3}
              value={proposal.caption}
              maxLength={600}
              onChange={(e) =>
                setProposal({ ...proposal, caption: e.target.value })
              }
            />
          </label>
          <small>
            {t(proposal.basis === "image" ? "imageBasis" : "contextBasis")}
          </small>
          <div className="media-caption-actions">
            <button
              type="button"
              className="studio-primary"
              disabled={
                !proposal.caption.trim() ||
                new TextEncoder().encode(proposal.caption).length > 600
              }
              onClick={() => {
                onChange({
                  ...value,
                  [contentKey(value, language, locales)]: proposal.caption,
                });
                setProposal(undefined);
              }}
            >
              {t("apply")}
            </button>
            <button
              type="button"
              className="studio-secondary"
              onClick={() => setProposal(undefined)}
            >
              {t("discard")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
