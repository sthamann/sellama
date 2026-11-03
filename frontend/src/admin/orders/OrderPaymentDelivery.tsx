/** Payment jobs are observed until confirmation. Delivery actions share the server state machine. */
import type { RequestFn } from "../shell/studio-types";
import PaymentDetails from "../payments/PaymentDetails";
import PaymentActions from "../payments/PaymentActions";
import type { PaymentOptions } from "../payments/payment-amount";
import { safeRichUrl } from "../../shared/content/rich-document";
import { useAccountText } from "../../shared/i18n/account-i18n";
import { useState } from "react";
import { useOperationsText } from "../../shared/i18n/operations-i18n";
import ShipmentSplit, { type ShipmentPosition } from "./ShipmentSplit";
import { useShipmentText } from "../../shared/i18n/shipment-i18n";
import "./shipments.css";
import type { OrderAction } from "./OrderWorkflow";
export default function OrderPaymentDelivery({
  order,
  request,
  busy,
  rights,
  onAction,
  onPayment,
  pendingJob,
  onCheck,
  onSplit,
}: {
  order: any;
  request: RequestFn;
  busy: boolean;
  rights: string[];
  onAction: (a: OrderAction, tracking?: string, trackingUrl?: string) => void;
  onPayment: (
    operation: string,
    amount?: number,
    options?: PaymentOptions,
  ) => Promise<boolean>;
  pendingJob: boolean;
  onCheck: () => void;
  onSplit?: (index: number, positions: ShipmentPosition[]) => Promise<boolean>;
}) {
  const { o } = useOperationsText();
  const shipmentText = useShipmentText();
  const { a: accountText } = useAccountText();
  const [links, setLinks] = useState<Record<number, string>>({});
  const [tracking, setTracking] = useState<Record<number, string>>({});
  const actions = order.workflow?.actions ?? [];
  const label = (a: OrderAction) =>
    o(
      a.kind === "payment"
        ? "markPaid"
        : a.state === "shipped"
          ? "markShipped"
          : "markDelivered",
    );
  return (
    <section className="studio-card order-fulfillment">
      <div className="section-heading">
        <h2>{o("payment")}</h2>
        <span className="operation-status">{o(order.payment.state)}</span>
      </div>
      <p>{o(order.payment.provider)}</p>
      {rights.includes("orders.write") &&
        actions
          .filter((a: OrderAction) => a.kind === "payment")
          .map((a: OrderAction) => (
            <button
              key={a.id}
              disabled={busy || !a.enabled}
              className="studio-primary"
              onClick={() => onAction(a)}
            >
              {label(a)}
            </button>
          ))}
      {rights.includes("payments.manage") && order.payment.attemptId && (
        <PaymentActions
          state={order.payment.state}
          settlement={
            order.payment.capturedMinor === undefined
              ? undefined
              : order.payment
          }
          currency={order.cart.price.currency ?? "EUR"}
          scale={order.cart.price.currencyScale ?? 2}
          busy={busy}
          pending={pendingJob}
          onPayment={onPayment}
          onCheck={onCheck}
        />
      )}
      {rights.includes("payments.read") && order.payment.attemptId && (
        <PaymentDetails
          key={order.payment.attemptId}
          id={order.payment.attemptId}
          request={request}
        />
      )}
      <div className="delivery-divider" />
      <h2>{o("delivery")}</h2>
      {order.deliveries.length ? (
        order.deliveries.map((d: any, index: number) => (
          <div className="delivery-card" key={index}>
            <div className="section-heading">
              <strong>
                {shipmentText("package")} {index + 1} ·{" "}
                {o(d.shippingMethod.name)}
              </strong>
              <span className="operation-status">{o(d.state)}</span>
            </div>
            <ul className="shipment-positions">
              {(d.positions ?? []).map((p: ShipmentPosition) => (
                <li key={p.id}>
                  <span>
                    {order.lineItems?.find(
                      (item: any) =>
                        item.referencedId === p.id || item.id === p.id,
                    )?.label ?? p.id}
                  </span>
                  <strong>× {p.quantity}</strong>
                </li>
              ))}
            </ul>
            {onSplit &&
              rights.includes("orders.write") &&
              rights.includes("customers.pii") && (
                <ShipmentSplit
                  delivery={d}
                  busy={busy}
                  enabled={
                    !!order.workflow?.shipmentSplits?.find(
                      (s: any) => s.deliveryIndex === index,
                    )?.enabled
                  }
                  labels={Object.fromEntries(
                    (order.lineItems ?? []).map((item: any) => [
                      item.referencedId ?? item.id,
                      item.label,
                    ]),
                  )}
                  onSplit={(positions) => onSplit(index, positions)}
                />
              )}
            {d.trackingCode && <p>{d.trackingCode}</p>}
            {d.trackingUrl?.startsWith("https://") &&
              safeRichUrl(d.trackingUrl) && (
                <a
                  href={d.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {accountText("trackShipment")}
                </a>
              )}
            {rights.includes("orders.write") &&
              actions
                .filter(
                  (a: OrderAction) =>
                    a.kind === "delivery" && a.deliveryIndex === index,
                )
                .map((a: OrderAction) => (
                  <div key={a.id}>
                    {a.state === "shipped" && (
                      <>
                        <label>
                          {o("tracking")}
                          <input
                            value={tracking[index] ?? ""}
                            onChange={(e) =>
                              setTracking({
                                ...tracking,
                                [index]: e.target.value,
                              })
                            }
                            maxLength={100}
                          />
                        </label>
                        <label>
                          {accountText("trackingUrl")}
                          <input
                            type="url"
                            maxLength={2000}
                            value={links[index] ?? ""}
                            onChange={(e) =>
                              setLinks({ ...links, [index]: e.target.value })
                            }
                          />
                        </label>
                      </>
                    )}
                    <button
                      disabled={busy || !a.enabled}
                      className="studio-primary"
                      onClick={() =>
                        onAction(
                          a,
                          tracking[index] ?? "",
                          links[index] ?? d.trackingUrl ?? "",
                        )
                      }
                    >
                      {label(a)}
                    </button>
                    {a.reason && <small>{o(a.reason)}</small>}
                  </div>
                ))}
          </div>
        ))
      ) : (
        <p>{o("digital")}</p>
      )}
    </section>
  );
}
