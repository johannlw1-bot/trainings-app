# Plan: Persönliche Trainings-App (PWA)

Stand: 16.11.2026 · Status: Planung abgeschlossen, noch kein Code

## Ziel

Eine Web-App fürs Handy, die auf dem Homescreen liegt und offline funktioniert. Nur für eine Person, ohne Login, ohne Backend. Alle Daten bleiben auf dem Gerät.

Zielgerät ist ein iPhone, installiert über Safari („Zum Home-Bildschirm“).

Vier Funktionen:

1. **Trainingsplan** – 4er-Split mit zwei Übungslisten: Oberkörper (Mo und Do) und Unterkörper (Di und Fr). Übungen selbst anlegen, bearbeiten, sortieren
2. **Training loggen** – pro Übung Sätze mit Gewicht und Wiederholungen, Werte vom letzten Mal sichtbar
3. **Körpergewicht** – Tageswert eintragen, Diagramm mit Verlauf und 7-Tage-Durchschnitt
4. **Fortschritt pro Übung** – Diagramm, wie sich eine Übung über die Zeit entwickelt

## Tech-Stack

| Baustein | Wahl | Warum |
|---|---|---|
| Build | **Vite** | Schnell, kaum Konfiguration, erzeugt reine statische Dateien |
| UI | **React + TypeScript** | Formulare, Listen und Zustände (laufendes Training) werden ohne Framework schnell unübersichtlich. TypeScript fängt Fehler im Datenmodell früh ab |
| Speicher | **IndexedDB über Dexie** | Lokale Datenbank im Browser, hält deutlich mehr aus als `localStorage` und erlaubt Abfragen wie „letztes Training mit dieser Übung“ |
| PWA | **vite-plugin-pwa** | Erzeugt Manifest und Service Worker, damit die App installierbar ist und offline läuft |
| Styling | **Eigenes CSS mit CSS-Variablen** | Vier Seiten brauchen kein UI-Framework. Das Design (fast schwarz, Anthrazit-Karten, Milchglas mit gelbem Leuchten für die wichtigsten Elemente, Neongelb als einzige Akzentfarbe, Schrift Outfit lokal) ist in `DESIGN.md` festgelegt |
| Diagramm | **Selbst gezeichnetes SVG** | Es gibt zwei einfache Liniendiagramme (Körpergewicht, Übungsfortschritt), die sich eine Komponente teilen. Eine Chart-Bibliothek wäre mehr Ballast als Nutzen |
| Navigation | **Übersicht als Startseite mit Hash-Routen** (`#/`, `#/gewicht` usw.), keine Tab-Leiste | Kein Router-Paket nötig, funktioniert auf jedem statischen Hoster |
| Sortieren | **Hoch/Runter-Buttons** | Auf dem Handy zuverlässiger als Drag-and-drop und ohne Zusatzbibliothek. Drag-and-drop kann später nachkommen |

Bewusst weggelassen: Backend, Login, State-Management-Bibliothek, UI-Kit, Chart-Bibliothek, Router-Bibliothek.

### Hosting

„Ohne Server“ heißt: kein Backend. Damit das iPhone die App installieren kann, müssen die statischen Dateien aber über **HTTPS** erreichbar sein. Das übernimmt **GitHub Pages**. Dort liegen nur die App-Dateien, keine Daten.

- Veröffentlichung automatisch über eine GitHub Action bei jedem Push auf `main`
- Die App läuft unter `https://<nutzername>.github.io/<repo-name>/`. Vite braucht dafür `base: '/<repo-name>/'`, und Manifest und Service Worker müssen denselben Pfad verwenden
- Das Repository ist **öffentlich** (im kostenlosen GitHub-Tarif Voraussetzung für Pages, so entschieden). Der Code ist für jeden einsehbar, die Trainingsdaten nicht, denn sie verlassen das iPhone nie. Deshalb dürfen keine persönlichen Daten, Backups oder Export-Dateien ins Repository
- Die Adresse sollte sich nach der Installation nicht mehr ändern. Der lokale Speicher hängt an der Adresse, ein umbenanntes Repository bedeutet eine leere App (dann hilft nur Export und Import)

