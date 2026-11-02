/** Shared EN/DE/FR/ES vocabulary for the welcome, guided steps and continuation rail. */
import { useLocale } from "../../shared/i18n/i18n";
const words = {
  title: [
    "Set up your shop",
    "Shop einrichten",
    "Configurer la boutique",
    "Configurar tienda",
  ],
  welcome: [
    "Your shop starts here.",
    "Hier beginnt dein Shop.",
    "Votre boutique commence ici.",
    "Tu tienda empieza aquí.",
  ],
  welcomeHint: [
    "Let’s make it yours, one useful step at a time. We’ll use what’s already in your shop and show you exactly where to continue.",
    "Machen wir deinen Shop startklar. Schritt für Schritt, mit dem, was schon da ist, und einem klaren Weg zum nächsten Ergebnis.",
    "Personnalisez votre boutique étape par étape. Nous utilisons les données existantes et vous guidons vers la suite.",
    "Prepara tu tienda paso a paso. Usamos lo que ya existe y te mostramos cómo continuar.",
  ],
  begin: ["Let’s set it up", "Los geht’s", "Commencer", "Empezar"],
  later: [
    "I’ll explore first",
    "Erst einmal umschauen",
    "Explorer d’abord",
    "Explorar primero",
  ],
  pause: [
    "Continue later",
    "Später weitermachen",
    "Continuer plus tard",
    "Continuar después",
  ],
  progress: [
    "{done} of {total} areas reviewed",
    "{done} von {total} Bereichen geprüft",
    "{done} domaines sur {total} vérifiés",
    "{done} de {total} áreas revisadas",
  ],
  hint: [
    "Your next step, with your real shop data.",
    "Dein nächster Schritt, mit deinen echten Shop-Daten.",
    "La prochaine étape, avec vos données réelles.",
    "Tu siguiente paso, con los datos reales de tu tienda.",
  ],
  dirty: [
    "Save your company details before continuing.",
    "Speichere deine Unternehmensdaten, bevor du fortfährst.",
    "Enregistrez les coordonnées avant de continuer.",
    "Guarda los datos de la empresa antes de continuar.",
  ],
  saved: [
    "Progress saved for your account in this shop",
    "Fortschritt für dein Konto in diesem Shop gespeichert",
    "Progression enregistrée pour votre compte dans cette boutique",
    "Progreso guardado para tu cuenta en esta tienda",
  ],
  loading: [
    "Reading your setup…",
    "Deine Einrichtung wird geladen…",
    "Chargement de la configuration…",
    "Cargando tu configuración…",
  ],
  loadError: [
    "We couldn’t read your progress. Reload to try again. You can still use your shop.",
    "Dein Fortschritt konnte nicht geladen werden. Versuche es mit Neu laden. Deinen Shop kannst du weiter nutzen.",
    "Impossible de charger votre progression. Réessayez. Votre boutique reste accessible.",
    "No se pudo cargar tu progreso. Recarga para reintentar. Puedes seguir usando tu tienda.",
  ],
  saveError: [
    "Progress wasn’t saved. Reload if another window changed it. Your shop settings are unaffected.",
    "Der Fortschritt wurde nicht gespeichert. Lade neu, falls ein anderes Fenster ihn geändert hat. Deine Shop-Einstellungen bleiben erhalten.",
    "Progression non enregistrée. Rechargez si une autre fenêtre l’a modifiée. Les réglages de la boutique sont conservés.",
    "No se guardó el progreso. Recarga si otra ventana lo cambió. Los ajustes de tu tienda se conservan.",
  ],
  retry: ["Reload", "Neu laden", "Recharger", "Recargar"],
  open: [
    "Open this step",
    "Diesen Schritt öffnen",
    "Ouvrir cette étape",
    "Abrir este paso",
  ],
  reviewed: [
    "I’ve reviewed this, continue",
    "Geprüft, weiter",
    "Vérifié, continuer",
    "Revisado, continuar",
  ],
  checked: [
    "Reviewed by you",
    "Von dir geprüft",
    "Vérifié par vous",
    "Revisado por ti",
  ],
  pending: ["To review", "Noch prüfen", "À vérifier", "Por revisar"],
  return: [
    "Back to setup",
    "Zurück zur Einrichtung",
    "Revenir à la configuration",
    "Volver a la configuración",
  ],
  continuing: [
    "You’re setting up your shop",
    "Du richtest gerade deinen Shop ein",
    "Configuration en cours",
    "Estás configurando tu tienda",
  ],
  preview: [
    "Open your shop",
    "Deinen Shop öffnen",
    "Ouvrir votre boutique",
    "Abrir tu tienda",
  ],
  current: [
    "Already in your shop",
    "Schon in deinem Shop",
    "Déjà dans votre boutique",
    "Ya en tu tienda",
  ],
  factsError: [
    "Some setup data couldn’t be loaded. Retry before relying on this summary.",
    "Ein Teil der Einrichtungsdaten konnte nicht geladen werden. Lade die Übersicht erneut, bevor du dich darauf verlässt.",
    "Certaines données sont indisponibles. Rechargez avant de vous fier au résumé.",
    "No se pudieron cargar algunos datos. Recarga antes de usar este resumen.",
  ],
  noProducts: [
    "No products yet",
    "Noch keine Produkte",
    "Aucun produit",
    "Aún no hay productos",
  ],
  hasProducts: [
    "Products are already available",
    "Produkte sind bereits vorhanden",
    "Des produits sont déjà disponibles",
    "Ya hay productos disponibles",
  ],
  companyMissing: [
    "Company details still need your attention",
    "Unternehmensdaten noch vervollständigen",
    "Compléter les coordonnées de l’entreprise",
    "Completa los datos de la empresa",
  ],
  companyPresent: [
    "Company name and contact email saved",
    "Unternehmensname und Kontakt-E-Mail gespeichert",
    "Nom et e-mail de l’entreprise enregistrés",
    "Nombre y correo de la empresa guardados",
  ],
  methods: [
    "{shipping} shipping and {payment} payment methods enabled",
    "{shipping} Versandarten und {payment} Zahlungsarten aktiv",
    "{shipping} modes de livraison et {payment} moyens de paiement actifs",
    "{shipping} métodos de envío y {payment} de pago activos",
  ],
  simulation: [
    "Test payments are simulated. A real provider needs a separate connection and check.",
    "Testzahlungen sind simuliert. Für echte Zahlungen muss ein Anbieter separat verbunden und geprüft werden.",
    "Les paiements de test sont simulés. Connectez et vérifiez un prestataire pour les paiements réels.",
    "Los pagos de prueba son simulados. Conecta y verifica un proveedor para pagos reales.",
  ],
  liveWarning: [
    "You’re editing the live shop. Use a private sandbox to try design and catalogue changes before publishing.",
    "Du bearbeitest den Live-Shop. Probiere Gestaltung und Katalogänderungen zuerst in einer privaten Sandbox aus.",
    "Vous modifiez la boutique en ligne. Testez design et catalogue dans une sandbox privée avant publication.",
    "Estás editando la tienda activa. Prueba diseño y catálogo en una sandbox privada antes de publicar.",
  ],
  sandbox: [
    "Create or open a sandbox",
    "Sandbox anlegen oder öffnen",
    "Créer ou ouvrir une sandbox",
    "Crear o abrir sandbox",
  ],
  ai: [
    "Prepare with AI",
    "Mit KI vorbereiten",
    "Préparer avec l’IA",
    "Preparar con IA",
  ],
  aiPrompt: [
    "Help me set up my merchant shop. Current area: {step}. Suggest concrete next actions using my current shop data and permissions. Prepare changes for review; do not act as a shopping adviser or publish changes.",
    "Hilf mir als Händler bei der Einrichtung meines Shops. Aktueller Bereich: {step}. Schlage anhand meiner Shop-Daten und Rechte konkrete nächste Schritte vor und bereite Änderungen zur Prüfung vor. Biete keine Einkaufsberatung an und veröffentliche nichts.",
    "Aidez-moi en tant que marchand à configurer ma boutique. Domaine : {step}. Proposez des étapes selon mes données et droits, avec validation. Ne conseillez pas un acheteur et ne publiez rien.",
    "Ayúdame como comerciante a configurar mi tienda. Área: {step}. Propón pasos según mis datos y permisos y prepara cambios para revisión. No actúes como asesor de compras ni publiques cambios.",
  ],
  done: [
    "You’ve found your way around.",
    "Dein Shop hat jetzt eine Richtung.",
    "Vous avez pris vos repères.",
    "Tu tienda ya tiene rumbo.",
  ],
  doneHint: [
    "You’ve reviewed every setup area. Keep testing your shop and connect real providers when you’re ready. You can reopen this guide at any time.",
    "Du hast alle Einrichtungsbereiche geprüft. Teste deinen Shop weiter und verbinde echte Anbieter, wenn du bereit bist. Diesen Assistenten kannst du jederzeit wieder öffnen.",
    "Tous les domaines sont vérifiés. Continuez les tests et connectez les prestataires réels lorsque vous êtes prêt. Ce guide reste accessible.",
    "Has revisado todas las áreas. Sigue probando y conecta proveedores reales cuando estés listo. Puedes volver a esta guía cuando quieras.",
  ],
  workspace: [
    "Go to my workspace",
    "Zu meinem Arbeitsplatz",
    "Aller à mon espace",
    "Ir a mi espacio",
  ],
  next: [
    "What comes next",
    "Was danach möglich ist",
    "La suite",
    "Qué viene después",
  ],
  team: [
    "Invite your team",
    "Dein Team einladen",
    "Inviter votre équipe",
    "Invitar a tu equipo",
  ],
  apps: [
    "Extend with apps",
    "Mit Apps erweitern",
    "Étendre avec des apps",
    "Ampliar con apps",
  ],
  liveOnly: [
    "Your setup guide belongs to the live shop. Return to Live shop in the environment menu to continue; your sandbox changes stay private.",
    "Deine Einrichtung gehört zum Live-Shop. Wähle oben im Umgebungsmenü Live-Shop, um fortzufahren. Deine Sandbox-Änderungen bleiben privat.",
    "La configuration concerne la boutique en ligne. Sélectionnez Boutique en ligne dans le menu d’environnement pour continuer. Les modifications du bac à sable restent privées.",
    "La guía corresponde a la tienda en vivo. Selecciona Tienda en vivo en el menú de entorno para continuar. Los cambios del entorno de pruebas siguen privados.",
  ],
  rights: [
    "Your current permissions don’t allow this change. Ask your shop administrator.",
    "Deine aktuellen Rechte erlauben diese Änderung nicht. Wende dich an die Shop-Administration.",
    "Vos droits ne permettent pas cette modification. Contactez l’administrateur.",
    "Tus permisos no permiten este cambio. Consulta al administrador.",
  ],
  reset: [
    "Review again",
    "Noch einmal prüfen",
    "Vérifier à nouveau",
    "Volver a revisar",
  ],
} as const;
export type SetupWord = keyof typeof words;
export function useSetupText() {
  const { locale } = useLocale();
  const index =
    ({ en: 0, de: 1, fr: 2, es: 3 } as Record<string, number>)[
      locale.slice(0, 2)
    ] ?? 0;
  return (key: SetupWord, values: Record<string, string | number> = {}) =>
    Object.entries(values).reduce<string>(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      words[key][index],
    );
}
