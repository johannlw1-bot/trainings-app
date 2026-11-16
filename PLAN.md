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
| Styling | **Eigenes CSS mit CSS-Variablen** | Vier Seiten brauchen kein UI-Framework. Das Design (Marineblau, Neongelb als Akzent, Schriften Unbounded und IBM Plex Sans lokal) ist in `DESIGN.md` festgelegt |
| Diagramm | **Selbst gezeichnetes SVG** | Es gibt zwei einfache Liniendiagramme (Körpergewicht, Übungsfortschritt), die sich eine Komponente teilen. Eine Chart-Bibliothek wäre mehr Ballast als Nutzen |
| Navigation | **Tab-Leiste mit Hash-Routen** (`#/training` usw.) | Kein Router-Paket nötig, funktioniert auf jedem statischen Hoster |
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
planEntries    id, split (upper|lower), exerciseId, order, targetSets
workouts       id, date (YYYY-MM-DD), split (upper|lower), startedAt, finishedAt?
sets           id, workoutId, exerciseId, setNumber, weightKg, reps
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
- **Übungen werden archiviert statt gelöscht**, damit alte Trainings lesbar bleiben.
- **Sollte später doch ein A/B-Split gewünscht sein**, reicht ein weiterer Wert für `split` und eine angepasste Wochentag-Zuordnung. Bestehende Daten bleiben gültig.
- **Gewichte in kg**, Eingabe mit Komma oder Punkt.
- **Ein Körpergewicht pro Tag.** Ein zweiter Eintrag am selben Tag überschreibt den ersten.

## Seitenstruktur

So minimalistisch wie möglich: Die Tab-Leiste unten hat nur **zwei Tabs**, Training und Gewicht. Alles andere sind Unterseiten.

| Seite | Adresse | Art | Erreichbar über |
|---|---|---|---|
| Training | `#/training` | Tab, Startseite | Tab-Leiste |
| Gewicht | `#/gewicht` | Tab | Tab-Leiste |
| Plan | `#/plan` | Unterseite | Button „Plan bearbeiten“ im Training-Tab |
| Übungsdetail | `#/uebung/<id>` | Unterseite | Tippen auf eine Übung im Training-Tab |
| Einstellungen | `#/einstellungen` | Unterseite | Zahnrad oben rechts auf beiden Tabs |

Regeln für die Navigation:

- **Tab-Seiten** zeigen die Tab-Leiste und oben rechts das Zahnrad
- **Unterseiten** zeigen oben links einen Zurück-Pfeil und keine Tab-Leiste. Der Pfeil führt dorthin zurück, von wo die Seite geöffnet wurde. Wurde sie direkt aufgerufen, führt er zum Training-Tab
- Die Seiten „Mehr“ und „Design-Muster“ gibt es nicht mehr

### 1. Training (`#/training`) – Tab, Startseite

- Oben ein kleiner Button „Plan bearbeiten“, der die Plan-Seite öffnet
- Zeigt das Training des heutigen Wochentags (Oberkörper oder Unterkörper) mit Button „Training starten“
- An Ruhetagen (Mi, Sa, So): Hinweis plus Auswahl Oberkörper/Unterkörper, falls ein Training nachgeholt wird
- Im laufenden Training: Übungen in Planreihenfolge, pro Übung
  - Zeile „Letztes Mal: 80 kg × 8, 8, 7“ mit Datum
  - Satzzeilen mit Gewicht und Wiederholungen, vorbefüllt mit den Werten vom letzten Mal
  - „Satz hinzufügen“ und Satz löschen
- Jede Eingabe wird sofort gespeichert. Ein geschlossener Browser kostet kein Training
- „Training beenden“ schließt die Einheit ab
- Tippen auf den Namen einer Übung öffnet ihre Detailseite mit dem Fortschrittsdiagramm
- Ganz unten: Liste der vergangenen Trainings nach Datum, neueste zuerst, antippbar zum Ansehen und Korrigieren

### Plan (`#/plan`) – Unterseite