### iPhone-Besonderheiten

- Installation: in Safari öffnen, Teilen, „Zum Home-Bildschirm“. Es gibt keinen Installationsdialog wie bei Android, deshalb zeigt die App beim ersten Aufruf im Browser einen kurzen Hinweis
- **Die Homescreen-App hat einen eigenen Speicher**, getrennt von Safari. Also zuerst installieren und dann Daten eintragen, sonst bleiben sie im Safari-Tab zurück
- Eigenes `apple-touch-icon` und Statusleisten-Einstellungen, weil iOS das Manifest dafür nur teilweise auswertet
- Eingabefelder mit mindestens 16 px Schriftgröße, sonst zoomt Safari beim Antippen ins Feld
- Abstände für Notch und Home-Indikator über `env(safe-area-inset-*)`
- Getestet wird in Safari auf dem iPhone, nicht nur im Desktop-Browser

### Datensicherheit

Lokale Daten sind weg, wenn der Browser-Speicher gelöscht wird oder das Handy verloren geht. Deshalb:

- **Export/Import als JSON-Datei** in den Einstellungen (Backup in Dateien/iCloud ablegen)
- Beim Start `navigator.storage.persist()` anfragen, damit der Browser die Daten nicht von sich aus aufräumt
- Hinweis in der App, wann das letzte Backup gemacht wurde

## Datenmodell

```
exercises      id, name, note?, archived
planEntries    id, split (upper|lower), exerciseId, order, warmupSets, targetSets, targetRepsMin, targetRepsMax
workouts       id, date (YYYY-MM-DD), split (upper|lower), startedAt, finishedAt?
sets           id, workoutId, exerciseId, warmup, setNumber, weightKg, reps
segments       id, workoutId, exerciseId, startedAt, endedAt?
bodyWeights    date (YYYY-MM-DD, eindeutig), weightKg
```

Die Zuordnung Wochentag zu Liste steht fest im Code, nicht in der Datenbank:

```
Mo, Do  →  upper (Oberkörper)
Di, Fr  →  lower (Unterkörper)
Mi, Sa, So  →  Ruhetag
```

Entscheidungen dahinter:

- **Zwei Listen statt vier.** Der Plan kennt nur Oberkörper und Unterkörper. Montag und Donnerstag greifen auf dieselbe Liste zu, Dienstag und Freitag ebenso. Eine Änderung an der Liste gilt sofort für beide Tage.
- **„Letztes Mal“ kommt vom vorigen Training derselben Liste.** Am Donnerstag stehen die Werte vom Montag da, am Montag die vom Donnerstag davor.
- **Ein Training speichert Datum und Liste, nicht den Wochentag.** Wird ein Training an einem anderen Tag nachgeholt, bleibt alles stimmig.
- **Übung und Plan sind getrennt.** Die Übung selbst (Name, Notiz) liegt in `exercises`, ihre Position in der Liste in `planEntries`. Wird sie aus dem Plan entfernt, bleiben ihre geloggten Sätze und ihr Fortschrittsdiagramm erhalten.
- **Löschen lässt den Verlauf stehen.** Eine nie trainierte Übung wird beim Löschen vollständig entfernt. Eine schon trainierte verschwindet aus dem Plan (`archived`), die Übung selbst und ihre Sätze bleiben für den Verlauf erhalten.
- **Wiederholungen als Bereich.** Jede Übung hat ein unteres und ein oberes Ziel (z. B. 8–12), Grundlage für die doppelte Progression.
- **Aufwärmsätze sind eigene Sätze** mit `warmup: true`, getrennt nummeriert. Sie zählen nicht für „Letztes Mal“, nicht für den Hinweis „Gewicht erhöhen“, nicht für die Satzanzahl im Verlauf und nicht für das Fortschrittsdiagramm.
- **Der feste Plan wird vorab eingetragen** (`src/lib/seed.ts`), aber nur, wenn es noch gar keine Übungen gibt. Spätere Änderungen werden so nie überschrieben.
- **Sollte später doch ein A/B-Split gewünscht sein**, reicht ein weiterer Wert für `split` und eine angepasste Wochentag-Zuordnung. Bestehende Daten bleiben gültig.
- **Zeit pro Übung als Abschnitte** (`segments`, seit Datenbank-Version 3). Jeder Aufenthalt bei einer Übung wird mit Start und Ende gespeichert, die Zeit ist die Summe. Version 3 fügt nur diese Tabelle hinzu, bestehende Daten bleiben unverändert. Alte Trainings haben keine Abschnitte.
- **Gewichte in kg**, Eingabe mit Komma oder Punkt.
- **Ein Körpergewicht pro Tag.** Ein zweiter Eintrag am selben Tag überschreibt den ersten.

