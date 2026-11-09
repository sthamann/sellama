/** ConciergeView: storefront view composed from the scoped cart/controller. */
import { mediaImage } from "../../shared/media/product-media";
import ConversationAppViews, {
  type ConversationAppView,
} from "../../shared/apps/ConversationAppViews";
import { draftWithAppFilter } from "../../shared/apps/conversation-app-context";
import AssistantMarkdown from "../../shared/content/AssistantMarkdown";
import type { ShopperAdvice } from "./useShopperAdvice";
import ConciergeSelection from "./ConciergeSelection";
import ConversationPurchase from "./ConversationPurchase";
import { shopApi } from "../../shared/api/shop-api";
import "../../shared/styles/apps.css";
import "../../shared/styles/workbench.css";
import "../styles/shop.css";

import { useStorefront } from "./StorefrontContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { useExperienceUIText } from "../../shared/i18n/experience-ui-i18n";
import { useLocale } from "../../shared/i18n/i18n";
import Icon from "../../shared/ui/Icon";
export default function ConciergeView() {
  const { u } = useExperienceUIText();
  const { locale } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const {
    s,
    run,
    wish,
    cart,
    setAdvice,
    setQuery,
    setCategory,
    setWish,
    busy,
    advice,
    products,
    money,
    adviceContext: scope,
    shortlist,
  } = useStorefront();
  const appRequest = useCallback(
    (path: string, body?: unknown) => shopApi(path, body, cart?.token),
    [cart?.token, scope],
  );
  const active = useRef<AbortController>(null);
  const [pending, setPending] = useState<{
    scope: string;
    views: ConversationAppView[];
  }>();
  const loading = pending?.scope === scope;
  const displayedViews = loading ? pending.views : advice?.appViews;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  useEffect(() => () => active.current?.abort(), [scope]);
  const prompt = products.some((p) =>
    mediaImage(p.media)?.startsWith("/media/demo/fashion/"),
  )
    ? "fashionWish"
    : "wish";
  return (
    <section
      className="shop-concierge"
      id="assistant"
      aria-labelledby="shop-assistant-title"
    >
      <div>
        <p className="shop-kicker">
          <Icon name="spark" size={16} /> {s("ask")}
        </p>
        <h2 id="shop-assistant-title">{u("assistantIntro")}</h2>
        <p>{u("assistantHint")}</p>
        <small>
          <Icon name="box" size={14} /> {u("grounded")}
        </small>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const controller = new AbortController();
          active.current?.abort();
          active.current = controller;
          const current = () =>
            !controller.signal.aborted && scope === currentScope.current;
          let views: ConversationAppView[] = [];
          const retainViews = (next: ConversationAppView[]) =>
            next.map(
              (view) =>
                views.find(
                  (previous) =>
                    view.attachmentId !== undefined &&
                    previous.attachmentId === view.attachmentId &&
                    previous.resourceUri === view.resourceUri,
                ) ?? view,
            );
          setPending({ scope, views });
          run(async () => {
            try {
              const v = await shopApi<{ answer: ShopperAdvice }>(
                "/api/concierge",
                { request: wish },
                cart?.token,
                undefined,
                undefined,
                {
                  signal: controller.signal,
                  onEvent(event, data) {
                    if (
                      event === "app-views" &&
                      Array.isArray(data) &&
                      current()
                    ) {
                      views = retainViews(data);
                      setPending({ scope, views });
                    }
                  },
                },
              );
              if (!current()) return;
              setAdvice({
                ...v.answer,
                appViews: retainViews(v.answer.appViews ?? []),
              });
              setQuery("");
              setCategory("all");
            } catch (error) {
              if (current()) throw error;
            } finally {
              if (active.current === controller) {
                active.current = null;
                setPending(undefined);
              }
            }
          });
        }}
      >
        <input
          ref={input}
          aria-label={s("ask")}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder={s(prompt)}
        />
        <button disabled={busy || !wish} className="shop-secondary">
          {busy ? s("thinking") : s("ask")} ↗
        </button>
      </form>
      <div className="shop-assistant-prompts">
        {(["budget", "gift", "compare"] as const).map((key) => (
          <button
            type="button"
            key={key}
            disabled={busy}
            onClick={() => {
              setWish(u(key));
              input.current?.focus();
            }}
          >
            <Icon
              name={
                key === "budget" ? "percent" : key === "gift" ? "box" : "layers"
              }
              size={16}
            />
            {u(key)}
            <Icon name="arrow" size={14} />
          </button>
        ))}
      </div>
      {(Boolean(displayedViews?.length) || (!loading && advice)) && (
        <div className="shop-advice">
          {!loading && advice && (
            <div className="concierge-explanation" role="status">
              <AssistantMarkdown text={advice.explanation} />
            </div>
          )}
          <ConversationAppViews
            views={displayedViews}
            request={appRequest}
            onUseFilter={(filter, previous) => {
              const next = draftWithAppFilter(
                wish,
                filter,
                locale,
                2000,
                " ",
                previous,
              );
              if (next === undefined) return false;
              setWish(next);
              input.current?.focus();
              return true;
            }}
            renderProducts={(ids) =>
              !loading && ids.length === 1 ? (
                <ConversationPurchase key={ids[0]} productId={ids[0]} />
              ) : null
            }
          />
          {!loading && advice && advice.recommended_ids.length > 0 && (
            <ConciergeSelection
              key={JSON.stringify([scope, advice])}
              ids={advice.recommended_ids}
              removed={shortlist.removed}
              onRemove={shortlist.remove}
              onRestore={shortlist.restore}
              products={products}
              money={money}
              compareInitially={advice.layout === "comparison"}
              business={cart?.price.taxStatus === "net"}
            />
          )}
        </div>
      )}
    </section>
  );
}
