# Design

Verbindlich für jede Seite und jede neue Komponente. Die Werte stehen als CSS-Variablen in `src/styles.css`. Dort werden sie geändert, nirgends sonst.

Vorbild ist der Stil der Referenz „Glas, Orange“ (nicht im Repository): fast schwarzer Grund, Anthrazit-Karten, Milchglas mit farbigem Leuchten, Icons in farbigen Kacheln. Statt Orange steht überall unser Neongelb. Fotos, Kreditkarten und andere Inhalte der Vorlage werden nicht übernommen, nur die Gestaltung.

## Leitidee

Dunkel, ruhig und klar. Große, fette Zahlen und weiße Titel tragen den Bildschirm, alles andere tritt in gedämpftem Grau zurück. Neongelb ist die einzige Farbe. Wo es um das Wichtigste geht, leuchtet sie weich durch Milchglas, sonst bleibt die Fläche schlicht anthrazit.

Die App ist so minimalistisch wie möglich: zwei Tabs, wenige Bausteine, pro Bildschirm eine Aufgabe.

## Farben

Nur dunkel, es gibt keinen hellen Modus. Alle Flächen sind neutrale Grautöne, ohne Blaustich.

| Variable | Wert | Verwendung |
|---|---|---|
| `--bg` | `#0a0a0b` | Seitenhintergrund, fast schwarz |
| `--surface` | `#1e1e21` | Karten, Listen-Karten, Tab-Leiste, Steuerknöpfe (Anthrazit) |
| `--surface-2` | `#2c2c30` | Flächen auf Karten: Eingabefelder, Nebenbuttons, Kacheln im Ruhezustand |
| `--line` | `#2a2a2e` | Trennlinien in Listen |
| `--text` | `#ffffff` | Titel, große Zahlen, Namen |
| `--text-muted` | `#8e8e95` | Beschriftungen, Nebeninfos, Einheiten |
| `--text-faint` | `#5d5d64` | Platzhalter, Einheiten in Feldern, deaktivierte Elemente |
| `--accent` | `#dcff1a` | Neongelb, die einzige Akzentfarbe |
| `--on-accent` | `#0a0a0b` | Schrift und Icons auf Gelb (immer dunkel) |
| `--danger` | `#ff6f61` | Nur als Textfarbe für „Löschen“ und Fehlermeldungen |
| `--glass-bg` | Weiß 5 % | Fläche der Milchglas-Karten |
| `--glass-border` | Weiß 9 % | Feiner Rand der Milchglas-Karten |
| `--glass-muted` | `#c6c6cc` | Beschriftungen auf Glas (heller, weil das Leuchten durchscheint) |
| `--glass-bright` | `#e4e4e8` | Nebentexte in der Ring-Uhr, direkt über dem Leuchten |
| `--glow-corner` | Gelb 42 % | Kern des Leuchtens in der Ecke |
| `--glow-center` | Gelb 30 % | Kern des Leuchtens in der Mitte (Ring-Uhr) |

### Textfarben

Wie in der Vorlage gibt es zwei Stimmen:

- **Kräftig:** Titel, Namen und große Zahlen in Weiß, fett
- **Gedämpft:** Beschriftungen und Nebeninfos in Grau, normale Schriftstärke, normale Groß- und Kleinschreibung. Deutlich weniger Kontrast, aber immer lesbar

### Kontraste

Nachgerechnet nach WCAG. Normaler Text braucht mindestens 4,5 : 1.

| Paar | Kontrast |
|---|---|
| Weiß auf Karte | 16,6 : 1 |
| Grau auf Hintergrund | 6,1 : 1 |
| Grau auf Karte | 5,1 : 1 |
| Grau auf `--surface-2` | 4,3 : 1, deshalb dort nur für große oder nebensächliche Texte |
| Dunkel auf Gelb (Hauptbutton, Kacheln) | 17,3 : 1 |
| Gelb auf Karte | 14,5 : 1 |
| Rot auf Karte | 6,1 : 1 |
| Glas-Grau auf Glas, wo das Leuchten schwach ist (am Text) | 7,3 : 1 |
| Weiß auf Glas mitten im Leuchten der Ring-Uhr | 7,2 : 1 |
| `--glass-bright` auf Glas mitten im Leuchten der Ring-Uhr | 5,7 : 1 |

`--text-faint` liegt bei 2,5 : 1 und ist nur für Platzhalter, Einheiten in Feldern und deaktivierte Elemente erlaubt, nie für Text, den man lesen muss.