## Seitenstruktur

So minimalistisch wie möglich: Die **Übersicht** ist die Startseite, es gibt **keine Tab-Leiste**. Alles andere sind Unterseiten.

| Seite | Adresse | Art | Erreichbar über |
|---|---|---|---|
| Übersicht | `#/` | Startseite | App-Start, Zurück-Pfeil, X der Trainingsansicht |
| Gewicht | `#/gewicht` | Unterseite | Gewicht-Karte der Übersicht |
| Plan | `#/plan` | Unterseite | Eintrag „Trainingsplan“ in den Einstellungen |
| Übungsdetail | `#/uebung/<id>` | Unterseite | Tippen auf den Übungsnamen in der Trainingsansicht oder in der Auswertung |
| Einstellungen | `#/einstellungen` | Unterseite | Zahnrad oben rechts auf der Übersicht |
| Verlauf | `#/verlauf` | Unterseite | Kalender- und Volumenkarte der Übersicht |
| Trainingsansicht | `#/einheit` | ganzer Bildschirm | Tipp auf die Training-Karte der Übersicht |
| Auswertung | `#/auswertung/<id>` | Unterseite | nach „Training beenden“, Tippen im Verlauf oder im Übungsdetail |
| Bewegtes Gewicht | `#/volumen` | Unterseite | Karte „Bewegtes Gewicht“ der Übersicht |

Regeln für die Navigation:

- **Die Übersicht** zeigt oben rechts das Zahnrad
- **Unterseiten** zeigen oben links einen Zurück-Pfeil. Der Pfeil führt dorthin zurück, von wo die Seite geöffnet wurde, von Training, Gewicht und Kalender also zur Übersicht. Wurde sie direkt aufgerufen, führt er zur Übersicht
- Das X der Trainingsansicht, „Verwerfen“ eines leeren Trainings und „Fertig“ in der Auswertung führen zur Übersicht
- Die Seiten „Mehr“ und „Design-Muster“ gibt es nicht mehr

### Übersicht (`#/`) – Startseite

Aufbau nach Referenz 6, Stil nach DESIGN.md.

- Oben eine Begrüßung nach Tageszeit („Guten Morgen, Johann“ 5–11 Uhr, „Hallo, Johann“ 11–18 Uhr, „Guten Abend, Johann“ 18–5 Uhr) mit Datum, rechts das Zahnrad
- Zwei quadratische Karten nebeneinander:
  - **Training** (Glas mit Leuchten): groß „Oberkörper“ / „Unterkörper“, an Ruhetagen „Ruhetag“ und der nächste Termin. Kleiner Ring mit den Trainingstagen dieser Woche (Mo bis So) von 4. Ein Tipp startet das heutige Training sofort und öffnet die Trainingsansicht. Läuft ein Training, zeigt sie die Gesamtzeit und ein Tipp führt zurück hinein. Wurde heute trainiert, zeigt sie „Erledigt“ mit Dauer und öffnet die Auswertung. An Ruhetagen ist sie nicht antippbar
  - **Gewicht** (anthrazit): groß der 7-Tage-Durchschnitt, darunter die Veränderung zur Vorwoche. Ohne Einträge „Gewicht eintragen“. Öffnet die Gewicht-Seite
