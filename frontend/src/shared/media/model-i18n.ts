/** Shared four-language controls for native 3D media; product descriptions use shop content languages. */
import { useLocale } from "../i18n/i18n";
const words = {
  en: {
    front: "Front view",
    back: "Back view",
    left: "Left view",
    right: "Right view",
    upper: "From above",
    lower: "From below",

    title: "3D models",
    open: "View in 3D",
    loading: "Loading 3D model…",
    ready: "Drag to rotate. Pinch or scroll to zoom.",
    error:
      "The 3D model could not be displayed. Check the file or try another browser.",
    retry: "Try again",
    upload: "Upload GLB model",
    hint: "Self-contained GLB 2 files, up to 20 MiB. Up to four models per product.",
    invalid: "Choose a GLB file between 1 byte and 20 MiB.",
    saving: "Uploading model…",
    remove: "Remove model",
    alt: "Model description",
    caption: "Caption",
    material: "Material variant",
    original: "Original material",
    discover: "Open the 3D preview to see the materials in this file.",
    variantHint:
      "Upload a different shape on the relevant product variant, or reuse the parent model and select a material.",
    inherit: "Use models from parent product",
    parentEmpty: "The parent product has no 3D models.",
    saveFirst: "Save the product before uploading a model.",
    limit: "The gallery allows 20 media items and four 3D models.",
    reset: "Reset view",
    close: "Close 3D view",
    model: "3D model",
    label: "Product media",
  },
  de: {
    front: "Vorderansicht",
    back: "Rückansicht",
    left: "Linke Ansicht",
    right: "Rechte Ansicht",
    upper: "Von oben",
    lower: "Von unten",

    title: "3D-Modelle",
    open: "In 3D ansehen",
    loading: "3D-Modell wird geladen…",
    ready: "Zum Drehen ziehen. Zum Zoomen scrollen oder zwei Finger verwenden.",
    error:
      "Das 3D-Modell konnte nicht angezeigt werden. Prüfe die Datei oder versuche einen anderen Browser.",
    retry: "Erneut versuchen",
    upload: "GLB-Modell hochladen",
    hint: "GLB-2-Dateien mit eingebetteten Ressourcen, bis 20 MiB. Bis zu vier Modelle pro Produkt.",
    invalid: "Wähle eine GLB-Datei zwischen 1 Byte und 20 MiB.",
    saving: "Modell wird hochgeladen…",
    remove: "Modell entfernen",
    alt: "Modellbeschreibung",
    caption: "Bildunterschrift",
    material: "Materialvariante",
    original: "Ursprüngliches Material",
    discover:
      "Öffne die 3D-Vorschau, um die Materialien dieser Datei auszuwählen.",
    variantHint:
      "Lade eine andere Form an der jeweiligen Produktvariante hoch oder übernimm das Modell des Hauptprodukts und wähle ein Material.",
    inherit: "Modelle vom Hauptprodukt übernehmen",
    parentEmpty: "Das Hauptprodukt hat keine 3D-Modelle.",
    saveFirst: "Speichere das Produkt, bevor du ein Modell hochlädst.",
    limit: "Die Galerie erlaubt 20 Medien und vier 3D-Modelle.",
    reset: "Ansicht zurücksetzen",
    close: "3D-Ansicht schließen",
    model: "3D-Modell",
    label: "Produktmedien",
  },
  fr: {
    front: "Vue de face",
    back: "Vue arrière",
    left: "Vue de gauche",
    right: "Vue de droite",
    upper: "Du dessus",
    lower: "Du dessous",

    title: "Modèles 3D",
    open: "Voir en 3D",
    loading: "Chargement du modèle 3D…",
    ready: "Faites glisser pour tourner. Pincez ou faites défiler pour zoomer.",
    error:
      "Le modèle 3D ne peut pas être affiché. Vérifiez le fichier ou essayez un autre navigateur.",
    retry: "Réessayer",
    upload: "Importer un modèle GLB",
    hint: "Fichiers GLB 2 autonomes, jusqu’à 20 MiB. Quatre modèles par produit au maximum.",
    invalid: "Choisissez un fichier GLB entre 1 octet et 20 MiB.",
    saving: "Importation du modèle…",
    remove: "Retirer le modèle",
    alt: "Description du modèle",
    caption: "Légende",
    material: "Variante de matériau",
    original: "Matériau d’origine",
    discover: "Ouvrez l’aperçu 3D pour choisir les matériaux du fichier.",
    variantHint:
      "Importez une autre forme sur la variante du produit ou réutilisez le modèle parent avec un matériau différent.",
    inherit: "Utiliser les modèles du produit parent",
    parentEmpty: "Le produit parent n’a aucun modèle 3D.",
    saveFirst: "Enregistrez le produit avant d’importer un modèle.",
    limit: "La galerie autorise 20 médias et quatre modèles 3D.",
    reset: "Réinitialiser la vue",
    close: "Fermer la vue 3D",
    model: "Modèle 3D",
    label: "Médias du produit",
  },
  es: {
    front: "Vista frontal",
    back: "Vista trasera",
    left: "Vista izquierda",
    right: "Vista derecha",
    upper: "Desde arriba",
    lower: "Desde abajo",

    title: "Modelos 3D",
    open: "Ver en 3D",
    loading: "Cargando modelo 3D…",
    ready: "Arrastra para girar. Pellizca o desplaza para ampliar.",
    error:
      "No se pudo mostrar el modelo 3D. Revisa el archivo o prueba otro navegador.",
    retry: "Reintentar",
    upload: "Subir modelo GLB",
    hint: "Archivos GLB 2 independientes, hasta 20 MiB. Hasta cuatro modelos por producto.",
    invalid: "Elige un archivo GLB entre 1 byte y 20 MiB.",
    saving: "Subiendo modelo…",
    remove: "Quitar modelo",
    alt: "Descripción del modelo",
    caption: "Pie de imagen",
    material: "Variante de material",
    original: "Material original",
    discover: "Abre la vista 3D para elegir los materiales del archivo.",
    variantHint:
      "Sube otra forma en la variante del producto o reutiliza el modelo principal y elige un material.",
    inherit: "Usar modelos del producto principal",
    parentEmpty: "El producto principal no tiene modelos 3D.",
    saveFirst: "Guarda el producto antes de subir un modelo.",
    limit: "La galería permite 20 medios y cuatro modelos 3D.",
    reset: "Restablecer vista",
    close: "Cerrar vista 3D",
    model: "Modelo 3D",
    label: "Medios del producto",
  },
};
export function useModelText() {
  const { locale } = useLocale();
  const lang = locale.split("-")[0] as keyof typeof words;
  return (key: keyof typeof words.en) => (words[lang] ?? words.en)[key];
}

export function useModelA11y() {
  const t = useModelText();
  const result: Record<string, string> = { "interaction-prompt": t("ready") };
  for (const side of ["front", "back", "left", "right"] as const) {
    result[side] = t(side);
    result[`upper-${side}`] = `${t("upper")} · ${t(side)}`;
    result[`lower-${side}`] = `${t("lower")} · ${t(side)}`;
  }
  return result;
}
