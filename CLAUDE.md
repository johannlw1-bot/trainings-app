# Trainings-App

Persönliche Trainings-App als PWA fürs Handy. Ein Nutzer, kein Login, kein Backend. Der vollständige Plan steht in `PLAN.md`, das Design in `DESIGN.md`.

## Grundregeln

- **Sprache der App: Deutsch.** Alle sichtbaren Texte, Fehlermeldungen und Beschriftungen auf Deutsch. Datum als `TT.MM.JJJJ`, Dezimalzahlen mit Komma anzeigen, Eingabe mit Komma und Punkt akzeptieren. Gewichte in kg.
- **Mobile-first.** Für eine Handbreite von etwa 360–430 px entwerfen, Desktop ist Nebensache. Tippflächen mindestens 44 px, Hauptaktionen im unteren Bildschirmbereich, Zahlenfelder mit `inputmode="decimal"` bzw. `"numeric"`. Safe-Area-Abstände (Notch, Home-Indikator) beachten.
- **Design: `DESIGN.md` ist verbindlich.** Vor jeder Arbeit an der Oberfläche lesen. Nur dunkel in Marineblau, eine Akzentfarbe (Neongelb) ausschließlich für Hauptbutton, aktiven Tab und hervorgehobene Werte, große fette Zahlen, pillenförmige Buttons, gedämpft blaue Diagramme. Die Titelschrift ist sehr breit: Zahlen und Buttonzeilen müssen mit den längsten Werten („142,5 kg“, „12 Wdh“) in 390 px und 320 px Breite passen. Farben, Abstände und Rundungen kommen aus den CSS-Variablen in `src/styles.css`, keine frei gewählten Werte. Neue Bausteine zuerst in `DESIGN.md` ergänzen. Jede geänderte Seite in 390 px Breite im Browser ansehen.
- **Minimalistisch, zwei Tabs.** Die Tab-Leiste hat nur Training und Gewicht, es kommen keine weiteren Tabs dazu. Plan, Übungsdetail und Einstellungen sind Unterseiten mit Zurück-Pfeil (`SubpageHeader`) und ohne Tab-Leiste. Die Einstellungen sind über das Zahnrad oben rechts auf beiden Tabs erreichbar (`PageHeader`). Neue Bereiche werden Unterseiten, keine Tabs.
- **Schriften lokal.** Unbounded (Titel, Zahlen, Buttons) und IBM Plex Sans (Fließtext) liegen in `src/fonts/`. Keine Schriften, Icons oder Stylesheets von Google Fonts oder anderen fremden Servern.
- **Zielgerät: iPhone, Safari.** Die App wird über „Zum Home-Bildschirm“ installiert. Testziel ist Safari auf dem iPhone, ein Desktop-Browser allein reicht nicht als Nachweis. Eingabefelder (`input`, `select`, `textarea`) haben mindestens 16 px Schriftgröße, sonst zoomt Safari beim Antippen ins Feld.
- **Daten bleiben lokal.** Speicherung ausschließlich in IndexedDB (Dexie). Keine Netzwerkanfragen mit Nutzerdaten, kein Analytics, keine Schriften oder Skripte von fremden Servern, keine Cloud-Dienste.
- **Öffentliches Repository.** Der Code liegt öffentlich auf GitHub (GitHub Pages). Keine persönlichen Daten, Backups oder Export-Dateien einchecken. Der Ordner `design-referenz/` enthält fremde Designs und bleibt in der `.gitignore`.
- **Offline-fähig.** Die App muss nach der Installation ohne Internet vollständig funktionieren.
- **Nichts geht verloren.** Eingaben sofort speichern, nicht erst beim Abschließen. Übungen archivieren statt löschen. Änderungen am Datenbank-Schema nur über eine Dexie-Versionsmigration, die bestehende Daten erhält. Export und Import müssen nach jeder Schemaänderung weiter funktionieren.

## Tech-Stack

Vite, React, TypeScript, Dexie, vite-plugin-pwa, eigenes CSS mit CSS-Variablen, Diagramm als eigenes SVG.

Neue Abhängigkeiten nur, wenn es ohne deutlich aufwendiger wäre, und vorher nachfragen. Kein UI-Kit, keine Chart-Bibliothek, kein Router-Paket, kein State-Management-Paket.

## Code

- Bezeichner im Code auf Englisch, Texte in der Oberfläche auf Deutsch.
- Rechenlogik (7-Tage-Durchschnitt, „letztes Mal“, Backup) liegt als reine Funktionen in `src/lib/` und hat Tests.
- Datum eines Trainings oder Gewichtseintrags als lokaler Kalendertag `YYYY-MM-DD` speichern, nicht als UTC-Zeitstempel. Sonst rutscht ein Eintrag am späten Abend auf den falschen Tag.

## Befehle

Gelten, sobald das Projekt aufgesetzt ist:

- `npm run dev` – Entwicklungsserver
- `npm run build` – Produktions-Build nach `dist/`
- `npm test` – Tests