- **Trainingskalender** (breite Anthrazit-Karte): Punkte-Raster der letzten drei Monate, ein Punkt pro Tag in Wochentagsspalten (Mo zuerst). Trainingstage gelb, heute umrandet. Öffnet den Verlauf
- **Bewegtes Gewicht** (breite Anthrazit-Karte, wie „Volume lifted“): Gewicht × Wiederholungen aller Arbeitssätze der letzten 7 Tage, darunter der Vergleich zu den 7 Tagen davor in kg, ohne Farbe. Öffnet die Seite „Bewegtes Gewicht“ (`#/volumen`): oben groß die letzten 7 Tage mit Vergleich, darunter Balken der letzten 8 Kalenderwochen (grau, aktuelle Woche gelb, Wert darüber) und die Übungen dieser Kalenderwoche mit ihrem Volumen, absteigend. Rechenlogik in `lib/volume.ts` mit Tests
- Kein Startbutton und keine eigene Training-Seite mehr (entfernt am 19.11.2026). Nachholen an Ruhetagen und „Wieder öffnen“ gibt es damit vorerst nicht
- Rechenlogik in `lib/overview.ts` mit Tests. Gezählt werden Tage mit Training (auch das laufende), nicht einzelne Trainings

### Trainingsansicht (`#/einheit`) – ganzer Bildschirm

Eine Übung nach der anderen statt einer langen Liste. Keine Tab-Leiste. Muss auf einem iPhone mit 390 × 844 px ohne Scrollen passen.

- **Oben:** „Übung 3 von 9“ und rechts ein X. Das X verlässt die Ansicht, das Training läuft im Hintergrund weiter (die Training-Karte der Übersicht zeigt „Läuft“)
- **Übung:** Name, Zeile mit Ziel („Ziel 3 × 8–12“) und den kleinen Knöpfen „− Satz“ und „+ Satz“, darunter „Letztes Mal: …“ mit Datum und ggf. der Hinweis „Gewicht erhöhen“
- **Sätze:** Aufwärmsätze (mit „A“, umrandete Felder) vor den Arbeitssätzen. „kg“ und „Wdh“ stehen klein in den Feldern. Eingabelogik:
  - Die Werte vom letzten Mal stehen als grauer Vorschlag in den Feldern
  - Ein Tipp auf den Haken trägt den Vorschlag ein, Tippen in ein Feld überschreibt ihn. Nur eingetragene Sätze werden gespeichert
  - Wird heute ein anderes Gewicht eingetragen als letztes Mal, gilt es als Vorschlag für die folgenden Sätze
  - So viele Zeilen wie Arbeitssätze im Plan, oder mehr, wenn es letztes Mal mehr waren. „+ Satz“ fügt eine Zeile an, „− Satz“ entfernt die letzte
  - **Hinweis „Gewicht erhöhen“** (doppelte Progression): erscheint, wenn letztes Mal alle geplanten Arbeitssätze das obere Ende des Bereichs erreicht haben, und verschwindet, sobald heute ein schwererer Satz eingetragen ist. Erreichen die heutigen Arbeitssätze alle das obere Ende, steht dort „Nächstes Mal Gewicht erhöhen“