**Auf Glas** wird normales Grau zu schwach (bis 2,7 : 1 im Leuchten). Deshalb stellt `.card--glass` Beschriftungen, `.muted` und Einheiten automatisch auf `--glass-muted` um. Der kräftige Kern des Leuchtens (`--glow-corner`) liegt in der Ecke, wo kein Text steht. Text darf dort nicht hin.

### Regeln für die Akzentfarbe

Neongelb steht für „das ist jetzt das Wichtigste“. Erlaubt ist sie an genau diesen Stellen:

1. **Hauptbutton:** höchstens einer pro Bildschirm
2. **Aktiver Tab** und **aktive Pille** im Umschalter
3. **Icon-Kacheln:** Icons in gelben, abgerundeten Quadraten vor Listen-Karten
4. **Hervorgehobener Wert:** eine Zahl pro Bildschirm, der aktuelle Punkt und die Linie im Diagramm
5. **Ring-Uhr:** Fortschrittsbogen und Punkte der erledigten und aktuellen Übung
6. **Leuchten** hinter Milchglas, siehe unten
7. **Fokusrahmen** von Eingabefeldern, der Pfeil im Hinweis „Gewicht erhöhen“, der Name der aktuellen Übung in der Übersicht

Nicht erlaubt: Titel, Fließtext, Rahmen und Hintergründe normaler Karten, die Haken der Satzzeilen (davon gibt es zu viele).

## Glas, Leuchten und Verläufe

Verläufe und Leuchten sind **gezielt und sparsam** einzusetzen, nur für die wichtigsten Elemente. Alles andere bleibt schlicht anthrazit, sonst wirkt es überladen.

**Mit Milchglas und Leuchten**, und nur diese:

- die Karte „Heute“ im Training-Tab (in allen Zuständen: Training starten, läuft, erledigt, Ruhetag)
- die Ring-Uhr in der Trainingsansicht
- die Zusammenfassung oben in der Auswertung

**Mit Verlauf**, und nur dieser: die Fläche unter der Linie im Diagramm (siehe Diagramme).

Aufbau:

```html
<div class="glow">                                  <!-- Leuchten oben rechts -->
  <section class="card card--hero card--glass">…</section>
</div>

<div class="glow glow--center">…</div>              <!-- Leuchten in der Mitte (Ring-Uhr) -->
```

- **`.glow`** ist die Hülle. Ihr `::before` ist ein weicher gelber Fleck aus einem radialen Verlauf, kein Unschärfe-Filter. Standard ist die obere rechte Ecke, er darf über die Karte hinausragen. `.glow--center` setzt ihn in die Mitte
- **`.card--glass`** liegt darin: Weiß 5 %, feiner heller Rand, `backdrop-filter: blur(28px) saturate(170%)`. Dadurch wird der Fleck hinter dem Glas unscharf und leuchtet satter durch
- **Leistung:** Der Fleck ist ein einfacher Verlauf, unscharf gerechnet wird nur an drei Stellen. Mehr Glas kommt nicht dazu. Ohne `backdrop-filter` gibt es eine fast deckende Fläche als Ersatz
- **Seitenränder:** `.app` schneidet alles ab, was seitlich übersteht (`overflow-x: clip`). Sonst würde das Leuchten die Seite verbreitern und Safari herauszoomen

### Kräftige Effekte (`.vivid`)

Training-Tab, Trainingsansicht und Übersicht tragen die Klasse `.vivid`. Dort sind die Effekte bewusst kräftig, näher an Referenz 8. Alle Werte stehen als `--vivid-*` in `src/styles.css`, die übrigen Seiten bleiben ruhig.

- **Leuchten:** Der Fleck ist viel größer (130 × 170 % bzw. 125 % der Karte) und kräftiger (Gelb 62 % im Kern) und strahlt weit über die Kartenränder ins Schwarz
- **Glas:** Weiß 6 %, `blur(40px) saturate(190%)`, hauchdünne helle Kante nur oben und links (Weiß 24 %), rechts und unten fast unsichtbar
- **Tiefe:** Glas-Karten, Listen-Karten und Steuerknöpfe schweben mit weichem, dunklem Schatten
- **Hauptbutton:** weicher gelber Schein (`--vivid-btn-glow`)
- **Typografie:** Titel 38 px / 800, Übungsname 32 px / 800, große Zahlen 800. Nebeninfos bleiben bei 400, die Kopfzeile der Trainingsansicht wird kleiner
- **Satzfelder:** Weiß 6 % statt `--surface-2`, eingetragene Werte weiß 800, Vorschläge und Einheiten sehr gedämpft (`--vivid-suggestion`, 500)
- **Ring-Uhr:** Bogen 14 breit mit SVG-Leuchtfilter, schon beim Start als kurzer Anfangsbogen (mindestens 4 %). Erledigte Punkte leuchten gelb, der aktuelle ist gelb gefüllt und pulsiert dezent (1,8 s)
- **Übersicht:** Die aktuelle Übung ist eine Glas-Karte mit Leuchten (`li.glow` > `.item.card--glass`). Erledigte zeigen statt der Kachel einen leuchtenden gelben Haken (`.icon-tile--check`)

