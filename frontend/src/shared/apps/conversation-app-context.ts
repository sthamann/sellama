/** Project a verified app filter into an editable chat draft. */
import { conversationAppText } from "../i18n/conversation-app-i18n";

export type AppFilterContext = { tool: string; field: string; value: string };

export function verifiedAppFilter(
  params: unknown,
  applied: AppFilterContext | undefined,
): AppFilterContext | undefined {
  if (!applied || !params || typeof params !== "object") return;
  if (Object.keys(params).length !== 1 || !("structuredContent" in params))
    return;
  const content = params.structuredContent;
  if (
    !content ||
    typeof content !== "object" ||
    Object.keys(content).length !== 3 ||
    !("tool" in content) ||
    !("field" in content) ||
    !("value" in content) ||
    content.tool !== applied.tool ||
    content.field !== applied.field ||
    content.value !== applied.value ||
    !/^app\.[a-zA-Z0-9_-]{1,80}\.[a-zA-Z0-9_-]{1,80}$/.test(applied.tool) ||
    !/^[a-zA-Z0-9_.-]{1,64}$/.test(applied.field) ||
    !/^[a-zA-Z0-9_.-]{1,64}$/.test(applied.value)
  )
    return;
  return applied;
}

export function draftWithAppFilter(
  draft: string,
  selection: AppFilterContext,
  locale: string,
  limit: number,
  separator = "\n",
  previous?: AppFilterContext,
) {
  const format = (filter: AppFilterContext) =>
    conversationAppText(locale).filterContext(
      filter.tool,
      filter.field,
      filter.value,
    );
  const line = format(selection);
  const earlier = previous ? format(previous) : undefined;
  const next =
    earlier && draft.includes(earlier)
      ? draft.replace(earlier, line)
      : draft.includes(line)
        ? draft
        : [draft.trimEnd(), line].filter(Boolean).join(separator);
  return new TextEncoder().encode(next).length <= limit ? next : undefined;
}