- **Ring-Uhr:** groß die Zeit der aktuellen Übung, klein die Gesamtzeit. Rund um den Ring ein Punkt pro Übung (erledigt gelb gefüllt, aktuell gelb umrandet, offen gedämpft). Der gelbe Bogen zeigt den Anteil der eingetragenen an den geplanten Arbeitssätzen
- **Steuerleiste:** links „Vorige Übung“ (in Planreihenfolge, kein Umlauf), Mitte gelb „Nächste Übung“, rechts „Übersicht“
  - „Nächste Übung“ geht nur vorwärts zur nächsten noch nicht erledigten Übung in Planreihenfolge, kein Rücksprung an den Anfang
  - Ist nach der aktuellen keine Übung mehr offen, heißt der Button „Training beenden“, auch wenn weiter vorne noch Übungen offen sind. Diese bleiben über die Übersicht erreichbar
- **Übersicht:** Blatt über der Ansicht mit allen Übungen, Status (offen, aktuell, erledigt), Arbeitssätzen und bisher gebrauchter Zeit. Ein Tipp springt zur Übung. Unten „Training beenden“, um vorzeitig zu beenden
- **Tastatur:** Solange ein Eingabefeld aktiv ist, verschwindet die Ring-Uhr. Die Übungszeit steht dann klein neben „Übung 3 von 9“
- **Platz auf kleinen iPhones:** Die Uhr nimmt den freien Platz zwischen Sätzen und Steuerleiste ein (Ring höchstens 260 px). Unter 150 px wird sie zur schmalen Zeile mit beiden Zeiten und kleinen Punkten. Reicht auch das nicht, scrollt nur der Bereich mit den Sätzen. Gemessen: 390 × 844 passt auch mit Aufwärmsatz, Hinweis und fünf Arbeitssätzen; 375 × 667 zeigt dann die schmale Zeile und scrollt die Sätze
- **Display:** Solange die Ansicht offen ist, hält die Screen Wake Lock API das Display wach. Nach der Rückkehr in die App wird die Sperre neu angefordert. Fehlt die Funktion oder wird sie abgelehnt, läuft die App normal weiter
- Tippen auf den Namen einer Übung öffnet ihre Detailseite
- „Letztes Mal“ ist das jüngste beendete Training, in dem die Übung vorkam, egal in welcher Liste
- Jede Eingabe wird sofort gespeichert. Ein geschlossener Browser kostet kein Training: Das laufende Training ist beim nächsten Öffnen wieder da, mit der zuletzt aktiven Übung
- **Nachfrage beim Beenden** (an Stelle der Steuerleiste, auch beim Beenden über die Übersicht):
  - Übungen ohne Arbeitssätze: „2 Übungen ohne Einträge. Trotzdem beenden?“ mit „Weiter trainieren“ und „Beenden“
  - Gar kein Satz gespeichert: „Es wurde nichts eingetragen. Training verwerfen?“ mit „Weiter trainieren“ und „Verwerfen“. Ein Training wird nie kommentarlos verworfen
- Hintergrund (19.11.2026): Graue Vorschläge sahen wie Einträge aus, „Nächste Übung“ sprang nach der letzten Übung an den Anfang, und ein Training ohne gespeicherte Sätze wurde beim Beenden still gelöscht
- Nach dem Beenden öffnet sich die Auswertung. Ein heute beendetes Training zeigt die Training-Karte als „Erledigt“

### Zeit pro Übung

- Jeder Aufenthalt bei einer Übung ist ein **Abschnitt** in `segments` mit Start und Ende. Offen ist immer nur der Abschnitt der gerade angezeigten Übung
- Die Zeit pro Übung ist die Summe ihrer Abschnitte. Hin- und Herspringen zählt zusammen, nichts wird überschrieben
- Alle Zeiten werden aus Zeitstempeln berechnet, nicht hochgezählt. Sie stimmen deshalb auch nach dem Schließen von Safari oder dem Sperren des iPhones
- Eine Übung gilt als **erledigt**, wenn mindestens ein Arbeitssatz eingetragen ist und sie verlassen wurde (abgeschlossener Abschnitt). „Training beenden“ zählt als Verlassen
- Die Gesamtzeit ergibt sich aus `startedAt` und `finishedAt` des Trainings. Beim Wiederöffnen wird `startedAt` um die Pause nach vorn verschoben
- Rechenlogik in `src/lib/exerciseTiming.ts` und `src/lib/duration.ts`, mit Tests

