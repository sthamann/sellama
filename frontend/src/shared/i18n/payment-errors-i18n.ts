/** Recoverable merchant payment guidance; immutable provider diagnostics remain server-side. */
export const paymentErrors: Record<string, readonly string[]> = {
  "Capture exceeds the remaining authorization": [
    "Choose an amount within the remaining authorization, or refresh the provider status.",
    "Wähle einen Betrag innerhalb der verbleibenden Autorisierung oder aktualisiere den Anbieterstatus.",
    "Choisissez un montant dans la limite de l’autorisation restante ou actualisez le statut du prestataire.",
    "Elige un importe dentro de la autorización restante o actualiza el estado del proveedor.",
  ],
  "Resolve the outstanding capture before another capture": [
    "The previous capture is still unresolved. Refresh its provider status before collecting another amount.",
    "Der vorherige Einzug ist noch offen. Aktualisiere seinen Anbieterstatus, bevor du einen weiteren Betrag einziehst.",
    "La capture précédente reste en attente. Actualisez son statut avant de capturer un autre montant.",
    "La captura anterior sigue pendiente. Actualiza su estado antes de capturar otro importe.",
  ],
  "Payment capture is already closed": [
    "This authorization is closed. Refresh the order; existing captures can still be refunded.",
    "Diese Autorisierung ist geschlossen. Lade die Bestellung neu. Bestehende Einzüge können weiterhin erstattet werden.",
    "Cette autorisation est clôturée. Actualisez la commande ; les captures existantes restent remboursables.",
    "Esta autorización está cerrada. Actualiza el pedido; las capturas existentes siguen siendo reembolsables.",
  ],
  "Choose an explicit amount for an additional capture": [
    "Enter the exact amount you want to capture next.",
    "Gib den genauen Betrag für den nächsten Einzug ein.",
    "Saisissez le montant exact de la prochaine capture.",
    "Introduce el importe exacto de la siguiente captura.",
  ],
  "Select the capture to refund": [
    "Choose the capture to refund, then enter its refund amount.",
    "Wähle den Einzug für die Erstattung und gib den Erstattungsbetrag ein.",
    "Choisissez la capture à rembourser, puis saisissez le montant.",
    "Elige la captura que deseas reembolsar e introduce el importe.",
  ],
  "Refund capture does not belong to this payment": [
    "Refresh the payment and select one of its listed captures.",
    "Aktualisiere die Zahlung und wähle einen ihrer aufgeführten Einzüge aus.",
    "Actualisez le paiement et choisissez l’une de ses captures.",
    "Actualiza el pago y elige una de sus capturas.",
  ],
  "Capture mode is not supported by this payment method": [
    "This method does not support that collection mode. Use its provider default or choose another method.",
    "Diese Zahlungsart unterstützt den gewählten Einzugsmodus nicht. Verwende die Anbietervorgabe oder eine andere Zahlungsart.",
    "Ce moyen ne prend pas en charge ce mode. Utilisez le réglage du prestataire ou un autre moyen.",
    "Este método no admite ese modo de cobro. Usa la configuración del proveedor u otro método.",
  ],
};
