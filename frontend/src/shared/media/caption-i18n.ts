/** Interface copy for shared caption editing; content languages come from the actual shop context. */
import { useLocale } from "../i18n/i18n";
const en = {
  alt: "Alternative text",
  caption: "Image caption",
  hint: "Visible below the image. Alternative text describes the image for screen readers.",
  generate: "Suggest with AI",
  working: "Preparing suggestion…",
  proposal: "Review caption",
  imageBasis:
    "Based on the image and your current content. Save the draft after reviewing.",
  contextBasis:
    "Based on the current content. The image was not analysed. Check the wording before saving.",
  apply: "Use in draft",
  discard: "Discard",
  error:
    "The caption could not be prepared. Your content is unchanged. Try again or write it yourself.",
};
type Copy = typeof en;
const de: Copy = {
  alt: "Alternativtext",
  caption: "Bildunterschrift",
  hint: "Sichtbar unter dem Bild. Der Alternativtext beschreibt das Bild für Screenreader.",
  generate: "Mit KI vorschlagen",
  working: "Vorschlag wird vorbereitet…",
  proposal: "Bildunterschrift prüfen",
  imageBasis:
    "Aus dem Bild und deinem aktuellen Inhalt vorbereitet. Speichere den Entwurf nach der Prüfung.",
  contextBasis:
    "Aus dem aktuellen Inhalt vorbereitet. Das Bild wurde nicht ausgewertet. Prüfe den Text vor dem Speichern.",
  apply: "In Entwurf übernehmen",
  discard: "Verwerfen",
  error:
    "Die Bildunterschrift konnte nicht vorbereitet werden. Dein Inhalt ist unverändert. Versuche es erneut oder schreibe den Text selbst.",
};
const fr: Copy = {
  alt: "Texte alternatif",
  caption: "Légende de l’image",
  hint: "Visible sous l’image. Le texte alternatif décrit l’image pour les lecteurs d’écran.",
  generate: "Suggérer avec l’IA",
  working: "Préparation de la suggestion…",
  proposal: "Vérifier la légende",
  imageBasis:
    "Préparée à partir de l’image et du contenu actuel. Enregistrez le brouillon après vérification.",
  contextBasis:
    "Préparée à partir du contenu actuel. L’image n’a pas été analysée. Vérifiez le texte avant de l’enregistrer.",
  apply: "Utiliser dans le brouillon",
  discard: "Ignorer",
  error:
    "La légende n’a pas pu être préparée. Votre contenu est inchangé. Réessayez ou rédigez le texte vous-même.",
};
const es: Copy = {
  alt: "Texto alternativo",
  caption: "Pie de imagen",
  hint: "Visible debajo de la imagen. El texto alternativo describe la imagen para lectores de pantalla.",
  generate: "Sugerir con IA",
  working: "Preparando sugerencia…",
  proposal: "Revisar el pie de imagen",
  imageBasis:
    "Preparado a partir de la imagen y el contenido actual. Guarda el borrador después de revisarlo.",
  contextBasis:
    "Preparado a partir del contenido actual. La imagen no se ha analizado. Revisa el texto antes de guardarlo.",
  apply: "Usar en el borrador",
  discard: "Descartar",
  error:
    "No se pudo preparar el pie de imagen. El contenido no ha cambiado. Inténtalo de nuevo o escribe el texto.",
};
export function useCaptionText() {
  const { locale } = useLocale();
  const copy =
    ({ de, fr, es } as Record<string, Copy>)[locale.slice(0, 2)] ?? en;
  return (key: keyof Copy) => copy[key];
}