### Auswertung (`#/auswertung/<id>`) – Unterseite

- Gesamtzeit (groß, gelb), Anzahl der Arbeitssätze und Übungen, darunter die Zeit pro Übung mit den Arbeitssätzen
- Öffnet sich nach „Training beenden“ (Titel „Geschafft“ und Button „Fertig“) und beim Antippen eines Trainings im Verlauf
- Alte Trainings von vor der Zeitmessung zeigen bei den Übungen „–“ statt einer Zeit

### Verlauf (`#/verlauf`) – Unterseite

- Vergangene Trainings, neueste zuerst: Datum, Liste, Dauer und Anzahl der Arbeitssätze
- Ein Tipp öffnet die Auswertung. Korrigieren alter Trainings folgt in Schritt 6

### Plan (`#/plan`) – Unterseite

- Umschalter mit zwei Listen: **Oberkörper** (Mo · Do) und **Unterkörper** (Di · Fr). Die Wochentage stehen als Untertitel dabei
- Übung hinzufügen: Name, Aufwärmsätze (0 bis 3), Arbeitssätze und Wiederholungen von/bis. Eine Übung der anderen Liste lässt sich per Antippen übernehmen. Gleiche Namen werden nicht doppelt angelegt
- Tippen auf eine Zeile klappt die Bearbeitung auf: umbenennen, Aufwärmsätze, Arbeitssätze und Wiederholungsbereich ändern
- Sortieren mit Hoch- und Runter-Pfeil pro Zeile
- Umbenennen gilt für die Übung überall, also in beiden Listen. Ziele und Reihenfolge gelten je Liste
- „Löschen“ fragt immer nach. Was dann passiert, sagt die Nachfrage:
  - Nie trainiert: Die Übung wird vollständig gelöscht
  - Schon trainiert: Sie verschwindet aus dem Plan, die eingetragenen Sätze bleiben im Verlauf
  - Steht sie auch in der anderen Liste: Sie wird nur aus dieser Liste gelöscht und bleibt in der anderen
- Wird eine gelöschte, schon trainierte Übung später unter demselben Namen neu angelegt, bekommt sie ihren alten Verlauf zurück
- Jede Änderung wird sofort gespeichert, es gibt keinen Speichern-Button

### Übungsdetail (`#/uebung/<id>`) – Unterseite

Öffnet sich beim Tippen auf den Übungsnamen in der Trainingsansicht oder in der Auswertung.

- Schon gebaut: Liste „Zeit bei den letzten Trainings“ (die letzten 10) mit Datum, Arbeitssätzen und Zeit für diese Übung. Ein Tipp öffnet die Auswertung des Trainings

Geplant (Schritt 5):

- Diagramm: ein Punkt pro Training, verbunden als Linie
- Umschalter für den angezeigten Wert:
  - **Höchstes Gewicht** – der schwerste Satz des Trainings
  - **Geschätztes 1RM** – nach der Epley-Formel `Gewicht × (1 + Wdh / 30)`, bester Satz des Trainings. Zeigt Fortschritt auch dann, wenn bei gleichem Gewicht mehr Wiederholungen gelingen
- Zeitraum umschaltbar (3 Monate, 1 Jahr, alles)
- Darunter die letzten Trainings dieser Übung mit allen Sätzen

### Gewicht (`#/gewicht`) – Unterseite

