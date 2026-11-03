/** Generated native operation input contracts; do not edit. */
/** Native input DTOs; opaque JSON fields remain explicit. */
import type { JsonValue } from "./value";
export interface Inputs10 {
  "knowledge.claim.propose": {
    confidence?: number;
    contentHash?: string;
    locale?: string;
    nodeType?:
      | "product"
      | "variant"
      | "material"
      | "property"
      | "intent"
      | "problem"
      | "occasion"
      | "audience"
      | "claim"
      | "return_reason"
      | "supplier"
      | "policy"
      | "document"
      | "support";
    productId?: string;
    quote?: string;
    sourceId?: string;
    text?: string;
  };
  "knowledge.claim.review": {
    approve?: boolean;
    id?: string;
    revision?: number;
    state?: "evidenced" | "confirmed" | "rejected";
  };
  "knowledge.extract": {
    inference?: JsonValue;
    locale?: string;
    productId?: string;
    sourceId?: string;
  };
  "knowledge.compile": {
    claims?: Array<{ id: string; text: string }>;
    productId?: string;
  };
  "merchant.app.history": {
    app: string;
    approve?: boolean;
    entity: string;
    id: string;
    revision?: number;
    version?: number;
  };
  "merchant.app.restore": {
    app: string;
    approve: boolean;
    entity: string;
    id: string;
    revision: number;
    version: number;
  };
  "merchant.site.task": {
    agent?: "codex" | "claude_code";
    id: string;
    instruction: string;
    revision: number;
    selected?: string;
  };
  "merchant.site.propose": {
    fields: JsonValue;
    id: string;
    instruction: string;
    revision: number;
    selected?: string;
    summary?: string;
  };
  "merchant.site.plan": {
    content?: boolean;
    id: string;
    images?: Array<string>;
    instruction: string;
    revision: number;
    selected?: string;
    structure?: boolean;
    style?: boolean;
    urls?: Array<string>;
  };
  "merchant.site.apply": { approve: boolean; taskId: string };
  "merchant.reports.read": {
    channel?: string | null;
    channelType?: "all" | "storefront" | "headless" | "marketplace" | "pos";
    compare?: boolean;
    currency?: string | null;
    from?: string | null;
    interval?: "auto" | "day" | "week" | "month" | "year";
    period?:
      | "today"
      | "yesterday"
      | "week"
      | "last7"
      | "last30"
      | "last90"
      | "month"
      | "lastMonth"
      | "year"
      | "lastYear"
      | "all"
      | "custom";
    timezone?: string;
    to?: string | null;
  };
  "studio.workspace.work.read": JsonValue;
}
