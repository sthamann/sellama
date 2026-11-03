/** Shop creation guidance uses the current Studio interface language. */
import { useLocale } from "../../shared/i18n/i18n";
const words = {
  created: ["Shop created", "Shop erstellt", "Boutique créée", "Tienda creada"],
  open: ["Open shop", "Shop öffnen", "Ouvrir la boutique", "Abrir tienda"],
  hint: [
    "A separate home for products, orders and settings in your account.",
    "Ein eigener Bereich für Produkte, Bestellungen und Einstellungen in deinem Konto.",
    "Un espace dédié aux produits, commandes et réglages de votre compte.",
    "Un espacio propio para productos, pedidos y ajustes en tu cuenta.",
  ],
  idHint: [
    "Suggested from the name and editable. Use 2 to 48 lowercase letters, digits or hyphens.",
    "Wird aus dem Namen vorgeschlagen und ist anpassbar. Verwende 2 bis 48 Kleinbuchstaben, Ziffern oder Bindestriche.",
    "Proposé à partir du nom et modifiable. Utilisez 2 à 48 lettres minuscules, chiffres ou tirets.",
    "Se propone a partir del nombre y se puede editar. Usa de 2 a 48 letras minúsculas, cifras o guiones.",
  ],
  cancel: ["Cancel", "Abbrechen", "Annuler", "Cancelar"],
  creating: [
    "Creating shop…",
    "Shop wird erstellt…",
    "Création de la boutique…",
    "Creando tienda…",
  ],
} as const;
export function useWorkspaceCreateText() {
  const { locale } = useLocale();
  const index =
    ({ en: 0, de: 1, fr: 2, es: 3 } as Record<string, number>)[
      locale.slice(0, 2)
    ] ?? 0;
  return (key: keyof typeof words) => words[key][index];
}
