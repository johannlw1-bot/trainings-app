# Trainings-App

Persönliche Trainings-App als PWA fürs Handy. Ein Nutzer, kein eigenes Backend. Abgleich zwischen iPhone und Mac über Dexie Cloud, Anmeldung freiwillig per E-Mail-Code. Der vollständige Plan steht in `PLAN.md`, das Design in `DESIGN.md`.

## Grundregeln

- **Sprache der App: Deutsch.** Alle sichtbaren Texte, Fehlermeldungen und Beschriftungen auf Deutsch. Datum als `TT.MM.JJJJ`, Dezimalzahlen mit Komma anzeigen, Eingabe mit Komma und Punkt akzeptieren. Gewichte in kg.
- **Mobile-first.** Für eine Handbreite von etwa 360–430 px entwerfen, Desktop ist Nebensache. Tippflächen mindestens 44 px, Hauptaktionen im unteren Bildschirmbereich, Zahlenfelder mit `inputmode="decimal"` bzw. `"numeric"`. Safe-Area-Abstände (Notch, Home-Indikator) beachten.
- **Design: `DESIGN.md` ist verbindlich.** Vor jeder Arbeit an der Oberfläche lesen. Fast schwarzer Grund, Anthrazit-Karten, Outfit als einzige Schrift, Neongelb als einzige Akzentfarbe. Milchglas mit gelbem Leuchten nur für die Training-Karte der Startseite, die Ring-Uhr, die Eingabekarte der Gewicht-Seite, die aktuelle Übung in der Übersicht des Trainings und die Zusammenfassung der Auswertung, alles andere schlicht anthrazit. Titel und große Zahlen weiß und fett, Beschriftungen gedämpft grau, aber lesbar. Zahlen und Timer immer mit Tabellenziffern. Farben, Abstände und Rundungen kommen aus den CSS-Variablen in `src/styles.css`, keine frei gewählten Werte. Neue Bausteine zuerst in `DESIGN.md` ergänzen. Jede geänderte Seite in 390 px Breite im Browser ansehen.
- **Minimalistisch, Übersicht als Startseite.** Es gibt keine Tab-Leiste. Startseite ist die Übersicht (`#/`) mit Begrüßung, Training-Karte (startet das heutige Training direkt), Gewicht-Karte, Trainingskalender und Wochenvolumen. Eine eigene Training-Seite gibt es nicht. Gewicht, Plan, Übungsdetail, Einstellungen, Verlauf und Auswertung sind Unterseiten mit Zurück-Pfeil (`SubpageHeader`), der Pfeil führt zurück zur Übersicht bzw. zur Seite, von der man kam. Die Trainingsansicht (`#/einheit`) belegt den ganzen Bildschirm, ihr X führt zur Übersicht. Die Einstellungen sind über das Zahnrad oben rechts auf der Übersicht erreichbar (`PageHeader`), der Trainingsplan über einen Eintrag in den Einstellungen. Neue Bereiche werden Unterseiten oder Karten der Übersicht, keine Tab-Leiste.
- **Schriften lokal.** Outfit (für alles) liegt mit Lizenz in `src/fonts/`. Keine Schriften, Icons oder Stylesheets von Google Fonts oder anderen fremden Servern.
- **Zielgerät: iPhone, Safari.** Die App wird über „Zum Home-Bildschirm“ installiert. Testziel ist Safari auf dem iPhone, ein Desktop-Browser allein reicht nicht als Nachweis. Eingabefelder (`input`, `select`, `textarea`) haben mindestens 16 px Schriftgröße, sonst zoomt Safari beim Antippen ins Feld.
- **Sync nur über Dexie Cloud.** Gespeichert wird in IndexedDB (Dexie). Nach der Anmeldung gleicht `dexie-cloud-addon` mit der eigenen Dexie-Cloud-Datenbank ab (Adresse in `src/cloudConfig.ts`). Das ist der einzige Server, der Nutzerdaten bekommt: keine anderen Server oder Cloud-Dienste, kein Analytics, keine Schriften oder Skripte von fremden Servern. Ohne Anmeldung bleibt alles auf dem Gerät und die App läuft normal. `dexie-cloud.key` (Zugangsdaten der Datenbank) ist geheim und steht in der `.gitignore`.
- **Schlüssel für Dexie Cloud.** Synchronisierte Tabellen haben Text-Schlüssel, die Dexie Cloud vergibt (`@id`), nie `++id` oder Zahlen. Feste Schlüssel beginnen mit `#` und sind privat pro Nutzer: der feste Plan (`#` + Präfix der Tabelle + `PlanUpper0` …) und das Körpergewicht (`#2026-11-20`, ein Eintrag pro Tag). IDs in Adressen mit `encodeURIComponent`. Eine neue Tabelle, die nicht abgeglichen werden soll, gehört in `unsyncedTables` (`src/db.ts`).
- **Öffentliches Repository.** Der Code liegt öffentlich auf GitHub (GitHub Pages). Keine persönlichen Daten, Backups oder Export-Dateien einchecken. Der Ordner `design-referenz/` enthält fremde Designs und bleibt in der `.gitignore`.
- **Aufwärmsätze zählen nicht mit.** Sätze mit `warmup: true` bleiben bei „Letztes Mal“, beim Hinweis „Gewicht erhöhen“, bei Satzanzahlen und im Fortschrittsdiagramm außen vor. Jede neue Auswertung muss sie herausfiltern.
- **Zeiten aus Zeitstempeln.** Gesamtzeit und Zeit pro Übung werden immer aus gespeicherten Zeitstempeln berechnet (`startedAt`/`finishedAt`, Abschnitte in `segments`), nie im Speicher hochgezählt. Nur so stimmen sie nach dem Schließen von Safari oder dem Sperren des iPhones.
- **Offline-fähig.** Die App muss nach der Installation ohne Internet vollständig funktionieren. Angemeldet wird abgeglichen, sobald wieder Internet da ist.
- **Nichts geht verloren.** Eingaben sofort speichern, nicht erst beim Abschließen. Eingetragene Sätze werden nie mitgelöscht: Eine schon trainierte Übung verschwindet beim Löschen nur aus dem Plan (`archived`), nur nie trainierte Übungen werden ganz entfernt. Änderungen am Datenbank-Schema nur über eine Dexie-Versionsmigration, die bestehende Daten umwandelt und erhält. Das Leeren der Test-Daten in Version 2 war eine einmalige, abgesprochene Ausnahme und kein Vorbild. Der feste Plan in `src/lib/seed.ts` wird nur eingetragen, wenn es noch keine Übungen gibt, angemeldet erst nach einem Abgleich (`src/cloud.ts`). Abmelden leert die Daten auf dem Gerät, in der Cloud bleiben sie. Den Primärschlüssel einer Tabelle kann eine Migration nicht ändern: Wie bei Version 4 und 5 über Zwischentabellen gehen. Export und Import müssen nach jeder Schemaänderung weiter funktionieren und alle Tabellen enthalten, auch `segments`.

## Tech-Stack

Vite, React, TypeScript, Dexie mit dexie-cloud-addon, vite-plugin-pwa, eigenes CSS mit CSS-Variablen, Diagramm als eigenes SVG.

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