### Verboten

- Lila oder Blau-Lila, überhaupt jede zweite Farbe
- Glas oder Leuchten außerhalb der genannten Elemente (die aktuelle Übung in der Übersicht ist dazugekommen)
- Verläufe als Hintergrund von Seiten, Karten oder Buttons
- Fotos und Illustrationen
- Emojis als Icons
- Schatten als Leuchten (`box-shadow` in Gelb), außer am Hauptbutton in `.vivid`

## Schrift

Eine Schrift für alles: **Outfit**, variabel (Gewicht 100–900), unter der SIL Open Font License. Die Datei liegt lokal in `src/fonts/outfit-latin-variable.woff2`, die Lizenz daneben. Keine Links zu Google Fonts oder anderen fremden Servern.

Nicht verwenden: Inter, Roboto, Archivo, Unbounded, IBM Plex Sans.

| Stil | Klasse | Größe bei 390 px | Gewicht | Sonstiges |
|---|---|---|---|---|
| Zahl XL | `.num.num--xl` | 70 px | 700 | schrumpft unter 390 px mit |
| Zahl L | `.num.num--l` | 44 px | 700 | schrumpft unter 390 px mit |
| Zahl M | `.num.num--m` | 24 px | 700 | |
| Seitentitel | `.title` | 32 px | 700 | Sperrung −0,02 em |
| Name der Übung (Trainingsansicht) | `.session__name` | 26 px | 700 | |
| Überschrift | `.heading` | 20 px | 600 | auch für Abschnittsüberschriften |
| Titel in Listen-Karten | `.item__title`, `.row__name` | 17 px | 600 | |
| Button | `.btn` | 17 px | 600 | |
| Fließtext | (Standard) | 16 px | 400 | Zeilenhöhe 1,45 |
| Beschriftung | `.label` | 14 px | 400 | gedämpft, normale Schreibweise |
| Nebeninfo | `.item__sub`, `.small` | 14 px | 400 | gedämpft |

- **Groß- und Kleinschreibung wie im Satz,** auch bei Beschriftungen und Buttons. Keine durchgehenden Großbuchstaben, keine Sperrung von Beschriftungen
- **Zahlen** stehen in `.num` mit **Tabellenziffern** (`font-variant-numeric: tabular-nums`). Bei Outfit ist das Pflicht: Ohne sind die Ziffern unterschiedlich breit (die 1 nur halb so breit wie die 0), und jeder Timer würde beim Zählen wackeln
- **Einheiten** (`.num__unit`) klein, normal stark und grau direkt hinter der Zahl
- Dezimalzahlen mit Komma („82,5“), das Malzeichen ist „×“
- Eingabefelder nie unter 16 px, sonst zoomt Safari auf dem iPhone ins Feld

### Große Zahlen

- XL und L schrumpfen auf schmalen Geräten mit (`--num-xl: min(4.375rem, 18vw)`, `--num-l: min(2.75rem, 11.3vw)`)
- Zahlen umbrechen nie (`white-space: nowrap`). Reicht der Platz nicht, wird die nächstkleinere Stufe genommen
- XL steht allein in der Zeile, höchstens zwei L oder drei M nebeneinander
- Längste Werte zum Prüfen: „142,5 kg“, „12 Wdh“, „1:05:00“, in 390 und 320 px Breite

## Abstände

Alles liegt auf einem 4-px-Raster.

| Variable | Wert | Verwendung |
|---|---|---|
| `--space-1` | 4 px | Innerhalb von Umschaltern |
| `--space-2` | 8 px | Icon zu Text, Satzzeilen untereinander |
| `--space-3` | 12 px | Zwischen Elementen in einer Karte |
| `--space-4` | 16 px | Seitenrand, Abstand zwischen Karten |
| `--space-5` | 24 px | Innenabstand von Karten, Kopf zu Inhalt |
| `--space-6` | 32 px | Zwischen Abschnitten |
| `--space-7` | 48 px | Großer Freiraum, selten |

