/** Interface copy for embedded app result loading and failure states. */
export function conversationAppText(locale: string) {
  switch (locale.split("-")[0]) {
    case "de":
      return {
        title: "App-Ergebnis",
        loading: "App-Ansicht wird geladen…",
        unavailable: "Diese App-Ansicht ist nicht verfügbar.",
        review: "Vorgeschlagene Änderung prüfen",
      };
    case "fr":
      return {
        title: "Résultat de l’application",
        loading: "Chargement de la vue…",
        unavailable: "Cette vue est indisponible.",
        review: "Vérifier la modification proposée",
      };
    case "es":
      return {
        title: "Resultado de la aplicación",
        loading: "Cargando la vista…",
        unavailable: "Esta vista no está disponible.",
        review: "Revisar el cambio propuesto",
      };
    default:
      return {
        title: "App result",
        loading: "Loading app view…",
        unavailable: "This app view is unavailable.",
        review: "Review proposed change",
      };
  }
}
