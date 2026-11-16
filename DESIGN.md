# Design

Verbindlich für jede Seite und jede neue Komponente. Die Werte stehen als CSS-Variablen in `src/styles.css`. Dort werden sie geändert, nirgends sonst. Eine Musterseite mit allen Bausteinen liegt in der App unter **Mehr → Design-Muster** (`#/design`).

## Leitidee

Dunkel, ruhig, und die Zahl ist der Star. Auf jedem Bildschirm gibt es genau einen Blickfang: das Gewicht, die Wiederholungen oder das Körpergewicht, groß und fett gesetzt. Alles andere tritt zurück. Farbe gibt es nur eine, und sie ist selten.

## Farben

Die App ist ausschließlich dunkel. Es gibt keinen hellen Modus.

| Variable | Wert | Verwendung |
|---|---|---|
| `--bg` | `#0b0c0e` | Seitenhintergrund, fast schwarz |
| `--surface` | `#17191d` | Karten |
| `--surface-2` | `#23262c` | Flächen auf Karten: Eingabefelder, normale Buttons, Tab-Leiste |
| `--line` | `#2e3238` | Trennlinien in Listen |
| `--text` | `#f5f6f7` | Text, Zahlen, Überschriften |
| `--text-muted` | `#9499a1` | Beschriftungen, Einheiten, Erklärtext |
| `--text-faint` | `#666b73` | Platzhalter, Achsenbeschriftung, deaktivierte Elemente |
| `--accent` | `#dcff1a` | Neongelb, die einzige Akzentfarbe |
| `--on-accent` | `#0b0c0e` | Schrift und Icons auf Akzentflächen (immer dunkel, nie weiß) |
| `--danger` | `#ff6b5e` | Nur als Textfarbe für „Löschen“ und Fehlermeldungen |

### Regeln für die Akzentfarbe

Neongelb steht für „das ist jetzt das Wichtigste“. Erlaubt ist sie an genau diesen Stellen:

1. **Hauptbutton** – höchstens einer pro Bildschirm
2. **Aktiver Tab** in der Tab-Leiste
3. **Hervorgehobener Wert** – eine Zahl pro Bildschirm (aktueller Durchschnitt, neue Bestleistung, Veränderung) und der dazugehörige Punkt im Diagramm
4. **Fokusrahmen** von Eingabefeldern

Nicht erlaubt: Überschriften, Fließtext, Icons außerhalb des aktiven Tabs, Rahmen von Karten, Hintergründe von Karten, Flächen im Diagramm. Wenn auf einem Bildschirm mehr als zwei gelbe Elemente gleichzeitig zu sehen sind (Tab-Leiste nicht mitgezählt), ist eines zu viel.

### Verboten

- Farbverläufe jeder Art, besonders Lila und Blau-Lila
- Eine zweite Akzentfarbe
- Fotos und Illustrationen
- Emojis als Icons
- Glas-Effekte, Unschärfe, leuchtende Schatten (Glow)
- Rahmenlinien um Karten. Karten heben sich nur durch ihre Fläche ab

## Schrift

Eine Schriftfamilie: **Archivo** als variable Schrift (Gewicht 100–900, Breite 62–125 %), lizenziert unter der SIL Open Font License. Die Datei liegt lokal in `src/fonts/archivo-latin-variable.woff2` und wird von der App selbst ausgeliefert. Es gibt keine Links zu Google Fonts oder anderen fremden Servern.

Archivo hat zwei Stimmen, die über die Breite gesteuert werden:

- **Schmal und fett** (`font-stretch: 62%`, Gewicht 800): Zahlen, Seitentitel, Überschriften
- **Normal breit** (Gewicht 400–600): Fließtext, Beschriftungen, Einheiten

