/** Shared visual-workspace controls use the Studio interface language, independently of content. */
import { useLocale } from "../i18n/i18n";
const words = {
  chooseView: [
    "Choose a view",
    "Ansicht wählen",
    "Choisir une vue",
    "Elegir vista",
  ],
  provided: [
    "Image attached",
    "Bild angehängt",
    "Image jointe",
    "Imagen adjunta",
  ],
  partial: [
    "Partial page capture",
    "Seite teilweise erfasst",
    "Page partiellement capturée",
    "Página capturada parcialmente",
  ],
  unavailable: [
    "Reference unavailable",
    "Vorlage nicht erreichbar",
    "Référence indisponible",
    "Referencia no disponible",
  ],
  captureHint: [
    "Bounded page source, without running scripts. Upload a screenshot for the visual design.",
    "Begrenzt erfasster Seiteninhalt ohne ausgeführte Skripte. Für das visuelle Design einen Screenshot hinzufügen.",
    "Source de page limitée, sans exécuter de scripts. Ajoutez une capture pour le design visuel.",
    "Contenido limitado de la página, sin ejecutar scripts. Añade una captura para el diseño visual.",
  ],
  unavailableHint: [
    "This page could not be captured safely. Add a screenshot instead.",
    "Diese Seite konnte nicht sicher erfasst werden. Füge einen Screenshot hinzu.",
    "Cette page n’a pas pu être capturée de façon sûre. Ajoutez une capture d’écran.",
    "No se pudo capturar esta página de forma segura. Añade una captura de pantalla.",
  ],
  ideas: [
    "Ideas for this selection",
    "Ideen für diese Auswahl",
    "Idées pour cette sélection",
    "Ideas para esta selección",
  ],
  spacious: [
    "More space",
    "Luftiger gestalten",
    "Plus d’espace",
    "Más espacio",
  ],
  spaciousPrompt: [
    "Make the selected area more spacious. Preserve its content, behavior, data and permissions.",
    "Gestalte den ausgewählten Bereich luftiger. Behalte Inhalte, Verhalten, Daten und Rechte bei.",
    "Aère la zone sélectionnée. Préserve son contenu, son comportement, ses données et ses droits.",
    "Da más espacio al área seleccionada. Conserva su contenido, comportamiento, datos y permisos.",
  ],
  labels: [
    "Improve labels",
    "Texte verbessern",
    "Améliorer les libellés",
    "Mejorar etiquetas",
  ],
  labelsPrompt: [
    "Improve the labels in this selected placement. Preserve all fields, actions, data and permissions.",
    "Verbessere die Beschriftungen im ausgewählten Einbauort. Behalte alle Felder, Aktionen, Daten und Rechte bei.",
    "Améliore les libellés de cet emplacement. Préserve tous les champs, actions, données et droits.",
    "Mejora las etiquetas de esta ubicación. Conserva todos los campos, acciones, datos y permisos.",
  ],
  overview: ["Overview", "Übersicht", "Vue d’ensemble", "Vista general"],
  zoom: ["Canvas zoom", "Canvas-Zoom", "Zoom du canevas", "Zoom del lienzo"],
  fit: ["Fit all", "Alles einpassen", "Tout afficher", "Ajustar todo"],
  pan: [
    "Drag the background to move. Use + and − to zoom.",
    "Hintergrund ziehen zum Verschieben. Mit + und − zoomen.",
    "Glissez le fond pour déplacer. + et − pour zoomer.",
    "Arrastra el fondo para mover. + y − para acercar.",
  ],
  open: [
    "Open editor",
    "Bearbeitung öffnen",
    "Ouvrir l’éditeur",
    "Abrir editor",
  ],
  edit: ["Edit", "Bearbeiten", "Modifier", "Editar"],
  tools: ["Elements", "Bausteine", "Éléments", "Elementos"],
  properties: ["Properties", "Eigenschaften", "Propriétés", "Propiedades"],
  close: [
    "Close panel",
    "Leiste schließen",
    "Fermer le panneau",
    "Cerrar panel",
  ],
  duplicate: [
    "Duplicate element",
    "Element duplizieren",
    "Dupliquer l’élément",
    "Duplicar elemento",
  ],
  behavior: [
    "Edit behavior",
    "Verhalten bearbeiten",
    "Modifier le comportement",
    "Editar comportamiento",
  ],
  fields: [
    "Data fields",
    "Datenfelder",
    "Champs de données",
    "Campos de datos",
  ],
  settings: [
    "App settings",
    "App-Einstellungen",
    "Paramètres de l’app",
    "Ajustes de la app",
  ],
  agent: ["Agent", "Agent", "Agent", "Agente"],
  before: [
    "Current draft",
    "Aktueller Entwurf",
    "Brouillon actuel",
    "Borrador actual",
  ],
  after: [
    "Preview proposal",
    "Vorschlag ansehen",
    "Voir la proposition",
    "Ver propuesta",
  ],
  comparison: [
    "Proposal preview. Your draft is unchanged.",
    "Vorschau des Vorschlags. Dein Entwurf ist unverändert.",
    "Aperçu de la proposition. Le brouillon est inchangé.",
    "Vista de la propuesta. Tu borrador sigue igual.",
  ],
  context: [
    "Selected context",
    "Ausgewählter Kontext",
    "Contexte sélectionné",
    "Contexto seleccionado",
  ],
  allChannels: [
    "All sales channels",
    "Alle Verkaufskanäle",
    "Tous les canaux",
    "Todos los canales",
  ],
  references: [
    "Design references",
    "Designvorlagen",
    "Références visuelles",
    "Referencias de diseño",
  ],
  imageError: [
    "Use at most two PNG, JPEG or WebP images, up to 12 MB and 16 megapixels each.",
    "Verwende höchstens zwei PNG-, JPEG- oder WebP-Bilder mit je bis zu 12 MB und 16 Megapixeln.",
    "Utilisez deux images PNG, JPEG ou WebP au maximum, de 12 Mo et 16 mégapixels chacune.",
    "Usa hasta dos imágenes PNG, JPEG o WebP de hasta 12 MB y 16 megapíxeles cada una.",
  ],
  removeReference: [
    "Remove reference",
    "Vorlage entfernen",
    "Retirer la référence",
    "Quitar referencia",
  ],
  invalidUrls: [
    "Enter up to three public HTTPS URLs, one per line.",
    "Gib bis zu drei öffentliche HTTPS-URLs ein, eine pro Zeile.",
    "Saisissez jusqu’à trois URL HTTPS publiques, une par ligne.",
    "Introduce hasta tres URL HTTPS públicas, una por línea.",
  ],
  source: [
    "Reference URLs",
    "Referenz-URLs",
    "URL de référence",
    "URL de referencia",
  ],
  upload: [
    "Add screenshots or designs",
    "Screenshots oder Designs hinzufügen",
    "Ajouter des captures ou designs",
    "Añadir capturas o diseños",
  ],
  evidence: [
    "References guide the proposal. They never run as code.",
    "Vorlagen helfen beim Vorschlag. Sie werden niemals als Code ausgeführt.",
    "Les références guident la proposition, sans exécuter leur code.",
    "Las referencias orientan la propuesta sin ejecutar su código.",
  ],
  drop: ["Drop here", "Hier einfügen", "Déposer ici", "Soltar aquí"],
  next: ["Next views", "Weitere Ansichten", "Vues suivantes", "Más vistas"],
  previous: [
    "Previous views",
    "Vorherige Ansichten",
    "Vues précédentes",
    "Vistas anteriores",
  ],
  category: ["Category", "Kategorie", "Catégorie", "Categoría"],
  emptyProducts: [
    "No products in this category.",
    "Keine Produkte in dieser Kategorie.",
    "Aucun produit dans cette catégorie.",
    "No hay productos en esta categoría.",
  ],
  categoryHint: [
    "Choose a category to inspect its native listing.",
    "Wähle eine Kategorie für ihre echte Produktliste.",
    "Choisissez une catégorie pour sa liste de produits.",
    "Elige una categoría para ver sus productos.",
  ],
  product: [
    "Product page",
    "Produktseite",
    "Fiche produit",
    "Página de producto",
  ],
  collection: ["Catalogue", "Katalog", "Catalogue", "Catálogo"],
  noViews: [
    "Add an app placement to start designing.",
    "Füge einen App-Einbauort hinzu und beginne mit der Gestaltung.",
    "Ajoutez un emplacement pour commencer.",
    "Añade una ubicación para empezar.",
  ],
} as const;
export type CanvasKey = keyof typeof words;
export function useCanvasText() {
  const { locale } = useLocale();
  const index =
    ({ en: 0, de: 1, fr: 2, es: 3 } as Record<string, number>)[
      locale.slice(0, 2)
    ] ?? 0;
  return (key: CanvasKey) => words[key][index];
}