- Glas-Karte oben: Feld für heute, vorbefüllt mit dem letzten Wert, Knöpfe − 0,1 und + 0,1, „Speichern“. Über das Datum lässt sich ein früherer Tag nachtragen. Ein Eintrag pro Tag, ein zweiter überschreibt den ersten
- Groß der aktuelle 7-Tage-Durchschnitt (zum neuesten Eintrag), daneben die Veränderung zur Vorwoche („+0,3 kg“), ohne Farbe oder Bewertung
- Diagramm: 7-Tage-Durchschnitt als geschwungene Linie, Tageswerte als Punkte, aktueller Wert hervorgehoben
- Zeitraum umschaltbar (4 Wochen, 3 Monate, alles)
- Liste der Einträge, neueste zuerst: antippen zum Korrigieren, Löschen mit Nachfrage
- Rechenlogik in `lib/bodyWeight.ts`, Diagramm-Geometrie in `lib/chart.ts`, beide mit Tests. Die Komponente `LineChart` wird in Schritt 5 wiederverwendet

**7-Tage-Durchschnitt:** Mittelwert aller Einträge der letzten 7 Kalendertage einschließlich des jeweiligen Tages. Fehlende Tage werden ausgelassen, nicht mit 0 oder Schätzwerten gefüllt.

### Einstellungen (`#/einstellungen`) – Unterseite

Erreichbar über das Zahnrad oben rechts auf der Übersicht.

- Backup: Export und Import als JSON-Datei, mit Datum des letzten Backups. Der Export muss alle Tabellen enthalten, auch `segments`

## Ordnerstruktur (geplant)

```
src/
  main.tsx
  App.tsx              Routen
  db.ts                Dexie-Schema und Typen
  pages/
    Training.tsx
    Plan.tsx
    Gewicht.tsx
    ExerciseDetail.tsx Fortschrittsdiagramm einer Übung
    Einstellungen.tsx  Backup
    Verlauf.tsx        Vergangene Trainings
  nav.ts               Zurück-Navigation der Unterseiten
  components/          Seitenkopf, Satzzeile, Übungskarte, Liniendiagramm
  lib/
    schedule.ts        Wochentag → Oberkörper/Unterkörper/Ruhetag
    average.ts         7-Tage-Durchschnitt
    lastTime.ts        Werte vom letzten Mal
    duration.ts        Trainingstimer und Dauer
    progress.ts        Höchstes Gewicht und geschätztes 1RM pro Training
    backup.ts          Export/Import
    dates.ts           Wochentag, Datumsformat
  styles.css
public/
  icons/               App-Icons für den Homescreen
```

## Reihenfolge beim Bauen

1. **Grundgerüst** – Vite-Projekt, Tab-Leiste, leere Seiten, Datenbank-Schema (erledigt)
2. **Plan** – zwei Listen, Übungen anlegen, bearbeiten, sortieren, löschen. Wiederholungen als Bereich, Aufwärmsätze, fester Plan vorab eingetragen. Der Training-Tab zeigt die Liste des heutigen Tages oder den Ruhetag (erledigt)
3. **Training loggen** – Einheit starten, Sätze eintragen, „letztes Mal“, beenden, Liste der vergangenen Trainings (erledigt, Ansehen und Korrigieren alter Trainings folgt in Schritt 6)
4. **Körpergewicht** – Eingabe, Liste, Diagramm mit Durchschnitt (erledigt)
5. **Fortschritt pro Übung** – Detailseite, nutzt die Diagramm-Komponente aus Schritt 4
6. **Verlauf und Backup** – vergangene Trainings antippen, ansehen und korrigieren, Export und Import in den Einstellungen
7. **PWA und Hosting** – Manifest, Icons, Service Worker, GitHub Action, Test in Safari auf dem iPhone

Jeder Schritt ergibt eine benutzbare App. Tests gibt es für die Rechenlogik in `lib/` (Wochentag-Zuordnung, Durchschnitt, letztes Mal, Fortschritt, Backup), nicht für die Oberfläche.

Schritt 7 kann auch früher kommen: Wer die App schon während des Baus auf dem iPhone ausprobieren will, zieht das Hosting direkt nach Schritt 1 vor.

## Getroffene Entscheidungen

Beantwortet am 16.11.2026:

