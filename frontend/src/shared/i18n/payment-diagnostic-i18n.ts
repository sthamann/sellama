/** Exact public diagnostic codes only. Raw provider errors never become UI copy. */
import { useLocale } from "./i18n";

const words = {
  PAYMENT_SAVED_METHODS_UNAVAILABLE: [
    "Saving payment methods is not enabled for this provider account. Enable it in the provider app for this order’s environment, then check the same request again.",
    "Das Speichern von Zahlungsmethoden ist für dieses Anbieterkonto nicht freigeschaltet. Aktiviere die Funktion in der Anbieter App für die Umgebung dieser Bestellung und prüfe anschließend dieselbe Anfrage erneut.",
    "L’enregistrement des moyens de paiement n’est pas activé pour ce compte. Activez cette fonction dans l’application du prestataire pour l’environnement de cette commande, puis vérifiez la même demande.",
    "Guardar métodos de pago no está habilitado para esta cuenta. Activa la función en la aplicación del proveedor para el entorno de este pedido y comprueba la misma solicitud.",
  ],
  PAYMENT_METHOD_UNAVAILABLE: [
    "This payment method is not enabled for the provider account. Check the method’s activation for this order’s test or live environment.",
    "Diese Zahlungsart ist für das Anbieterkonto nicht freigeschaltet. Prüfe die Aktivierung für die Testumgebung oder den Echtbetrieb dieser Bestellung.",
    "Ce moyen de paiement n’est pas activé pour ce compte. Vérifiez son activation pour l’environnement de test ou de production de cette commande.",
    "Este método de pago no está habilitado para esta cuenta. Comprueba su activación para el entorno de prueba o producción de este pedido.",
  ],
  PAYMENT_PROVIDER_CONFIGURATION_REQUIRED: [
    "The payment provider connection needs attention. Check the installed app’s configuration and the account linked to this order’s environment.",
    "Die Verbindung zum Zahlungsanbieter muss geprüft werden. Kontrolliere die Konfiguration der installierten App und das Konto für die Umgebung dieser Bestellung.",
    "La connexion au prestataire doit être vérifiée. Contrôlez la configuration de l’application installée et le compte associé à l’environnement de cette commande.",
    "Revisa la conexión con el proveedor. Comprueba la configuración de la aplicación instalada y la cuenta del entorno de este pedido.",
  ],
} as const;

export function paymentDiagnostic(
  value: unknown,
  locale: string,
): string | undefined {
  if (typeof value !== "string" || !Object.hasOwn(words, value))
    return undefined;
  const index = locale.startsWith("de")
    ? 1
    : locale.startsWith("fr")
      ? 2
      : locale.startsWith("es")
        ? 3
        : 0;
  return words[value as keyof typeof words][index];
}

export function usePaymentDiagnosticText() {
  const { locale } = useLocale();
  return (value: unknown) => paymentDiagnostic(value, locale);
}
