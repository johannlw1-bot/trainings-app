# Trainings-App

Persönliche Trainings-App als PWA fürs Handy. Ein Nutzer, kein Login, kein Backend. Der vollständige Plan steht in `PLAN.md`.

## Grundregeln

- **Sprache der App: Deutsch.** Alle sichtbaren Texte, Fehlermeldungen und Beschriftungen auf Deutsch. Datum als `TT.MM.JJJJ`, Dezimalzahlen mit Komma anzeigen, Eingabe mit Komma und Punkt akzeptieren. Gewichte in kg.
- **Mobile-first.** Für eine Handbreite von etwa 360–430 px entwerfen, Desktop ist Nebensache. Tippflächen mindestens 44 px, Hauptaktionen im unteren Bildschirmbereich, Zahlenfelder mit `inputmode="decimal"` bzw. `"numeric"`. Safe-Area-Abstände (Notch, Home-Indikator) beachten.
- **Zielgerät: iPhone, Safari.** Die App wird über „Zum Home-Bildschirm“ installiert. Testziel ist Safari auf dem iPhone, ein Desktop-Browser allein reicht nicht als Nachweis. Eingabefelder (`input`, `select`, `textarea`) haben mindestens 16 px Schriftgröße, sonst zoomt Safari beim Antippen ins Feld.
- **Daten bleiben lokal.** Speicherung ausschließlich in IndexedDB (Dexie). Keine Netzwerkanfragen mit Nutzerdaten, kein Analytics, keine Schriften oder Skripte von fremden Servern, keine Cloud-Dienste.
- **Öffentliches Repository.** Der Code liegt öffentlich auf GitHub (GitHub Pages). Keine persönlichen Daten, Backups oder Export-Dateien einchecken.
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
