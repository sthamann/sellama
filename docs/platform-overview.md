# Veyndo: Architektur, Apps und KI im Zusammenhang

<!-- veyndo-language: de -->

Stand 11. November 2026.
Die [Statusseite](status.md) ordnet Implementierung, öffentliche Auslieferung und
tatsächlich durchgespielte Abläufe ein.

Veyndo verbindet einen Shop, eine Händlerverwaltung, erweiterbare Apps und Agenten
auf einem gemeinsamen Commerce-Kern. Ein Ziel wie „Bereite die Kollektion für
Frankreich vor“ kann dadurch Produkte, Übersetzungen, Kategorien und eine
Landingpage zusammenführen. Preise, Bestand und Bestellungen bleiben bei den
zuständigen Geschäftsoperationen.

Veyndo lässt sich als ein Shop betreiben. Wer nur ein Modul braucht, kann
beispielsweise das SDK, die App-Laufzeit oder den Marktplatzdienst mit einem
bestehenden System einsetzen. In beiden Fällen bleibt der Commerce-Kern
zuständig für den verbindlichen Preis, die Bestandsbuchung und die Bestellung.
Checkout führt durch den Kauf. Hintergrunddienste übernehmen Aufgaben wie
E-Mail, Synchronisierung und Suche. [Komponenten und Einstiege](one-shop-components.md).

Eine installierte App kann ihre Ansicht direkt in eine Antwort einbetten. Im
Shop kann jemand zum Beispiel Pflegehinweise filtern, im Studio kann das Team
private Sortimentsnotizen durchsehen. Der Chat vermittelt den Aufruf, und die
App prüft die Rechte mit dem aktuellen Shopkontext. MCP Apps beschreibt diese
Verbindung. OpenUI kann eine passende Ansicht während einer Modellantwort
zusammenbauen. Beide können dieselben Dienstaktionen verwenden.
Im öffentlichen Lumen Shop hat der Produktratgeber Preis und Lieferung für
einen konkreten Artikel prüfen lassen. Erst der Klick legte ihn in den
Warenkorb. In Studio las der Agent eine private Sortimentsnotiz und schlug
einen neuen Pflegesatz vor. Nach Freigabe erschien der Satz in der Sandbox.

![Freigegebener Vorschlag im privaten Studio](assets/apps/product-guide-sandbox-applied-20261111.jpg)