| Stil | Klasse | Größe | Gewicht | Breite | Sonstiges |
|---|---|---|---|---|---|
| Zahl XL | `.num.num--xl` | 80 px | 800 | 62 % | Zeilenhöhe 0,95 |
| Zahl L | `.num.num--l` | 48 px | 800 | 62 % | |
| Zahl M | `.num.num--m` | 28 px | 800 | 62 % | |
| Seitentitel | `.title` | 44 px | 800 | 62 % | Großbuchstaben |
| Überschrift | `.heading` | 24 px | 800 | 62 % | Großbuchstaben |
| Button | `.btn` | 17 px | 800 | 75 % | Großbuchstaben, Sperrung 0,04 em |
| Beschriftung | `.label` | 12 px | 600 | 100 % | Großbuchstaben, Sperrung 0,1 em, `--text-muted` |
| Fließtext | (Standard) | 16 px | 400 | 100 % | Zeilenhöhe 1,45 |
| Klein | `.small` | 14 px | 400 | 100 % | |

Regeln:

- Zahlen stehen immer in `.num`, mit Tabellenziffern (`tabular-nums`), damit sie beim Ändern nicht springen
- Die Einheit steht in `.num__unit`: klein, normal breit, grau, direkt hinter der Zahl
- Dezimalzahlen mit Komma („82,5“), das Malzeichen ist „×“, nicht „x“
- Eingabefelder nie unter 16 px, sonst zoomt Safari auf dem iPhone ins Feld
- Großbuchstaben nur für Titel, Überschriften, Buttons und Beschriftungen, nie für ganze Sätze

## Abstände

Alles liegt auf einem 4-px-Raster.

| Variable | Wert | Verwendung |
|---|---|---|
| `--space-1` | 4 px | Innerhalb von Pillen-Umschaltern |
| `--space-2` | 8 px | Icon zu Text, Beschriftung zu Feld |
| `--space-3` | 12 px | Zwischen Elementen in einer Karte |
| `--space-4` | 16 px | Seitenrand, Abstand zwischen Karten |
| `--space-5` | 24 px | Innenabstand von Karten, Kopfbereich zu Inhalt |
| `--space-6` | 32 px | Zwischen Abschnitten |
| `--space-7` | 48 px | Großer Freiraum, selten |

- Inhalt ist höchstens 480 px breit und zentriert
- Tippflächen sind mindestens 52 px hoch (`--tap`)
- Oben, unten und seitlich gelten zusätzlich die Safe-Area-Abstände des iPhones
- Der Seiteninhalt endet über der Tab-Leiste, nichts liegt dauerhaft dahinter

## Rundungen

| Variable | Wert | Verwendung |
|---|---|---|
| `--radius-card` | 28 px | Karten |
| `--radius-inner` | 18 px | Elemente in Karten: Eingabefelder, Satzzeilen |
| `--radius-pill` | 999 px | Buttons, Umschalter, Tab-Leiste, Tabs |

Eckige Elemente gibt es nicht. Ein Element in einer Karte ist immer weniger stark gerundet als die Karte selbst.

## Bausteine

### Seitenkopf

Kleine Beschriftung, darunter der Seitentitel. Jede Seite beginnt so.

```html
<header class="page-header">
  <p class="label">Montag, 16. November</p>
  <h1 class="title">Training</h1>
</header>
```

### Karte

Dunkelgraue Fläche, 28 px Rundung, 24 px Innenabstand, kein Rahmen, kein Schatten. Mehrere Karten stehen in `.stack` mit 16 px Abstand untereinander.

```html
<section class="card">
  <p class="label">Letztes Training</p>
  <h2 class="heading">Bankdrücken</h2>
  <div class="card__row">
    <p class="num num--l">82,5<span class="num__unit">kg</span></p>
    <p class="num num--l">8<span class="num__unit">Wdh</span></p>
  </div>
  <p class="muted small">Letztes Mal: 80 kg × 8, 8, 7</p>
</section>
```

### Zahlenanzeige

Die Zahl schmal und fett, die Einheit klein und grau dahinter. Darüber steht eine Beschriftung, die sagt, was die Zahl bedeutet.

```html
<p class="label">7-Tage-Durchschnitt</p>
<p class="num num--xl num--accent">78,2<span class="num__unit">kg</span></p>
```

- **XL** einmal pro Bildschirm, für den einen Wert, um den es geht
- **L** für Gewicht und Wiederholungen einer Übung
- **M** für Nebenwerte in Zeilen (Sätze, Veränderung)
- `.num--accent` für höchstens eine Zahl pro Bildschirm

