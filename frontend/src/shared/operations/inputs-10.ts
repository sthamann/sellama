/** Generated native operation input contracts; do not edit. */
/** Native input DTOs; opaque JSON fields remain explicit. */
import type { JsonValue } from "./value";
export interface Inputs10 {
  "knowledge.compile": {
    claims?: Array<{ id: string; text: string }>;
    productId?: string;
  };
  "merchant.payment": {
    amountMinor?: number;
    approve: boolean;
    captureId?: string;
    finalCapture?: boolean;
    id: string;
    operation:
      "capture" | "authorize" | "void" | "refund" | "reconcile" | "cancel";
    requestKey: string;
  };
  "merchant.payment.details": { id: string };
  "merchant.payment.providers": JsonValue;
  "merchant.payment.onboarding": {
    approve?: boolean;
    channel?: string;
    country?: string;
    environment?: "sandbox" | "live" | "simulation" | "contract-fixture";
    id?: string;
    operation?: "start" | "status" | "disconnect";
    requestKey?: string;
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
}
