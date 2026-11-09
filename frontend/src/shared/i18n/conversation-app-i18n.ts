/** Interface copy for embedded app result loading and failure states. */
export function conversationAppText(locale: string) {
  switch (locale.split("-")[0]) {
    case "de":
      return {
        title: "App-Ergebnis",
        loading: "App-Ansicht wird geladen…",
        unavailable: "Diese App-Ansicht ist nicht verfügbar.",
        review: "Vorgeschlagene Änderung prüfen",
        filterContext: (tool: string, field: string, value: string) =>
          `Berücksichtige die App-Ergebnisse aus ${tool} mit dem Filter ${field}=${value}.`,
      };
    case "fr":
      return {
        title: "Résultat de l’application",
        loading: "Chargement de la vue…",
        unavailable: "Cette vue est indisponible.",
        review: "Vérifier la modification proposée",
        filterContext: (tool: string, field: string, value: string) =>
          `Tiens compte des résultats de ${tool} avec le filtre ${field}=${value}.`,
      };
    case "es":
      return {
        title: "Resultado de la aplicación",
        loading: "Cargando la vista…",
        unavailable: "Esta vista no está disponible.",
        review: "Revisar el cambio propuesto",
        filterContext: (tool: string, field: string, value: string) =>
          `Ten en cuenta los resultados de ${tool} con el filtro ${field}=${value}.`,
      };
    default:
      return {
        title: "App result",
        loading: "Loading app view…",
        unavailable: "This app view is unavailable.",
        review: "Review proposed change",
        filterContext: (tool: string, field: string, value: string) =>
          `Use the app results from ${tool} with the filter ${field}=${value}.`,
      };
  }
}
