/** Read-only payment transaction and fee vocabulary for every Studio language. */
import { useLocale } from "./i18n";
export const paymentDetailsWords = {
  create: [
    "Create transaction",
    "Transaktion anlegen",
    "Créer la transaction",
    "Crear transacción",
  ],
  capture: ["Capture", "Einzug", "Capture", "Captura"],
  authorize: ["Authorize", "Autorisieren", "Autoriser", "Autorizar"],
  void: [
    "Void authorization",
    "Autorisierung aufheben",
    "Annuler l’autorisation",
    "Anular autorización",
  ],
  cancel: ["Cancel", "Abbrechen", "Annuler", "Cancelar"],
  refund: ["Refund", "Erstattung", "Remboursement", "Reembolso"],
  reconcile: ["Reconcile", "Abgleichen", "Rapprocher", "Conciliar"],
  queued: ["Queued", "Eingereiht", "En attente", "En cola"],
  running: ["Processing", "In Bearbeitung", "En cours", "En proceso"],
  succeeded: ["Completed", "Abgeschlossen", "Terminé", "Completado"],
  failed: ["Failed", "Fehlgeschlagen", "Échec", "Error"],
  uncertain: [
    "Confirmation pending",
    "Bestätigung ausstehend",
    "Confirmation en attente",
    "Confirmación pendiente",
  ],
  title: [
    "Transaction details & history",
    "Transaktionsdetails & Verlauf",
    "Détails et historique",
    "Detalles e historial",
  ],
  loading: [
    "Loading transaction…",
    "Transaktion wird geladen…",
    "Chargement de la transaction…",
    "Cargando transacción…",
  ],
  readOnly: [
    "Provider observations and the shop history are shown separately. Refreshing does not change the payment.",
    "Anbieterbelege und Shopverlauf werden getrennt angezeigt. Aktualisieren verändert die Zahlung nicht.",
    "Les observations du prestataire et l’historique sont séparés. Actualiser ne modifie pas le paiement.",
    "Los datos del proveedor y el historial se muestran por separado. Actualizar no modifica el pago.",
  ],
  unavailable: [
    "Provider details could not be loaded. Try refreshing.",
    "Die Anbieterbelege konnten nicht geladen werden. Versuche es mit Aktualisieren.",
    "Les détails sont indisponibles. Réessayez avec Actualiser.",
    "No se pudieron cargar los detalles. Vuelve a actualizar.",
  ],
  unsupported: [
    "This payment version provides the native history only.",
    "Für diese Zahlungsversion ist der native Verlauf verfügbar.",
    "Cette version fournit uniquement l’historique natif.",
    "Esta versión ofrece únicamente el historial nativo.",
  ],
  not_created: [
    "The provider transaction has not been created yet.",
    "Die Anbietertransaktion wurde noch nicht angelegt.",
    "La transaction du prestataire n’est pas encore créée.",
    "La transacción del proveedor aún no se ha creado.",
  ],
  authorizations: [
    "Authorizations",
    "Autorisierungen",
    "Autorisations",
    "Autorizaciones",
  ],
  captures: ["Captures", "Einzüge", "Captures", "Capturas"],
  refunds: ["Refunds", "Erstattungen", "Remboursements", "Reembolsos"],
  provider: [
    "Provider fee",
    "Anbietergebühr",
    "Frais du prestataire",
    "Comisión del proveedor",
  ],
  platform: [
    "Platform fee",
    "Plattformgebühr",
    "Frais de plateforme",
    "Comisión de plataforma",
  ],
  net: ["Net received", "Netto erhalten", "Net reçu", "Neto recibido"],
  history: [
    "Shop payment history",
    "Zahlungsverlauf im Shop",
    "Historique du paiement",
    "Historial del pago",
  ],
  noHistory: [
    "No payment transitions recorded yet.",
    "Noch keine Zahlungsübergänge aufgezeichnet.",
    "Aucune transition enregistrée.",
    "Aún no hay transiciones registradas.",
  ],
  commands: [
    "Payment operations",
    "Zahlungsvorgänge",
    "Opérations de paiement",
    "Operaciones de pago",
  ],
  bounded: [
    "Shows the latest 100 recorded changes and operations.",
    "Zeigt die letzten 100 gespeicherten Änderungen und Vorgänge.",
    "Affiche les 100 dernières modifications et opérations.",
    "Muestra los últimos 100 cambios y operaciones.",
  ],
  refresh: [
    "Refresh details",
    "Details aktualisieren",
    "Actualiser les détails",
    "Actualizar detalles",
  ],
} as const;
export function usePaymentDetailsText() {
  const { locale } = useLocale();
  const n = locale.startsWith("de")
    ? 1
    : locale.startsWith("fr")
      ? 2
      : locale.startsWith("es")
        ? 3
        : 0;
  return (key: keyof typeof paymentDetailsWords) => paymentDetailsWords[key][n];
}