Listen-Karten stehen 10 px auseinander. Inhalt ist höchstens 480 px breit. Safe-Area-Abstände des iPhones gelten zusätzlich. Tippflächen sind mindestens 44 px, Buttons 52 px hoch.

## Rundungen

| Variable | Wert | Verwendung |
|---|---|---|
| `--radius-card` | 26 px | Karten, Glas-Karten, Tab-Leiste |
| `--radius-item` | 22 px | Listen-Karten |
| `--radius-btn` | 18 px | Buttons, Umschalter-Hülle, Steuerknöpfe, aktiver Tab |
| `--radius-inner` | 14 px | Eingabefelder, Icon-Kacheln, Haken, kleine Buttons, Pillen im Umschalter |

Wie in der Vorlage sind Buttons gerundete Rechtecke, keine reinen Pillen. Ein Element in einer Karte ist immer weniger stark gerundet als die Karte.

## Bausteine

### Seitenkopf

Titel groß und weiß, darunter die Beschriftung in Grau (wie „Your Balance / Money Received“ in der Vorlage). Komponenten in `src/components/PageHeader.tsx`.

- **Tab-Seiten** (`<PageHeader>`): rechts das Zahnrad als nacktes Icon
- **Unterseiten** (`<SubpageHeader>`): oben links der Zurück-Pfeil als nacktes Icon, darunter Titel und Beschriftung

### Icon-Button

`.icon-btn`: nacktes weißes Icon (24 px), 44 px Tippfläche, kein Kreis, keine Fläche. Für Zahnrad, Zurück-Pfeil und X, bündig mit dem Seitenrand. Auf Karten (Zähler, Sortierpfeile) bekommt er eine dunkle Kachel (`.icon-btn--on-card`). Jeder Icon-Button hat ein `aria-label`.

### Icon-Kachel

`.icon-tile`: 44 × 44 px, `--radius-inner`, gelbe Fläche, dunkles Icon (22 px). Steht links in Listen-Karten, wie bei „Recent Transactions“ in der Vorlage. Varianten für den Status einer Übung: `.icon-tile--outline` (aktuell, nur gelb umrandet, gelbe Nummer) und `.icon-tile--muted` (offen, dunkle Fläche, graue Nummer). Erledigt ist eine gelbe Kachel mit Haken.

Icons kommen aus `src/components/Icon.tsx`: Linien-Icons, Strichstärke 2, runde Enden, `currentColor`.

### Listen-Karte

`.item-list` mit `.item`: Jeder Eintrag ist eine eigene Anthrazit-Karte (`--radius-item`, mindestens 68 px hoch, 10 px Abstand). Links die Icon-Kachel, daneben Titel (weiß, 600) und Nebeninfo (grau), rechts ein Wert als Zahl M oder ein grauer Pfeil. Ohne Kachel: `.item--plain`.

Verwendet für: „Vergangene Trainings“ und „Plan bearbeiten“ im Training-Tab, Verlauf, Übersicht während des Trainings, Zeit pro Übung in der Auswertung, Zeiten im Übungsdetail.

### Karte

`.card`: Anthrazit, `--radius-card`, 24 px Innenabstand, kein Rand, kein Schatten. Für alles, was kein Glas ist, zum Beispiel die Plan-Liste oder die Einstellungen.

### Hauptkarte

`.card.card--hero`: die eine Karte, um die es geht, mit mehr Luft. Darin Beschriftung, der Inhalt in Titelgröße oder als Zahl XL (weiß), eine kurze graue Zeile und höchstens ein Hauptbutton. Die Hauptkarten im Training-Tab und in der Auswertung sind aus Glas mit Leuchten.

### Zeilenliste

`.rows` mit `.row` in einer Karte, getrennt durch feine Linien. Nur noch im Plan, weil sich dort Zeilen zum Bearbeiten aufklappen. Rechts bis zu zwei Icon-Buttons auf dunklen Kacheln.

### Zahlenanzeige

```html
<p class="label">Gesamtzeit</p>
<p class="num num--xl">58:00</p>
<p class="num num--m">12<span class="num__unit">Sätze</span></p>
```

XL einmal pro Bildschirm. `.num--accent` (gelb) für höchstens eine Zahl pro Bildschirm, nie auf Glas (dort ist die Zahl weiß, das Gelb kommt vom Leuchten).

