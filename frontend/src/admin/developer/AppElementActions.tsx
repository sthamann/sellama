/** Element actions mutate the same native block list, preserving undo, schema limits and bounded handler ownership. */
import Icon from "../../shared/ui/Icon";
import { useCanvasText } from "../../shared/canvas/canvas-i18n";
import { useAppStudioText } from "../../shared/i18n/app-studio-i18n";
import type { Block } from "../../shared/apps/native/types";
import { snap } from "../../shared/apps/native/geometry";
import { nextId } from "./app-model";
export default function AppElementActions({
  block,
  blocks,
  onChange,
  onSelect,
  onCode,
  onProperties,
}: {
  block: Block;
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onSelect: (id: string) => void;
  onCode: (id: string) => void;
  onProperties?: () => void;
}) {
  const t = useCanvasText(),
    { a } = useAppStudioText();
  const index = blocks.findIndex((b) => b.id === block.id);
  const move = (by: number) => {
    const next = [...blocks],
      to = index + by;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };
  return (
    <div
      className="app-node-controls"
      role="group"
      aria-label={a(block.kind)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={!index}
        aria-label={a("up")}
        title={a("up")}
        onClick={() => move(-1)}
      >
        <span className="canvas-arrow-up">
          <Icon name="arrow" size={15} />
        </span>
      </button>
      <button
        type="button"
        disabled={index === blocks.length - 1}
        aria-label={a("down")}
        title={a("down")}
        onClick={() => move(1)}
      >
        <span className="canvas-arrow-down">
          <Icon name="arrow" size={15} />
        </span>
      </button>
      <button
        type="button"
        disabled={blocks.length >= 32}
        aria-label={t("duplicate")}
        title={t("duplicate")}
        onClick={() => {
          const clone = {
            ...structuredClone(block),
            id: nextId(
              block.kind,
              blocks.map((b) => b.id),
            ),
            ...(block.geometry
              ? {
                  geometry: snap({
                    ...block.geometry,
                    y: block.geometry.y + 1,
                  }),
                }
              : {}),
          };
          const next = [...blocks];
          next.splice(index + 1, 0, clone);
          onChange(next);
          onSelect(clone.id);
        }}
      >
        <Icon name="copy" size={15} />
      </button>
      {onProperties && (
        <button
          type="button"
          aria-label={t("properties")}
          title={t("properties")}
          onClick={onProperties}
        >
          <Icon name="settings" size={15} />
        </button>
      )}
      {["button", "textbox", "combobox", "checkbox", "datepicker"].includes(
        block.kind,
      ) && (
        <button
          type="button"
          aria-label={t("behavior")}
          title={t("behavior")}
          onClick={() => onCode(block.id)}
        >
          <Icon name="graph" size={15} />
        </button>
      )}
      <button
        type="button"
        aria-label={a("delete")}
        title={a("delete")}
        onClick={() => {
          onChange(blocks.filter((b) => b.id !== block.id));
          onSelect("");
        }}
      >
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}
