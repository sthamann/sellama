/** Concrete outcomes for each setup step in every supported interface language. */
import { useLocale } from "../../shared/i18n/i18n";
import type { SetupStep } from "./setup-model";
const content = {
  basics: [
    [
      "Make it your business",
      "Give receipts and customers the right company name, address and contact. Then choose your languages and markets.",
      "Company details",
      "Languages & markets",
    ],
    [
      "Dein Unternehmen, dein Shop",
      "Damit Belege und Kunden die richtigen Angaben bekommen: Name, Anschrift und Kontakt vervollständigen. Danach Sprachen und Märkte wählen.",
      "Unternehmensdaten bearbeiten",
      "Sprachen und Märkte",
    ],
    [
      "Votre entreprise, votre boutique",
      "Renseignez nom, adresse et contact pour vos clients et documents. Choisissez ensuite langues et marchés.",
      "Coordonnées de l’entreprise",
      "Langues et marchés",
    ],
    [
      "Tu empresa, tu tienda",
      "Completa nombre, dirección y contacto para clientes y documentos. Después elige idiomas y mercados.",
      "Datos de la empresa",
      "Idiomas y mercados",
    ],
  ],
  products: [
    [
      "Bring your first products",
      "Create a product, import a CSV or prepare a catalogue from a URL or description with AI. Check images, prices and stock in a sandbox.",
      "Open products",
      "Prepare products with AI",
    ],
    [
      "Deine ersten Produkte",
      "Lege ein Produkt an, importiere eine CSV oder bereite per KI einen Katalog aus einer URL oder Beschreibung vor. Bilder, Preise und Bestand prüfst du zuerst in der Sandbox.",
      "Produkte öffnen",
      "Produkte mit KI vorbereiten",
    ],
    [
      "Vos premiers produits",
      "Créez un produit, importez un CSV ou préparez un catalogue par URL ou description avec l’IA. Vérifiez images, prix et stock en sandbox.",
      "Ouvrir les produits",
      "Préparer avec l’IA",
    ],
    [
      "Tus primeros productos",
      "Crea un producto, importa un CSV o prepara un catálogo desde una URL o descripción con IA. Revisa imágenes, precios y stock en sandbox.",
      "Abrir productos",
      "Preparar productos con IA",
    ],
  ],
  design: [
    [
      "Make your shop feel like you",
      "Open the real preview, adjust colours and sections, or give the design agent a reference URL or screenshot. Review the private draft before publishing.",
      "Design your shop",
      "Review publication",
    ],
    [
      "So sieht dein Shop aus",
      "Öffne die echte Vorschau, passe Farben und Bereiche an oder gib dem Design-Agenten eine Referenz-URL oder einen Screenshot. Vor dem Veröffentlichen prüfst du deinen privaten Entwurf.",
      "Shop gestalten",
      "Veröffentlichung prüfen",
    ],
    [
      "Un design à votre image",
      "Ouvrez l’aperçu réel, ajustez couleurs et sections ou fournissez une URL ou capture à l’agent. Vérifiez le brouillon privé avant publication.",
      "Créer le design",
      "Vérifier la publication",
    ],
    [
      "Dale tu estilo",
      "Abre la vista real, ajusta colores y secciones o dale al agente una URL o captura. Revisa el borrador privado antes de publicar.",
      "Diseñar tienda",
      "Revisar publicación",
    ],
  ],
  checkout: [
    [
      "From basket to order",
      "Check delivery countries, shipping costs, taxes and payment methods together. Keep test payments separate from real provider activation.",
      "Set up shipping",
      "Set up payments",
    ],
    [
      "Vom Warenkorb zur Bestellung",
      "Prüfe Lieferländer, Versandkosten, Steuern und Zahlungsarten gemeinsam. Testzahlungen und die Freischaltung echter Anbieter bleiben getrennte Schritte.",
      "Versand einrichten",
      "Zahlungen einrichten",
    ],
    [
      "Du panier à la commande",
      "Vérifiez ensemble pays, frais de livraison, taxes et paiements. Distinguez tests et activation des prestataires réels.",
      "Configurer la livraison",
      "Configurer les paiements",
    ],
    [
      "Del carrito al pedido",
      "Revisa países, gastos de envío, impuestos y pagos juntos. Distingue las pruebas de la activación de proveedores reales.",
      "Configurar envío",
      "Configurar pagos",
    ],
  ],
  legal: [
    [
      "Give customers clear information",
      "Review your company disclosures, privacy, terms, cancellation information and consent settings for each market and language.",
      "Review legal settings",
      "Company disclosures",
    ],
    [
      "Klare Informationen für Kunden",
      "Prüfe Impressum, Datenschutz, Bedingungen, Widerruf und Einwilligungen für deine Märkte und Sprachen.",
      "Rechtliches prüfen",
      "Unternehmensangaben",
    ],
    [
      "Des informations claires",
      "Vérifiez mentions légales, confidentialité, conditions, rétractation et consentement pour chaque marché et langue.",
      "Vérifier les informations légales",
      "Coordonnées de l’entreprise",
    ],
    [
      "Información clara para tus clientes",
      "Revisa datos legales, privacidad, condiciones, desistimiento y consentimiento para cada mercado e idioma.",
      "Revisar ajustes legales",
      "Datos legales de la empresa",
    ],
  ],
  test: [
    [
      "Take the customer’s journey",
      "Open your shop, choose a product and complete a simulated order. Then check the order and document in your administration. Confirm this step only after you’ve tried it.",
      "Open shop and test",
      "Check orders",
    ],
    [
      "Jetzt selbst Kunde sein",
      "Öffne deinen Shop, wähle ein Produkt und schließe eine simulierte Bestellung ab. Prüfe danach Bestellung und Beleg im Admin. Bestätige diesen Schritt erst nach deinem Test.",
      "Shop öffnen und testen",
      "Bestellungen prüfen",
    ],
    [
      "Suivez le parcours client",
      "Ouvrez la boutique, choisissez un produit et passez une commande simulée. Vérifiez ensuite commande et document dans l’administration avant de confirmer.",
      "Ouvrir et tester",
      "Vérifier les commandes",
    ],
    [
      "Prueba como cliente",
      "Abre tu tienda, elige un producto y completa un pedido simulado. Después revisa el pedido y documento en administración antes de confirmar.",
      "Abrir y probar tienda",
      "Revisar pedidos",
    ],
  ],
} as const;
export function useStepText() {
  const { locale } = useLocale();
  const index =
    ({ en: 0, de: 1, fr: 2, es: 3 } as Record<string, number>)[
      locale.slice(0, 2)
    ] ?? 0;
  return (step: SetupStep) => {
    const [title, hint, action, secondary] = content[step][index];
    return { title, hint, action, secondary };
  };
}
