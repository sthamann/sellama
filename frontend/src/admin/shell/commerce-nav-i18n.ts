/** Shop areas use the interface locale, independently of catalogue translations. */
import { useLocale } from "../../shared/i18n/i18n";
const words = {
  b2b: ["B2B", "B2B", "B2B", "B2B"],
  companies: ["Companies", "Firmen", "Entreprises", "Empresas"],
  quotes: ["B2B quotes", "B2B-Angebote", "Devis B2B", "Presupuestos B2B"],
  marketplaces: [
    "Marketplaces",
    "Marktplätze",
    "Places de marché",
    "Marketplaces",
  ],
  marketplaceHint: [
    "Connect seller accounts, manage their product offers and review imported orders.",
    "Verbinde Verkäuferkonten, verwalte ihre Produktangebote und prüfe importierte Bestellungen.",
    "Connectez vos comptes vendeurs, gérez les offres et vérifiez les commandes importées.",
    "Conecta cuentas de vendedor, gestiona sus ofertas y revisa los pedidos importados.",
  ],
  b2bDisabled: [
    "This B2B area is turned off in the shop settings.",
    "Dieser B2B-Bereich ist in den Shop-Einstellungen deaktiviert.",
    "Cette section B2B est désactivée dans les paramètres de la boutique.",
    "Esta sección B2B está desactivada en los ajustes de la tienda.",
  ],
} as const;
export function useCommerceNavText() {
  const { locale } = useLocale();
  const index = ["en", "de", "fr", "es"].indexOf(locale.split("-")[0]);
  return (key: keyof typeof words) => words[key][index] ?? words[key][0];
}
