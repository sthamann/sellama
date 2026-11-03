/** Generated native operation input contracts; do not edit. */
/** Native input DTOs; opaque JSON fields remain explicit. */
import type { JsonValue } from "./value";
export interface Inputs11 {
  "studio.workspace.work.read": JsonValue;
  "studio.workspace.read": JsonValue;
  "studio.workspace.save": { data: JsonValue; revision: number };
  "merchant.import.inspect": {
    details?: boolean;
    options: {
      acknowledgedWarnings?: Array<string>;
      channelId?: string;
      customerGroup?: string;
      destinationDigest?: string;
      locale?: string;
      sourcePriceBasis?: "gross" | "net";
      taxRate?: number;
    };
    record: {
      data: JsonValue;
      kind:
        | "products"
        | "categories"
        | "pages"
        | "customers"
        | "orders"
        | "assets"
        | "reviews"
        | "coupons";
      source: string;
      sourceId: string;
      sourceShop: string;
      version: 1;
      warnings: Array<string>;
    };
  };
  "merchant.import.record": {
    approve: boolean;
    assetChunks?: Array<string>;
    options: {
      acknowledgedWarnings?: Array<string>;
      channelId?: string;
      customerGroup?: string;
      destinationDigest?: string;
      locale?: string;
      sourcePriceBasis?: "gross" | "net";
      taxRate?: number;
    };
    record: {
      data: JsonValue;
      kind:
        | "products"
        | "categories"
        | "pages"
        | "customers"
        | "orders"
        | "assets"
        | "reviews"
        | "coupons";
      source: string;
      sourceId: string;
      sourceShop: string;
      version: 1;
      warnings: Array<string>;
    };
  };
  "merchant.customer.creation": JsonValue;
  "merchant.customer.create": {
    additionalAddresses?: Array<JsonValue>;
    billingAddress: JsonValue;
    customerGroup: string;
    email: string;
    profile: JsonValue;
    requestKey: string;
    shippingAddress?: JsonValue | null;
  };
  "merchant.order.context": { channelId: string; locale?: string };
  "merchant.order.review": {
    channelId: string;
    checkout: JsonValue;
    codes?: Array<string>;
    currency: string;
    customerId: string;
    items: Array<{ id: string; quantity: number }>;
    locale: string;
  };
  "merchant.order.complete": {
    approve: boolean;
    cartToken: string;
    channelId: string;
    customerAcknowledgement: boolean;
    digitalImmediate: boolean;
    locale: string;
    policyVersion: string;
    requestKey: string;
    revision: number;
    terms: boolean;
    totalMinor: string;
  };
  "merchant.catalog.context": JsonValue;
  "merchant.catalog.prepare": {
    count: number;
    inference?: {
      model?: string | null;
      provider?: "platform" | "ollama" | "openai" | "anthropic";
    } | null;
    mode: "csv" | "url" | "demo" | "shopify_csv" | "shop_mcp";
    shopDomain?: string;
    source: string;
  };
}