- Umschalter mit zwei Listen: **Oberkörper** (Mo · Do) und **Unterkörper** (Di · Fr). Die Wochentage stehen als Untertitel dabei
- Übungsliste: hinzufügen, umbenennen, Zielsätze festlegen, mit Hoch/Runter sortieren, entfernen
- Entfernen nimmt die Übung aus der Liste und archiviert sie. Die geloggten Sätze bleiben

### Übungsdetail (`#/uebung/<id>`) – Unterseite

Öffnet sich beim Tippen auf eine Übung im Training-Tab.

- Diagramm: ein Punkt pro Training, verbunden als Linie
- Umschalter für den angezeigten Wert:
  - **Höchstes Gewicht** – der schwerste Satz des Trainings
  - **Geschätztes 1RM** – nach der Epley-Formel `Gewicht × (1 + Wdh / 30)`, bester Satz des Trainings. Zeigt Fortschritt auch dann, wenn bei gleichem Gewicht mehr Wiederholungen gelingen
- Zeitraum umschaltbar (3 Monate, 1 Jahr, alles)
- Darunter die letzten Trainings dieser Übung mit allen Sätzen

### 2. Gewicht (`#/gewicht`) – Tab

- Eingabefeld für heute, ein Tipp zum Speichern
- Diagramm: Tageswerte als Punkte, 7-Tage-Durchschnitt als Linie
- Zeitraum umschaltbar (4 Wochen, 3 Monate, alles)
- Liste der Einträge zum Korrigieren und Löschen

**7-Tage-Durchschnitt:** Mittelwert aller Einträge der letzten 7 Kalendertage einschließlich des jeweiligen Tages. Fehlende Tage werden ausgelassen, nicht mit 0 oder Schätzwerten gefüllt.

### Einstellungen (`#/einstellungen`) – Unterseite

Erreichbar über das Zahnrad oben rechts auf beiden Tabs.

- Backup: Export und Import als JSON-Datei, mit Datum des letzten Backups
- Archivierte Übungen ansehen und wiederherstellen

## Ordnerstruktur (geplant)

```
src/
  main.tsx
  App.tsx              Tab-Leiste und Routen
  db.ts                Dexie-Schema und Typen
  pages/
    Training.tsx
    Plan.tsx
    Gewicht.tsx
    ExerciseDetail.tsx Fortschrittsdiagramm einer Übung
    Einstellungen.tsx  Backup, archivierte Übungen
  nav.ts               Zurück-Navigation der Unterseiten
  components/          Seitenkopf, Satzzeile, Übungskarte, Liniendiagramm, Tab-Leiste
  lib/
    schedule.ts        Wochentag → Oberkörper/Unterkörper/Ruhetag
    average.ts         7-Tage-Durchschnitt
    lastTime.ts        Werte vom letzten Mal
    progress.ts        Höchstes Gewicht und geschätztes 1RM pro Training
    backup.ts          Export/Import
    dates.ts           Wochentag, Datumsformat
  styles.css
public/
  icons/               App-Icons für den Homescreen
```

## Reihenfolge beim Bauen

1. **Grundgerüst** – Vite-Projekt, Tab-Leiste, leere Seiten, Datenbank-Schema
2. **Plan** – zwei Listen, Übungen anlegen, bearbeiten, sortieren
3. **Training loggen** – Einheit starten, Sätze eintragen, „letztes Mal“
4. **Körpergewicht** – Eingabe, Liste, Diagramm mit Durchschnitt
5. **Fortschritt pro Übung** – Detailseite, nutzt die Diagramm-Komponente aus Schritt 4
6. **Verlauf und Backup** – Liste der vergangenen Trainings im Training-Tab, Export und Import in den Einstellungen
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

## Zurückgestellt

Nicht im ersten Wurf, das Datenmodell lässt beides später zu:

- Pausentimer
- Notizen pro Training

## Noch offen

Nichts. Alle Fragen sind beantwortet, der Bau kann mit Schritt 1 beginnen.
