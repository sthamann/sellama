/** OverviewView renders verified shop state and typed user actions. */
import { useReportText } from "../reports/report-i18n";
import TodayReports from "../reports/TodayReports";
import { useCatalogIntakeText } from "../../shared/i18n/catalog-intake-i18n";
import { storefrontURL } from "../../shared/api/shop-scope";
import { useLocale } from "../../shared/i18n/i18n";
import Icon from "../../shared/ui/Icon";
import ProductArt from "../../shared/ui/ProductArt";
import type { Overview } from "../shell/studio-types";
export function OverviewView({
  data,
  onIntent,
  onProduct,
}: {
  data: Overview;
  onIntent: (s: string) => void;
  onProduct: (id: string) => void;
}) {
  const intakeText = useCatalogIntakeText();
  const reportText = useReportText();
  const { t, date } = useLocale();
  const format = (n: number, currency = "EUR") =>
    new Intl.NumberFormat(data.locale, { style: "currency", currency }).format(
      n,
    );
  return (
    <div className="studio-page">
      <div className="page-intro">
        <h1>{reportText("title")}</h1>
        <p>{reportText("hint")}</p>
      </div>
      <TodayReports />
      <div className="overview-columns">
        <section className="studio-card inventory-card">
          <div className="card-heading">
            <h2>{t("inventory")}</h2>
            <span className="soft-tag">{t("api")}</span>
          </div>
          {data.products.map((p) => (
            <button
              className="inventory-row"
              key={p.id}
              onClick={() => onProduct(p.id)}
            >
              <div className="mini-art">
                <ProductArt id={p.id} />
              </div>
              <span>
                {p.name}
                <small>
                  {format(
                    p.price,
                    p.extra?.priceCurrency ?? data.productCurrency,
                  )}
                </small>
              </span>
              <b className={p.stock < 10 ? "stock-low" : ""}>{p.stock}</b>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          {data.productsPagination.hasMore && (
            <p className="empty-note">
              {t("catalogPageNotice", { count: data.products.length })}{" "}
              <a href={storefrontURL(data.tenant)}>{t("storefront")} ↗</a>
            </p>
          )}
        </section>
      </div>
      <section className="studio-card">
        <div className="card-heading">
          <h2>{t("recentOrders")}</h2>
        </div>
        {data.orders.length ? (
          <div className="orders-table">
            {data.orders.map((o) => (
              <div className="order-row" key={o.id}>
                <span className="order-icon">
                  <Icon name="box" />
                </span>
                <b>{o.number}</b>
                <span>{date(o.time)}</span>
                <span className="channel-label">
                  {o.channel === "unknown" || !o.channel
                    ? t("unknown")
                    : o.channel.toUpperCase()}
                </span>
                <strong>{format(o.total, o.currency)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-note">{t("emptyOrders")}</p>
        )}
      </section>
      <div className="overview-columns">
        <section className="studio-card">
          <div className="card-heading">
            <h2>{t("activity")}</h2>
          </div>
          {data.activity.map((a, i) => (
            <div className="activity-row" key={a.id + i}>
              <span className="activity-dot" />
              <div>
                {a.kind === "order"
                  ? t("activityOrder")
                  : a.kind === "approved"
                    ? t("activityApproved")
                    : t("activityProposal")}
                <small>{date(a.time)}</small>
              </div>
            </div>
          ))}
          {!data.activity.length && <p>{t("noActivity")}</p>}
        </section>
        <section className="studio-card next-actions">
          <h2>{t("actions")}</h2>
          <button onClick={() => onIntent(t("askStock"))}>
            <Icon name="box" />
            {t("inventory")}
            <Icon name="arrow" />
          </button>
          <button onClick={() => onIntent(t("learningPrompt"))}>
            <Icon name="pulse" />
            {t("policy")}
            <Icon name="arrow" />
          </button>
          <button onClick={() => onIntent(intakeText("knowledgePrompt"))}>
            <Icon name="graph" />
            {t("productKnowledge")}
            <Icon name="arrow" />
          </button>
        </section>
      </div>
    </div>
  );
}