### Buttons

| Variante | Aussehen | Wofür |
|---|---|---|
| `.btn--primary` | Gelb, dunkle Schrift | Die eine Hauptaktion des Bildschirms |
| `.btn` | Anthrazit (`--surface-2`), weiße Schrift | Alle weiteren Aktionen |
| `.btn--ghost` | Nur graue Schrift | Abbrechen, Zurück, „− Satz“ |
| `.btn--danger` | Nur rote Schrift | Löschen, immer mit Rückfrage |
| `.btn--small` | 44 px hoch, `--radius-inner` | „+ Satz“, Auswahl-Pillen |

Mindestens 52 px hoch, `--radius-btn`, Schrift 17 px, 600. `.btn--block` macht den Button so breit wie die Karte.

### Umschalter

`.segmented`, wie „Incomings / Outgoings“ in der Vorlage: dunkle Hülle (`--surface`), darin zwei oder drei Pillen. Die aktive Pille ist **gelb mit dunkler Schrift**, die anderen sind gedämpft. Zum Beispiel Oberkörper / Unterkörper im Plan, später der Zeitraum im Diagramm.

### Eingabefeld

`.field__input`: `--surface-2`, `--radius-inner`, Zahl groß, fett und zentriert. Gelber Rahmen beim Antippen. Für Zahlen immer `inputmode="decimal"` oder `"numeric"`. Textfelder (`.field__input--text`) linksbündig, normale Schrift.

### Zähler

`.stepper`: links die Beschriftung, rechts Minus, Zahl M und Plus auf dunklen Kacheln. Für kleine ganze Zahlen wie Zielsätze.

### Hinweis

`.hint`: kleine Fläche `--surface-2`, weiße Schrift, gelber Pfeil. Für „Gewicht erhöhen“. Er kann bei mehreren Übungen stehen, deshalb ist nur der Pfeil gelb.

### Löschen mit Nachfrage

Löschen fragt immer an Ort und Stelle nach: Der aufgeklappte Bereich zeigt einen Satz, der genau sagt, was passiert, darunter „Abbrechen“ und „Ja, löschen“. Kein Systemdialog.

### Satzzeile

`.set-row`: Satznummer, Gewicht, Wiederholungen, Haken. „kg“ und „Wdh“ stehen klein unten rechts in den Feldern.

- **Grau ist Vorschlag, weiß ist eingetragen.** Die Felder zeigen die Werte vom letzten Mal als grauen Platzhalter
- **Ein Tipp auf den Haken** (`.check-btn`, `--radius-inner`) trägt den Vorschlag ein, ein zweiter trägt ihn wieder aus. Eingetragen ist der Haken eine **weiße** Kachel mit dunklem Haken, nicht gelb
- **Tippen in ein Feld** überschreibt den Vorschlag
- **Aufwärmsätze** (`.set-row--warmup`): „A“ statt Nummer, Felder nur umrandet statt gefüllt
- In der Trainingsansicht sind Felder und Haken 52 px hoch, sonst 56 bis 64 px
- „142,5“ muss bei 375 px Breite vollständig sichtbar sein

### Trainingsansicht

`.session` füllt genau den Bildschirm (`100dvh`), ohne Tab-Leiste. Von oben nach unten:

1. **Kopf:** „Übung 3 von 9“ in Grau, rechts das X als nacktes Icon
2. **Übung:** Name (26 px, 700), Zeile mit Ziel und „− Satz“ / „+ Satz“, „Letztes Mal“, ggf. Hinweis
3. **Sätze:** nur dieser Bereich darf scrollen
4. **Ring-Uhr:** Glas mit Leuchten in der Mitte, nimmt den restlichen Platz
5. **Steuerleiste:** links und rechts Steuerknöpfe (`.control-btn`, 56 px, Anthrazit, `--radius-btn`), dazwischen der gelbe Hauptbutton, einzeilig

Solange ein Eingabefeld aktiv ist, entfällt die Ring-Uhr und die Übungszeit steht klein im Kopf.

### Ring-Uhr

SVG in einer Glas-Karte mit Leuchten in der Mitte (`.ring__card.glow.glow--center` > `.ring__glass.card--glass`). Ring höchstens 260 px.