Die [englische Abnahme](status.md#product-guide-actions-in-the-hosted-shop)
zeigt beide Abläufe. [Interaktive Ansichten und Dienstgrenzen](agentic-component-ui.md#one-capability-two-ways-to-present-it).

Ein Entwickler kann den Checkout auch mit einer eigenen Shopoberfläche
verbinden. Der lokale Beispielshop hat den Kauf über das JavaScript SDK
durchgespielt und die ursprüngliche Bestellung nach einer unterbrochenen
Antwort wiedergefunden. Preis, Bestand und Bestellung lagen dabei bei einem
separaten Rust Dienst. [Beispielshop und Ablauf](checkout-component.md#external-reference-storefront).
Mit dem Katalogclient im JavaScript SDK liest eine eigene Oberfläche dieselben
Produkte und Varianten wie der öffentliche Shop. Core liefert die passende
Sprache, Währung und das Sortiment des Verkaufskanals. Der Checkout prüft
beim Kauf den aktuellen Preis und Bestand.
Das SDK Paket enthält ein Browserbeispiel, das sich lokal starten lässt
und direkt im öffentlichen Lumen Sortiment sucht.
[Browserbeispiel starten](one-shop-components.md#run-the-browser-example).
Bei Storyfront ist der Warenkorb Teil der Experience. Nach der Zahlung fragt
Storyfront den Stand der ursprünglichen Bestellung bei Core ab. Erst die
bestätigte Bestellung leert den Warenkorb. [Abnahme für den Betrieb](storyfront.md#accept-a-hosted-release).
Für Firmenkäufe prüft Commerce beim Bestellen die aktuelle Freigabe,
Mitgliedschaft und das Budget. Diese Regeln gelten auch für einen Checkout,
der in einem eigenen Prozess läuft. [Geprüfte Fälle](checkout-component.md#current-buyer-channel-and-company-authority).
Im lokalen Ausfalltest konnten der normale Shop und die Storyfront Übergabe
weiter Bestellungen anlegen. Core wickelte den bereits gestarteten
Zahlungsversuch ab. Nach dem Neustart war derselbe Beleg wieder abrufbar.
[Ablauf und Rückweg](checkout-component.md#pause-and-resume-checkout-confirmation).

Der Wissensdienst hat eine eigene Suche über Dokumente und Produkttexte. Im
Ausfalltest konnte der Shop weiter verkaufen. Die Produktänderung blieb in
der Warteschlange und war nach dem Neustart als aktuelle Quelle verfügbar.
[Wissensdienst und Schnittstellen](knowledge-component.md).

Ein Agent kann Regeln mit Beispieldaten im separaten Dienst ausprobieren.
Der Shop wertet dieselben Regeln mit seinem aktuellen Warenkorb aus. Im
Ausfalltest hat der Shop den Rabatt berechnet, die Bestellung angelegt und
die Rechnung über den Flow erstellt. [Regeln und Ausfalltest](automation-component.md).
Für externe Anwendungen kann der Vorschauprozess denselben Shopzugang prüfen.
Der Händler erstellt dafür einen eigenen Schlüssel mit Leserecht für Regeln.
Im lokalen Test wirkte der Widerruf bereits beim nächsten Aufruf.
[Einrichtung und Rechte](automation-component.md#connect-the-service-to-veyndo-core).
Beim Speichern und beim späteren Ausführen prüft dieselbe Rust Bibliothek,
ob alle Schritte im Flow erreichbar sind und ihre Verbindungen gültig sind.
Nach einer Wartezeit findet der Worker den nächsten Schritt direkt über
seine Kennung. [Flow Graph](automation-component.md#flow-graph-contract).
Entwickler finden die eingebauten Flow Ereignisse und Aktionen über HTTP,
MCP und dieselbe Rust Bibliothek. Core prüft pro Shop, welche Apps
installiert sind und welche Aktionen der aktuelle Nutzer ausführen darf.
[Flow Katalog](automation-component.md#built-in-flow-catalog).
Nach dem Kauf übernimmt ein Worker den Flow aus der Warteschlange.
Bei einer Wartezeit speichert er die Frist und gibt den Auftrag frei.
Beim Fortsetzen prüft er die aktuellen Rechte und speichert Fortschritt
nur für den Versuch, den er übernommen hat.
[Wie Flow Aufträge gespeichert werden](automation-component.md#durable-flow-job-storage).
Die Rust Bibliothek liefert dem Worker die nächste Anweisung aus der
gespeicherten Definition. So kann ein separat laufender Worker nach einem
Neustart beim richtigen Schritt weitermachen, während der Shop Bestellungen
weiter annimmt. Core kann die App Verarbeitung gezielt an einen eigenen
Prozess übergeben. Dazu zählen Flows, geplante App Aufgaben und
Zustellungen. Beide Prozesse greifen auf dieselben gespeicherten Aufträge
zu. So bleiben auch beim Wechsel und bei der Rückkehr zum gemeinsamen
Betrieb die Aufträge erhalten.
[Anweisungen und Prozessgrenzen](automation-component.md#portable-flow-directives) ·
[Worker einrichten](automation-component.md#move-the-app-worker-out-of-core).
Der App Prozess misst das Alter der ältesten fälligen Aufträge und
Zustellungen. So lässt sich beim Wechsel erkennen, ob Arbeit liegen
bleibt. Die Messung läuft im Hintergrund und enthält keine Auftragsdaten.
[Warteschlange prüfen](automation-component.md#read-the-worker-queue-logs).

## 1. Der Aufbau

```mermaid
flowchart TB
  Human[Menschen: Studio, Shop, POS und Storyfront] --> Entry[HTTP API und aktuelle Identität]
  Agent[Agenten und externe Clients] --> Protocol[MCP und unterstützte UCP Operationen]
  Protocol --> Entry
  Entry --> Admission[Shop, Kanal, Sprache, Rechte und Revision]
  Admission --> Core[Gemeinsamer Rust Commerce-Kern]
  Core --> DB[(PostgreSQL: Geschäftsdaten, Aufgaben und Outbox)]
  DB --> Workers[Getrennte Rust Worker]
  Workers --> Flows[Regeln, Flows und App Ereignisse]
  Workers --> Knowledge[Shopwissen und Retrieval]
  Knowledge --> Index[(Qdrant: erneuerbarer Suchindex)]
  Knowledge --> Models[Konfigurierte KI Anbieter]
  Models --> Proposal[Geprüfter Änderungsvorschlag]
  Proposal --> Admission
  Flows --> Gateway[App Gateway mit aktuellen Rechten]
  Gateway --> Services[Freigegebene App Dienste und Anbieter]
  Services --> Callbacks[Begrenzte native Rückrufe]
  Callbacks --> Core
```

Der Commerce-Prozess stellt die nativen Operationen bereit. Separate Rust-Prozesse
übernehmen unter anderem Konnektoren, Migration und Marktplätze. Die privaten
Storyfront- und Payments-Dienste haben eigene Implementierungen. Externe Apps
kommunizieren über die Erweiterungsverträge und können andere Sprachen verwenden.
Python dient im Hauptprojekt der Entwicklung und Prüfung.

Der Cargo-Workspace enthält die Bibliotheken `kernel`, `runtime`, `commerce`,
`apps` und `cognition`. Deren Abhängigkeiten werden geprüft. Die übrigen
Anwendungsabläufe sind weiterhin in Modulen des Hauptpakets organisiert; die
vollständige Extraktion aller Handler ist noch offen.

Quellen: [Produktionsarchitektur](production-architecture.md),
[Rust Dienste](rust-services.md), [Modulverantwortung](source-map.md).

## 2. Shop, Verkaufskanal und Sandbox

Ein unabhängiger Händler ist ein eigener Mandant. Ein Mandant kann mehrere
Verkaufskanäle mit eigenem Sortiment, Sprachen, Währungen und Konfigurationen
haben. Storefront, Headless API, POS und Marktplatz sind unterschiedliche
Verkaufskontexte desselben Händlers.

Ein privater Entwurf besitzt einen eigenen berechtigten Kontext. Ausgewählte
Konfigurationsänderungen lassen sich nach einer Prüfung veröffentlichen.
Bestellungen, Zahlungen, tatsächliche Bestände und andere Laufzeitdaten werden
dabei nicht als Konfiguration zurückgespult. Ein Versionskonflikt verlangt eine
neue Prüfung des aktuellen Stands.

Beim Kauf berechnet der Kern den aktuellen Warenkorb erneut und sperrt die
betroffenen Datensätze. Bestellung, Bestandszuordnung und Ereignis werden
gemeinsam gespeichert. Wiederholte Abschlussanfragen erzeugen über denselben
Kaufschlüssel keine zusätzliche Bestellung. Zahlungsanbieter werden außerhalb
dieser Datenbanksperren über dauerhafte Aufträge angesprochen.

Wenn Storyfront die Abschlussmeldung verpasst, kann es die ursprüngliche
Bestellung anhand des gespeicherten Vorgangs wiederfinden. Eine Statusabfrage
wartet dabei nicht auf die Warenkorbsperre. Erst das ausdrückliche Wiederöffnen
stimmt sich mit einem laufenden Kauf ab. Der lokale Test prüft beide Fälle.
Die [Storyfront-Dokumentation](storyfront.md#responsibilities-and-contracts)
beschreibt den Ablauf und die Reihenfolge der Auslieferung.

Ein lokaler Beispielshop zeigt, dass Checkout auch mit einem anderen
Commerce-Dienst arbeiten kann. Checkout speichert die Sitzung. Der Beispielshop
speichert Bestand, Bestellung und Ereignis gemeinsam. Beide greifen auf eigene
Datenbanken zu. Zwei gleichzeitige Käufe des letzten Artikels ergeben genau
eine Bestellung. [Ablauf und Schnittstellen](checkout-component.md#a-purchase-with-a-separate-commerce-host).

[Verkaufskanäle](channel-management.md), [Arbeitsbereich und Veröffentlichung](workbench.md),
[Checkout](checkout.md), [Währungen](currencies.md).

## 3. Was eine App umfassen kann

Eine App besitzt ein gemeinsames Manifest mit Version und Inhaltsdigest.
Visueller Editor, Coding-Agent, API und Installation arbeiten mit dieser Definition.

| Bestandteil | Möglichkeiten |
| --- | --- |
| Oberfläche | Native Texte, Tabellen, Karten, Formulare, Eingaben, Buttons, Bilder, Tabs, Kennzahlen und Diagramme; alternativ eine freigegebene eigene Oberfläche im isolierten iframe. |
| Einbauorte | Bereiche im Studio, Produkt-, Kunden- und Bestelldetails sowie Shopseiten, Produktdetail, Header, Warenkorb, Checkout und Kundenkonto. Jede Ansicht hat ihren eigenen Kontext und erlaubte Aktionen. |
| Eigene Daten | Typisierte Felder, mehrsprachige Inhalte, Geld mit expliziter Einheit, Medien, Beziehungen, eindeutige Werte und begrenzte indizierte Filter. |
| Erweiterte Kernobjekte | Versionierte Felder an Produkt, Kunde, Bestellung und Firma, mit Anbindung an native Details, Grids, exakte Filter und berechtigte Operationen. |
| Einstellungen | Deklarierte Texte, Zahlen, Schalter und Geheimnisse; installierte Konfiguration ist zentral erreichbar. Geheimnisse bleiben verschlüsselt und werden nur passenden privaten Dienstaktionen aufgelöst. |
| Aktionen | Deklarierte native oder externe Vorgänge über das App Gateway. MCP und Flow erhalten nur ausdrücklich freigegebene Aktionen. |
| Ereignisse | Abonnements und eigene Ereignisse mit stabiler Identität, gefilterten Nutzdaten und dauerhafter Zustellung. |
| Lange Arbeit | Jobs mit Fortschritt, Ergebnis, begrenzten Wiederholungen, Laufzeitgrenzen und privaten Artefakten. |
| Commerce Logik | Begrenzte Wasm-Komponenten für Preis-, Rabatt-, Versand- und Validierungsentscheidungen. Der Kern prüft die Ergebnisse. |
| Zustände | Deklarierte Abläufe für App-Datensätze und unterstützte Bestell- beziehungsweise Angebotszustände mit geprüften Übergängen. |
| Verteilung | Unveränderliche Pakete, Freigabe des genauen Inhalts, signierte Herausgeber, Abhängigkeiten und Versionsprüfung. |

Ein konkretes Beispiel ist der [Möbelkonfigurator](furniture-configurator.md):
Materialien und Maße erzeugen einen geprüften Zuschlag. Die Firma genehmigt den
konkreten Einkauf. Die Bestellung speichert die akzeptierte Auswahl. Eine spätere
Nachbestellung verwendet die aktuellen Regeln, während die alte Bestellung ihren
ursprünglichen Stand behält.

[App Plattform](app-platform.md), [App Studio](app-studio.md),
[Einbauorte und Einstellungen](app-studio-workspace.md),
[Kernobjekte](app-core-extensions.md), [Zustandsabläufe](app-native-lifecycles.md).

## 4. App Daten ohne Tabellenwachstum

Verwaltete Apps verwenden vier gemeinsame physische Tabellen für logische Modelle,
Datensätze, Suchwerte und Beziehungen. Mandant, App und Modell gehören immer zum
Schlüssel. App-Installation erzeugt keine eigenen SQL-Tabellen oder frei gewählten
Datenbankindizes. Die Projektionen werden vom Kern gepflegt.

Die derzeitigen Grenzen betragen unter anderem 12 Modelle je Paket, 16 Felder je
Modell sowie 100.000 gezählte Zeilen und 64 MiB logischen Speicher je Shop und App.
Diese Grenzen sind konfiguriertes Verhalten und keine zugesicherte Lastkapazität.

Schemaänderungen können Felder umbenennen, entfernen, konvertieren und ergänzen.
Der begrenzte Onlinepfad validiert die Daten und speichert einen Wiederherstellungsstand.
Größere Änderungen benötigen einen gesonderten Migrationsplan. Als
`operational: true` deklarierte Daten bleiben von Konfigurationskopien und
Veröffentlichung ausgeschlossen.

[Speichermodell und Grenzen](app-data-storage.md).

## 5. Wie Apps ausgeführt und freigegeben werden

```mermaid
flowchart LR
  Intent[Idee und App Definition] --> Build[Validieren und Version speichern]
  Build --> Review[Inhalt und Berechtigungen prüfen]
  Review --> Private[Privat installieren und testen]
  Private --> Compare[Änderungen und Konflikte prüfen]
  Compare --> Release[Ausgewählte Konfiguration veröffentlichen]
```

Eine gespeicherte App-Version enthält einen geprüften Inhalt. Installation und
Upgrade verlangen den genauen Digest und die erforderlichen Berechtigungen.
Alte Versionsnummern dürfen nicht mit anderem Inhalt überschrieben werden.
Pakete und einzelne Datensätze sind getrennte Veröffentlichungsentscheidungen.

Native Ansichten verwenden den gemeinsamen Renderer. Eigene HTML-Oberflächen
werden nur aus konfigurierten, mit Hash freigegebenen Quellen geladen. Ihre
Sandbox erhält keine Händleranmeldedaten. Daten und Aktionen laufen über zeitlich
begrenzte, an Akteur und Ansicht gebundene Freigaben.

Wasm-Komponenten erhalten begrenzte, lesbare Ausschnitte des Warenkorbs und
deklarierter Daten. Speicher, Rechenzeit und Zugriffe sind beschränkt. Sie besitzen
keinen allgemeinen SQL-, Netzwerk- oder Dateisystemzugriff. Ein unabhängiger
App-Dienst besitzt wiederum seinen eigenen Prozess und begrenzte Rückrufe in den
Kern. Das Manifest-Build kompiliert noch keinen beliebigen Rust- oder
TypeScript-Quellcode in einer vom Betreiber bereitgestellten isolierten Buildfarm.

[App Sicherheit](app-security.md), [Tatsächlicher Umsetzungsstand](app-system-status.md).

## 6. Wie die KI eingebunden ist

| Ebene | Aufgabe |
| --- | --- |
| Händler-Agent | Kennt den ausgewählten Arbeitskontext, recherchiert berechtigte Daten und bereitet prüfbare Änderungen vor. |
| Dauerhafte Aufgaben | Speichern Gespräch, Fortschritt und abgeschlossene Schritte. Worker können Arbeit fortsetzen, abbrechen und verspätete Ergebnisse verwerfen. |
| Shopwissen | Verknüpft Produkte, Dokumente, Quellen, Beziehungen und zulässige Beobachtungen mit ihrer Herkunft. |
| Retrieval | Kombiniert native Suche und optionale Vektorsuche. PostgreSQL bleibt maßgeblich; Qdrant ist ein erneuerbarer Index. |
| Modellanbindung | Zentrale Konfiguration und Werkzeugprotokolle für OpenAI, Anthropic und Ollama. Modellantworten werden validiert. |
| App Erstellung | Der Assistent bereitet Änderungen an derselben App-Definition vor, die auch der visuelle Editor verwendet. Externe Coding-Agenten verwenden Export und geprüften Import. |
| Shopgestaltung | Text, Referenz-URLs und Bilder können Vorschläge für den bestehenden Seiten- und Gestaltungsentwurf liefern. Manuelle und agentische Änderungen verwenden dasselbe Modell. |
| Einkaufsassistent | Verwendet echte Produkte und Varianten, zeigt eine bearbeitbare Auswahl und führt zum nativen Warenkorb. |
| Kundensimulator | Gespeicherte fiktive Kunden testen native Suche, Budgets, Warenkörbe und simulierte Käufe im privaten Shop. |

Beispiel: Der Händler nennt zwei Produkte und den französischen Kanal. Der Agent
bereitet Übersetzungen, Kategorie und Landingpage als zusammenhängende Aufgabe
vor. Die Vorschau zeigt den tatsächlichen Entwurf. Die Freigabe prüft erneut
Rechte, Ausgangsversion und gewählte Änderungen.

Gespeicherte Quellen und Beobachtungen verändern keine Modellgewichte. Ein
erfolgreicher Kundensimulator prüft seine nativen Kaufhandlungen; er bewertet
damit noch nicht automatisch die Verständlichkeit jeder Browseroberfläche.

[Agentischer Arbeitsbereich](agentic-workspace.md), [Kognition](cognitive-commerce.md),
[Shopwissen](knowledge-workspace.md), [Kundensimulator](customer-scenarios.md).

## 7. Agenten, Rechte und Automatisierung

Ein delegierter Planungsagent besitzt eine eigene widerrufbare Identität, explizite
Leserechte, ein bestimmtes Modell und begrenzte Modellkontingente. Aktuelle
Mitgliedschaft und Rechte werden erneut geprüft. Diese Identität kann keine
eigenen Rechte erhöhen oder Vorschläge selbst freigeben. Der Not-Aus stoppt
zugehörige Aufgaben im Live-Shop und seinen privaten Entwürfen.

Die Modellkontingente rechnen konservativ reservierte Aufrufe. Sie ersetzen keine
Abrechnung des tatsächlichen Anbieterverbrauchs. Persönliche Nutzung und externe
App-Dienste haben ihre eigenen Konfigurationen und Grenzen.

Für bestimmte Preisvorschläge kann der Händler ausdrücklich begrenzte Autonomie
erlauben. Gespeicherte Preisgrenzen, Tagesgrenzen und native Validierung bleiben
wirksam. Das Einschalten einer Grenze startet allein keinen wiederkehrenden Agenten.

Flows verbinden Ereignisse, Bedingungen und freigegebene Aktionen. Wiederverwendete
Agentenarbeit beginnt als inaktiver Flow-Entwurf. Die Outbox besitzt getrennte
Verarbeitungsstände für ihre Verbraucher. Worker beanspruchen Aufgaben über
dauerhafte Leases; unklare externe Wirkungen verlangen eine bewusste Klärung.

[Agentenrechte](agent-authority-controls.md), [dauerhafte Arbeit](durable-agent-runs.md),
[Flows und Regeln](automation.md), [Besucherverhalten](behavior-intelligence.md).

## 8. Was auf diesem Fundament aufsetzt

Standardshop und originale Storyfront-Experiences verwenden den gemeinsamen
Commerce-Vertrag. Der Standardshop wird über die Site-Builder-App gestaltet;
Storyfront behält seinen originalen Editor. Seiten, Formulare und deren private
Antworten behalten die jeweiligen App-Verantwortlichkeiten.

POS verwendet native Warenkörbe, Preise, Bestände, Bestellungen und Belege.
B2B ergänzt Firmen, Einkaufsbereiche, Budgets, Angebote, Freigaben und Listen.
EDI besitzt begrenzte EDIFACT-, UBL- und cXML-Profile in einer eigenen App.
Marktplätze verwenden ein separates Rust-Gateway für Angebote und Bestellübernahme.
Migration übernimmt unterstützte Daten aus bestehenden Shops nach Veyndo.

[POS](pos.md), [B2B](b2b-commerce.md), [EDI](edi.md),
[Marktplätze](marketplaces.md), [Migration](agentic-migration.md),
[Dienstanbindungen](service-integrations.md).

## 9. Betrieb, Schnittstellen und verbleibende Entwicklung

HTTP, MCP und unterstützte UCP-Verträge verwenden dieselben nativen Operationen.
Die Operation-Registry liefert Eingabeverträge; die vollständige Generierung aller
Antworttypen und Domänenmodelle ist noch offen. Exakte Geldprimitive und der
Vergleich mit dem ursprünglichen PHP-Verhalten existieren. Verbleibende
Kompatibilitätsberechnungen enthalten weiterhin `f64`.

Mandantenprüfungen, getrennte eingeschränkte Datenbankrollen, signierter
Datenbankkontext und erzwungene Zeilenregeln schützen den Zugriff. Worker und
Dienste lassen sich als getrennte Prozesse betreiben. Lokale Messungen mit einer
Million Produkten existieren; automatische Mandantenverteilung und Umzüge ohne
Unterbrechung sind noch keine abgenommenen Betriebsabläufe.

Offen sind außerdem vollständige historische Checkout-Neuberechnung, isolierte
Quellcode-Builds, umfassende Kompatibilitätsprüfungen über installierte Apps und
automatisch bereitgestellte Enterprise-Umgebungen. Echte Anbieterzahlungen,
Mailzustellung, Wiederherstellung und einzelne externe Integrationen benötigen
ihre eigenen Abnahmen. Öffentliche Kaufbelege verwenden simulierte Zahlungen.

Shopware-Laufzeitkompatibilität und der native Plugin-Übersetzer sind ausgelagert:
[`experiment/shopware-compatibility`](https://github.com/sthamann/veyndo/tree/experiment/shopware-compatibility).
Shopware als Datenquelle für eine Migration und die PHP-Vergleichstests bleiben
Teil des Hauptprojekts. OpenUI bleibt ein gesonderter lokaler Versuch für
agentisch zusammengestellte Arbeitsansichten.

[Status und Abnahmen](status.md), [Architekturentwicklung](platform-hardening.md),
[Lastmessungen](benchmarks.md), [Verifikation](formal-verification.md).
