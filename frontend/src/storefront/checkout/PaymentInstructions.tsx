/** Owned recipient instructions stay visible after the private form; their presence never confirms payment. */
import { useEffect, useState } from "react";
import { shopApi } from "../../shared/api/shop-api";
import { useCheckoutText } from "../../shared/i18n/checkout-i18n";
type Instruction = {
  kind: "bank_transfer";
  paymentReference: string;
  iban: string;
  bic: string;
  bankName: string;
  accountHolderName: string;
};
type Response = {
  status: "pending" | "available" | "unsupported";
  instructions: Instruction | null;
  simulated?: boolean;
};
export default function PaymentInstructions({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const { x } = useCheckoutText();
  const [data, setData] = useState<Response>();
  const [error, setError] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    let active = true,
      count = 0,
      timer: ReturnType<typeof setTimeout>;
    const read = async () => {
      try {
        const result = await shopApi<Response>(
          `/store-api/payments/${id}/instructions`,
          undefined,
          token,
        );
        if (!active) return;
        setData(result);
        setError(false);
        if (result.status === "pending" && ++count < 40)
          timer = setTimeout(() => void read(), 5000);
      } catch {
        if (active) setError(true);
      }
    };
    void read();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, token, generation]);
  if (data?.status === "unsupported") return null;
  const bank = data?.instructions;
  return (
    <section
      className="payment-instructions"
      aria-label={x("invoiceInstructions")}
    >
      <h4>{x("invoiceInstructions")}</h4>
      <p>{x(bank ? "invoiceTerms" : "invoiceWaiting")}</p>
      {bank && (
        <>
          {data.simulated && (
            <p className="payment-instructions-test">
              {x("invoiceSimulation")}
            </p>
          )}
          <dl>
            {(
              [
                ["accountHolderName", "invoiceRecipient"],
                ["iban", "invoiceIban"],
                ["bic", "invoiceBic"],
                ["bankName", "invoiceBank"],
                ["paymentReference", "invoiceReference"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <dt>{x(label)}</dt>
                <dd>{bank[key]}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {error && <p role="alert">{x("invoiceLoadError")}</p>}
      {!bank && (
        <button
          className="shop-secondary"
          onClick={() => setGeneration((n) => n + 1)}
        >
          {x("invoiceRefresh")}
        </button>
      )}
    </section>
  );
}