### Buttons

Immer pillenförmig, mindestens 52 px hoch, Text in Großbuchstaben.

```html
<button class="btn btn--primary btn--block">Training starten</button>
<button class="btn btn--block">Satz hinzufügen</button>
<button class="btn btn--ghost">Abbrechen</button>
<button class="btn btn--danger">Löschen</button>
```

| Variante | Aussehen | Wofür |
|---|---|---|
| `.btn--primary` | Neongelb, dunkle Schrift | Die eine Hauptaktion des Bildschirms |
| `.btn` | Dunkelgrau, helle Schrift | Alle weiteren Aktionen |
| `.btn--ghost` | Nur graue Schrift | Abbrechen, Zurück |
| `.btn--danger` | Nur rote Schrift | Löschen, immer mit Rückfrage |

`.btn--block` macht den Button so breit wie die Karte. Der Hauptbutton steht im unteren Bereich, mit dem Daumen erreichbar.

### Umschalter

Zwei oder drei Pillen in einer gemeinsamen Hülle (`.segmented`), zum Beispiel Oberkörper/Unterkörper oder der Zeitraum eines Diagramms. Die gewählte Option ist **weiß**, nicht gelb: Sie ist eine Auswahl, keine Hauptaktion.

### Eingabefeld

`.field__input`: 64 px hoch, dunkelgraue Fläche, die Zahl groß, schmal, fett und zentriert. Beim Antippen erscheint ein gelber Rahmen. Für Zahlen immer `inputmode="decimal"` oder `"numeric"`.

### Tab-Leiste

Schwebt als Pille über dem Inhalt: 16 px Abstand zu den Seiten, 64 px hoch, dunkelgrau mit Schatten nach unten. Der aktive Tab ist eine neongelbe Pille mit Icon und Beschriftung, die anderen drei zeigen nur ihr Icon in Grau.

### Icons

Selbst gezeichnete Linien-Icons als SVG: 24 px, Strichstärke 2,25, runde Enden, Farbe über `currentColor`. Keine Emojis, keine Icon-Schrift, keine gefüllten Icons.

## Diagramme

Diagramme sind grau. Farbe bekommt nur der eine Wert, auf den es ankommt.

| Element | Klasse | Aussehen |
|---|---|---|
| Hilfslinien | `.chart__grid` | `#24272c`, 1 px, nur waagrecht, höchstens drei |
| Einzelwerte | `.chart__mark` | Punkte oder Balken in `#4b5058` |
| Verlaufslinie | `.chart__line` | `#8b9099`, 2,5 px, runde Ecken |
| Wichtigster Wert | `.chart__highlight` | Neongelber Punkt, 6 px Radius, mit schwachem Hof (`.chart__halo`) |
| Achsentext | `.chart__axis` | 11 px, Großbuchstaben, `--text-faint` |

- Im Gewichtsdiagramm sind die Tageswerte graue Punkte, der 7-Tage-Durchschnitt ist die Linie, und nur der aktuelle Durchschnitt leuchtet gelb
- Im Fortschrittsdiagramm einer Übung leuchtet nur das letzte Training (oder die Bestleistung)
- Der hervorgehobene Wert steht zusätzlich als große Zahl über dem Diagramm
- Keine Legende, keine Flächenfüllung unter der Linie, keine senkrechten Hilfslinien, keine zweite Farbe

## Bewegung

Sparsam. Buttons geben beim Drücken kurz nach (80 ms). Keine Einblend-Animationen beim Seitenwechsel, keine hüpfenden Zahlen. Bei „Bewegung reduzieren“ in den iPhone-Einstellungen entfällt alles.

## Vor dem Fertigmelden prüfen

- In 390 px Breite angesehen, nichts ragt über den Rand
- Genau ein Blickfang pro Bildschirm
- Höchstens ein gelber Button und eine gelbe Zahl
- Alle Farben, Abstände und Rundungen kommen aus den Variablen, keine frei gewählten Werte
- Tippflächen mindestens 52 px, Eingabefelder mindestens 16 px Schrift