| Frage | Antwort | Folge im Plan |
|---|---|---|
| Mo/Do und Di/Fr gleich oder A/B? | Gleich. Mo und Do teilen sich die Oberkörper-Liste, Di und Fr die Unterkörper-Liste | Datenmodell mit `split` statt Wochentag, Plan-Seite mit zwei Listen |
| iPhone oder Android? | iPhone, Safari, „Zum Home-Bildschirm“ | Abschnitt „iPhone-Besonderheiten“, Tests in Safari |
| Hosting | GitHub Pages, Konto vorhanden | Abschnitt „Hosting“, GitHub Action in Schritt 7 |
| Spätere Wünsche | Fortschrittsdiagramm pro Übung ist wichtig, der Rest kann warten | Als Funktion 4 und Bauschritt 5 aufgenommen |
| Öffentliches Repository in Ordnung? | Ja | GitHub Pages im kostenlosen Tarif, Code öffentlich sichtbar, Daten nicht |
| Wert im Fortschrittsdiagramm | Umschalter zwischen höchstem Gewicht und geschätztem 1RM | Übungsdetail-Seite bleibt wie beschrieben |
| Wie viele Tabs? | Nur zwei: Training und Gewicht. Plan, Übungsdetail und Einstellungen sind Unterseiten mit Zurück-Pfeil | Abschnitt „Seitenstruktur“ neu gefasst, „Mehr“ und „Design-Muster“ entfernt |
| Startseite (19.11.2026) | Die Übersicht nach Referenz 6 ersetzt die Tab-Leiste. Training und Gewicht werden Unterseiten | Abschnitte „Seitenstruktur“ und „Übersicht“ neu, Tab-Leiste entfernt |
| Ablauf im Training (19.11.2026) | „Nächste Übung“ nur vorwärts, Nachfrage bei offenen Übungen und leerem Training, gespeicherte Sätze mit gelbem Haken, Vorschläge sehr blass. Neue Seite „Bewegtes Gewicht“ | Abschnitte „Trainingsansicht“ und „Übersicht“ angepasst |
| Startseite, zweite Fassung (19.11.2026) | Begrüßung, Training-Karte startet direkt, Training-Seite und Startbutton entfallen, Plan in den Einstellungen, neue Karte „Bewegtes Gewicht“ | Abschnitte „Seitenstruktur“ und „Übersicht“ angepasst |

## Fester Trainingsplan

Wird beim ersten Start eingetragen. Alle Übungen mit 3 Arbeitssätzen.

| Oberkörper (Mo · Do) | Aufwärmen | Wdh | | Unterkörper (Di · Fr) | Aufwärmen | Wdh |
|---|---|---|---|---|---|---|
| Brustpresse | 1 | 8–12 | | Beinpresse | 1 | 8–12 |
| Rudern (Maschine) | 1 | 8–12 | | Beinbeuger | 1 | 10–12 |
| Schulterpresse | – | 8–12 | | Beinstrecker | – | 10–15 |
| Latzug | – | 8–12 | | Abduktoren | – | 12–15 |
| Butterfly | – | 10–15 | | Adduktoren | – | 12–15 |
| Seitheben (Maschine/Kabel) | – | 12–15 | | Waden an der Beinpresse | – | 12–15 |
| Reverse Butterfly | – | 12–15 | | Bauch (Crunch-Maschine) | – | 12–15 |
| Trizeps am Kabelturm | – | 10–15 | | | | |
| Bizeps am Kabelturm | – | 10–15 | | | | |

Mit dem Update auf Datenbank-Version 2 wurden die Test-Übungen und Test-Trainings aus der Entwicklung einmalig gelöscht (mit Zustimmung), damit der feste Plan eingetragen werden kann. Das Körpergewicht blieb unberührt.

## Zurückgestellt

Nicht im ersten Wurf, das Datenmodell lässt beides später zu:

- Pausentimer
- Notizen pro Training

## Noch offen

Nichts. Alle Fragen sind beantwortet, der Bau kann mit Schritt 1 beginnen.
