/** Seed a template with the native sections and keep their original relative order. */
import { newBlock, newPage } from "../model";
import {
  commerceSections,
  commerceSlug,
  type CommerceLayout,
} from "../commerce-layout";

const titles = {
  product: [
    "Product page layout",
    "Layout der Produktseite",
    "Mise en page produit",
    "Diseño de la ficha de producto",
  ],
  category: [
    "Category layout",
    "Layout der Kategorieseite",
    "Mise en page catégorie",
    "Diseño de la categoría",
  ],
  purchase: [
    "Gallery and purchase",
    "Galerie und Kaufbereich",
    "Galerie et achat",
    "Galería y compra",
  ],
  details: [
    "Description and details",
    "Beschreibung und Details",
    "Description et détails",
    "Descripción y detalles",
  ],
  assistance: [
    "Help and recommendations",
    "Hilfe und Empfehlungen",
    "Aide et recommandations",
    "Ayuda y recomendaciones",
  ],
  reviews: ["Reviews", "Bewertungen", "Avis", "Reseñas"],
  filters: [
    "Category and filters",
    "Kategorie und Filter",
    "Catégorie et filtres",
    "Categoría y filtros",
  ],
  listing: [
    "Product listing",
    "Produktliste",
    "Liste de produits",
    "Lista de productos",
  ],
};
export const commerceTitle = (id: keyof typeof titles, language: string) =>
  titles[id][["en", "de", "fr", "es"].indexOf(language.split("-")[0])] ??
  titles[id][0];

export function commerceDraft(
  kind: CommerceLayout,
  channel: string,
  main: string,
  language: string,
) {
  const page = newPage(channel, main, commerceTitle(kind, main));
  return {
    ...page,
    title: { ...page.title, [language]: commerceTitle(kind, language) },
    slug: commerceSlug(kind),
    status: "published" as const,
    content: {
      blocks: commerceSections[kind].map((id) => {
        const block = newBlock("native", main, commerceTitle(id, main));
        return {
          ...block,
          id,
          text: { ...block.text, [language]: commerceTitle(id, language) },
        };
      }),
    },
  };
}
