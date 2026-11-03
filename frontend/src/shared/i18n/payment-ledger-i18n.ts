/** Merchant payment balances and capture allocation vocabulary in every Studio language. */
import { useLocale } from "./i18n";
export const paymentLedgerWords = {
  captured: ["Captured", "Eingezogen", "Capturé", "Capturado"],
  refunded: ["Refunded", "Erstattet", "Remboursé", "Reembolsado"],
  remaining: [
    "Still authorized",
    "Noch autorisiert",
    "Encore autorisé",
    "Aún autorizado",
  ],
  amount: ["Amount", "Betrag", "Montant", "Importe"],
  capture: [
    "Capture amount",
    "Betrag einziehen",
    "Capturer le montant",
    "Capturar importe",
  ],
  refund: [
    "Refund amount",
    "Betrag erstatten",
    "Rembourser le montant",
    "Reembolsar importe",
  ],
  selectCapture: [
    "Capture to refund",
    "Einzug für die Erstattung",
    "Capture à rembourser",
    "Captura a reembolsar",
  ],
  final: [
    "Close authorization after this capture",
    "Autorisierung nach diesem Einzug schließen",
    "Clôturer l’autorisation après cette capture",
    "Cerrar autorización tras esta captura",
  ],
  finalHint: [
    "The unused amount can no longer be captured. Existing captures remain refundable.",
    "Der Restbetrag kann anschließend nicht mehr eingezogen werden. Bisherige Einzüge bleiben erstattbar.",
    "Le solde ne pourra plus être capturé. Les captures existantes restent remboursables.",
    "El saldo ya no podrá capturarse. Las capturas existentes siguen siendo reembolsables.",
  ],
  closed: [
    "Authorization closed",
    "Autorisierung geschlossen",
    "Autorisation clôturée",
    "Autorización cerrada",
  ],
  timing: [
    "When to collect payment",
    "Wann wird die Zahlung eingezogen?",
    "Quand encaisser le paiement",
    "Cuándo cobrar el pago",
  ],
  inherit: [
    "Use provider default",
    "Anbietervorgabe verwenden",
    "Utiliser le réglage du prestataire",
    "Usar configuración del proveedor",
  ],
  immediate: [
    "Immediately after approval",
    "Direkt nach Freigabe",
    "Dès l’approbation",
    "Tras la aprobación",
  ],
  deferred: [
    "Authorize first, capture in the order",
    "Zuerst autorisieren, in der Bestellung einziehen",
    "Autoriser, puis capturer dans la commande",
    "Autorizar y capturar desde el pedido",
  ],
  partial: [
    "Partially captured",
    "Teilweise eingezogen",
    "Partiellement capturé",
    "Capturado parcialmente",
  ],
  amountHint: [
    "Enter an exact amount within the available balance.",
    "Gib einen genauen Betrag innerhalb des verfügbaren Guthabens ein.",
    "Saisissez un montant exact dans la limite du solde disponible.",
    "Introduce un importe exacto dentro del saldo disponible.",
  ],
} as const;
export function usePaymentLedgerText() {
  const { locale } = useLocale();
  const n = locale.startsWith("de")
    ? 1
    : locale.startsWith("fr")
      ? 2
      : locale.startsWith("es")
        ? 3
        : 0;
  return (key: keyof typeof paymentLedgerWords) => paymentLedgerWords[key][n];
}