- In der Mitte klein „Diese Übung“, groß die Übungszeit (Outfit 700, weiß), darunter klein „Gesamt 42:10“. Die kleinen Texte in `--glass-bright`
- Ring Weiß 10 %, Fortschrittsbogen gelb mit runden Enden, beginnt oben im Uhrzeigersinn
- Außen ein Punkt pro Übung: erledigt gelb gefüllt, aktuell gelb umrandet, offen Weiß 28 %
- Unter 150 px Höhe wird sie zur **schmalen Zeile**: Übungszeit als Zahl L, rechts Punkte und Gesamtzeit, ebenfalls auf Glas

### Blatt

`.sheet`: legt sich über den ganzen Bildschirm (Übersicht während des Trainings). Oben rechts das X, darunter Titel und Beschriftung wie im Seitenkopf, dann Listen-Karten mit Status-Kachel, Name, Status und Zeit. Die aktuelle Übung hat einen gelben Namen.

### Timer

Laufende Zeiten (`.timer`) im Format „0:00“, ab einer Stunde „1:05:00“, immer aus gespeicherten Zeitstempeln berechnet und mit Tabellenziffern.

### Tab-Leiste

Schwebt als Anthrazit-Fläche (`--radius-card`, 64 px hoch, höchstens 320 px breit) mittig über dem Inhalt, mit dunklem Schatten. Genau zwei Tabs mit Icon und Beschriftung. Der aktive Tab ist eine gelbe Fläche mit dunkler Schrift, der andere grau. Auf Unterseiten und in der Trainingsansicht ausgeblendet. Sie entfällt später, wenn die Übersicht zur Startseite wird.

## Diagramme

Festgelegt für die Körpergewicht-Seite und das Fortschrittsdiagramm, gebaut wird es dort. Vorbild ist „Your Balance“ in der Vorlage.

| Element | Klasse | Aussehen |
|---|---|---|
| Linie | `.chart__line` | Gelb, 3 px, **geschwungen** (geglättete Kurve durch die Punkte, keine Ecken), runde Enden |
| Fläche darunter | `<linearGradient>` mit `.chart__area-top` / `.chart__area-bottom` | Gelb 32 % direkt unter der Linie, nach unten ausblendend bis ganz durchsichtig, sodass sie ins Schwarz ausläuft |
| Aktueller Wert | `.chart__highlight` | Gelber Punkt mit 3 px weißem Ring |
| Schildchen | `.chart__tag` + `.chart__tag-text` | Kleine Fläche `--surface-2` mit `--radius-inner` über dem aktuellen Punkt, darin das Datum („5. Juni“) oder der Wert, weiß, 13 px, 600 |
| Einzelwerte | `.chart__mark` | Kleine Punkte in `#4a4a50`, falls nötig (z. B. Tageswerte unter dem 7-Tage-Durchschnitt) |
| Achsentext | `.chart__axis` | 12 px, grau, normale Schreibweise |
| Hilfslinien | `.chart__grid` | Höchstens drei, waagrecht, kaum sichtbar, oft ganz weglassen |

- Das Diagramm steht ohne eigene Karte direkt auf dem schwarzen Grund und darf bis an den Bildschirmrand reichen, wie in der Vorlage
- Darüber groß der aktuelle Wert als Zahl (weiß oder gelb), darunter der Umschalter für den Zeitraum
- Im Körpergewicht ist die Linie der 7-Tage-Durchschnitt, die Tageswerte sind kleine graue Punkte
- Keine Legende, keine senkrechten Hilfslinien, keine zweite Farbe

## Bewegung

Sparsam. Buttons geben beim Drücken kurz nach (80 ms). Keine Einblend-Animationen, keine hüpfenden Zahlen, kein pulsierendes Leuchten. Einzige Ausnahme: Der Punkt der aktuellen Übung in der Ring-Uhr pulsiert dezent. Bei „Bewegung reduzieren“ entfällt alles.

## Vor dem Fertigmelden prüfen

- In 390 und 375 px Breite angesehen, nichts ragt über den Rand, die Tab-Leiste sitzt unten
- Glas und Leuchten nur an den drei erlaubten Stellen, Text nie über dem kräftigen Kern des Leuchtens
- Höchstens ein gelber Hauptbutton und eine gelbe Zahl pro Bildschirm
- Beschriftungen gedämpft, aber lesbar (mindestens 4,5 : 1, auf Glas `--glass-muted`)
- Zahlen und Timer mit Tabellenziffern
- Alle Farben, Abstände und Rundungen aus den Variablen
- Trainingsansicht in 390 × 844 ohne Scrollen; in 375 × 667 darf nur der Satzbereich scrollen
