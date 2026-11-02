/** Shared image metadata controls edit the selected page block through its normal draft owner. */
import MediaCaptionEditor from "../../../../frontend/src/shared/media/MediaCaptionEditor";
import LocalizedField from "../../../../frontend/src/shared/i18n/LocalizedField";
import type { RequestFn } from "../../../../frontend/src/shared/api/types";
import { useCaptionText } from "../../../../frontend/src/shared/media/caption-i18n";
import type { Block, Page } from "../model";
import { useEditorText } from "./editor-i18n";
export default function ImageProperties({
  page,
  block,
  request,
  disabled,
  canGenerate,
  onChange,
}: {
  page: Page;
  block: Block;
  request: RequestFn;
  disabled: boolean;
  canGenerate: boolean;
  onChange: (value: Partial<Block>) => void;
}) {
  const e = useEditorText(),
    t = useCaptionText();
  return (
    <>
      <label>
        {e("image")}
        <input
          value={block.image}
          type="url"
          maxLength={2000}
          onChange={(event) => onChange({ image: event.target.value })}
        />
      </label>
      <LocalizedField
        label={t("alt")}
        value={block.imageAlt ?? {}}
        onChange={(imageAlt) => onChange({ imageAlt })}
        maxLength={400}
        disabled={disabled}
      />
      <MediaCaptionEditor
        key={block.id}
        scopeKey={`${page.id}:${page.revision}:${block.id}`}
        value={block.caption ?? {}}
        onChange={(caption) => onChange({ caption })}
        request={request}
        canGenerate={canGenerate}
        disabled={disabled}
        imageUrl={block.image}
        context={JSON.stringify({ page: page.title, heading: block.text })}
      />
    </>
  );
}
