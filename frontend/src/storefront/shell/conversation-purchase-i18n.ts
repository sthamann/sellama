/** Copy for the native cart review embedded alongside a conversation app. */
import { getLocale } from "../../shared/i18n/i18n";

const words = {
  open: [
    "Check variants and delivery",
    "Varianten und Lieferung prüfen",
    "Voir les variantes et la livraison",
    "Ver variantes y entrega",
  ],
  variant: ["Variant", "Variante", "Variante", "Variante"],
  quantity: [
    "Quantity added",
    "Hinzugefügte Menge",
    "Quantité ajoutée",
    "Cantidad añadida",
  ],
  review: [
    "Check price and delivery",
    "Preis und Lieferung prüfen",
    "Vérifier le prix et la livraison",
    "Comprobar precio y entrega",
  ],
  confirm: [
    "Add to cart",
    "In den Warenkorb",
    "Ajouter au panier",
    "Añadir al carrito",
  ],
  item: [
    "Item price",
    "Artikelpreis",
    "Prix de l’article",
    "Precio del artículo",
  ],
  shipping: ["Shipping", "Versand", "Livraison", "Envío"],
  delivery: [
    "Estimated delivery",
    "Voraussichtliche Lieferung",
    "Livraison estimée",
    "Entrega estimada",
  ],
  total: [
    "Cart total",
    "Warenkorb gesamt",
    "Total du panier",
    "Total del carrito",
  ],
  added: [
    "Added to your cart.",
    "Im Warenkorb.",
    "Ajouté à votre panier.",
    "Añadido a tu carrito.",
  ],
  cart: ["Open cart", "Warenkorb öffnen", "Ouvrir le panier", "Abrir carrito"],
  loadError: [
    "Product unavailable in this shop. Try again.",
    "Produkt in diesem Shop nicht verfügbar. Versuche es erneut.",
    "Produit indisponible dans cette boutique. Réessayez.",
    "Producto no disponible en esta tienda. Inténtalo de nuevo.",
  ],
  quoteError: [
    "Price or delivery is unavailable for this selection.",
    "Preis oder Lieferung sind für diese Auswahl nicht verfügbar.",
    "Prix ou livraison indisponible pour cette sélection.",
    "Precio o entrega no disponibles para esta selección.",
  ],
  writeError: [
    "The cart may have changed. Check it before adding again.",
    "Der Warenkorb kann sich geändert haben. Prüfe ihn, bevor du erneut etwas hinzufügst.",
    "Le panier a peut-être changé. Vérifiez-le avant de réessayer.",
    "El carrito puede haber cambiado. Revísalo antes de volver a añadir.",
  ],
} as const;

export const conversationPurchaseText = (key: keyof typeof words) =>
  words[key][{ "en-GB": 0, "de-DE": 1, "fr-FR": 2, "es-ES": 3 }[getLocale()]];
