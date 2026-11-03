/** Payment lifecycle and saved-method event labels share the existing native Flow vocabulary. */
export const paymentEventWords = {
  "payment.state_changed": [
    "Manual payment status changed",
    "Manueller Zahlungsstatus geändert",
    "Statut de paiement manuel modifié",
    "Estado de pago manual cambiado",
  ],
  "payment.instructions.available": [
    "Invoice payment details available",
    "Zahlungsangaben zum Rechnungskauf liegen vor",
    "Informations du paiement sur facture disponibles",
    "Datos del pago por factura disponibles",
  ],
  "payment.instrument.revoked": [
    "Saved payment method revoked",
    "Gespeichertes Zahlungsmittel widerrufen",
    "Moyen de paiement enregistré révoqué",
    "Método de pago guardado revocado",
  ],
  "payment.updated": [
    "Provider payment status changed",
    "Anbieter-Zahlungsstatus geändert",
    "Statut fournisseur modifié",
    "Estado del proveedor cambiado",
  ],
} as const;
