# Design

Verbindlich für jede Seite und jede neue Komponente. Die Werte stehen als CSS-Variablen in `src/styles.css`. Dort werden sie geändert, nirgends sonst.

Die App ist so minimalistisch wie möglich: zwei Tabs, wenige Bausteine, pro Bildschirm eine Aufgabe. Was nicht gebraucht wird, kommt nicht auf den Bildschirm.

## Leitidee

Tiefes Marineblau, eine breite, technische Schrift, und die Zahl ist der Star. Auf jedem Bildschirm gibt es genau einen Blickfang: das Gewicht, die Wiederholungen oder das Körpergewicht, groß und fett gesetzt. Alles andere tritt zurück. Blau ist die Grundstimmung, Neongelb die einzige Akzentfarbe, und sie ist selten.

## Farben

Die App ist ausschließlich dunkel. Es gibt keinen hellen Modus. Alle Flächen sind Abstufungen desselben Blaus, es gibt kein neutrales Grau und kein reines Schwarz.

| Variable | Wert | Verwendung |
|---|---|---|
| `--bg` | `#060b1f` | Seitenhintergrund, sehr dunkles Marineblau |
| `--surface` | `#0f1838` | Karten, dunkelblau |
| `--surface-2` | `#1c2a5e` | Flächen auf Karten: Eingabefelder, normale Buttons |
| `--tabbar-bg` | `#162050` | Tab-Leiste |
| `--line` | `#1f2c5c` | Trennlinien in Listen |
| `--text` | `#f3f5ff` | Text, Zahlen, Überschriften |
| `--text-muted` | `#9ba6d1` | Beschriftungen, Einheiten, Erklärtext |
| `--text-faint` | `#6b77a8` | Platzhalter, Achsenbeschriftung, deaktivierte Elemente |
| `--accent` | `#dcff1a` | Neongelb, die einzige Akzentfarbe |
| `--on-accent` | `#060b1f` | Schrift und Icons auf Akzentflächen (immer dunkel, nie weiß) |
| `--danger` | `#ff8a7f` | Nur als Textfarbe für „Löschen“ und Fehlermeldungen |

### Kontraste

Nachgerechnet nach WCAG. Normaler Text braucht mindestens 4,5 : 1.

| Paar | Kontrast |
|---|---|
| Text auf Karte | 16,0 : 1 |
| Gelb auf Karte | 15,2 : 1 |
| Dunkel auf Gelb (Hauptbutton) | 17,1 : 1 |
| Text auf normalem Button (`--surface-2`) | 12,5 : 1 |
| Gedämpfter Text auf Hintergrund | 8,2 : 1 |
| Gedämpfter Text auf Karte | 7,3 : 1 |
| Graue Icons in der Tab-Leiste | 5,7 : 1 |

`--text-faint` liegt auf der Karte bei rund 4 : 1 und ist deshalb nur für Platzhalter, Achsentext und deaktivierte Elemente erlaubt, nie für Text, den man lesen muss. Gelbe Schrift steht nur auf `--bg` oder `--surface`, nie auf `--surface-2` in kleiner Größe.

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
- Neutrales Grau oder reines Schwarz als Fläche
- Fotos und Illustrationen
- Emojis als Icons
- Glas-Effekte, Unschärfe, leuchtende Schatten (Glow)
- Rahmenlinien um Karten. Karten heben sich nur durch ihre Fläche ab

## Schrift

Zwei Schriften, beide als variable Schrift lokal in `src/fonts/` und unter der SIL Open Font License. Die App liefert sie selbst aus. Es gibt keine Links zu Google Fonts oder anderen fremden Servern.

- **Unbounded** (`--font-display`, `unbounded-latin-variable.woff2`): breit und technisch. Für Zahlen, Seitentitel, Überschriften, Buttons und Tab-Beschriftung
- **IBM Plex Sans** (`--font-body`, `ibm-plex-sans-latin-variable.woff2`): gut lesbar und schmaler. Für Fließtext, Beschriftungen und Einheiten

Nicht verwenden: Inter, Roboto, Archivo, Systemschriften als bewusste Wahl.

| Stil | Klasse | Schrift | Größe bei 390 px | Gewicht | Sonstiges |
|---|---|---|---|---|---|
| Zahl XL | `.num.num--xl` | Unbounded | 64 px | 800 | Sperrung −0,03 em |
| Zahl L | `.num.num--l` | Unbounded | 40 px | 800 | Sperrung −0,03 em |
| Zahl M | `.num.num--m` | Unbounded | 22 px | 800 | |
| Seitentitel | `.title` | Unbounded | 32 px | 800 | Sperrung −0,02 em |
| Überschrift | `.heading` | Unbounded | 18 px | 700 | |
| Button | `.btn` | Unbounded | 15 px | 700 | |
| Tab | `.tabbar__tab` | Unbounded | 12 px | 700 | |
| Eingabefeld | `.field__input` | Unbounded | 26 px | 800 | zentriert |
| Beschriftung | `.label` | IBM Plex Sans | 12 px | 600 | Großbuchstaben, Sperrung 0,1 em |
| Fließtext | (Standard) | IBM Plex Sans | 16 px | 400 | Zeilenhöhe 1,5 |
| Klein | `.small` | IBM Plex Sans | 14 px | 400 | |

Unbounded wird in normaler Groß- und Kleinschreibung gesetzt, nie in durchgehenden Großbuchstaben. Großbuchstaben gibt es nur bei Beschriftungen (`.label`) in IBM Plex Sans.

### Breite Schrift, große Zahlen

Unbounded ist sehr breit: Eine Ziffer braucht etwa 0,75 em, das Komma 0,3 em. Damit Gewichte und Wiederholungen auf dem iPhone Platz haben, gilt:

- **Die Größen sind auf die längsten Werte ausgelegt.** In eine Karte passen bei 390 px Breite 310 px Inhalt. „142,5 kg“ in XL braucht davon etwa 240 px, „142,5 kg“ und „12 Wdh“ nebeneinander in L etwa 250 px
- **XL und L schrumpfen auf schmalen Geräten mit** (`--num-xl: min(4rem, 16.4vw)`, `--num-l: min(2.5rem, 10.25vw)`). Bei 320 px Breite ist XL noch 52 px groß
- **Die Einheit steht in IBM Plex Sans** (`.num__unit`), klein und gedämpft. Das spart gegenüber Unbounded gut ein Drittel Breite
- **Höchstens zwei L-Zahlen nebeneinander**, höchstens drei M-Zahlen. XL steht immer allein in der Zeile
- **Zahlen umbrechen nie** (`white-space: nowrap`). Reicht der Platz nicht, wird die nächstkleinere Stufe genommen, nicht die Schrift von Hand verkleinert
- **Nur die Nachkommastellen zeigen, die es braucht:** „80“ statt „80,0“, höchstens eine Nachkommastelle beim Körpergewicht, höchstens zwei bei Hantelgewichten („82,25“)
- Wer Zahlengrößen ändert oder Zahlen neu anordnet, prüft die längsten Werte („142,5 kg“, „12 Wdh“) in 390 px und 320 px Breite

Weitere Regeln:

- Zahlen stehen immer in `.num`, mit Tabellenziffern (`tabular-nums`)
- Dezimalzahlen mit Komma („82,5“), das Malzeichen ist „×“, nicht „x“
- Eingabefelder nie unter 16 px, sonst zoomt Safari auf dem iPhone ins Feld
- Seitentitel sind kurz (ein Wort, höchstens etwa 13 Zeichen). Längere Titel brechen um

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
- Buttons und Listenzeilen sind mindestens 52 px hoch (`--tap`). Kleine Buttons und Icon-Buttons sind 44 px groß, nie kleiner
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

Es gibt zwei Arten von Seiten, und jede hat ihren eigenen Kopf. Beide kommen aus `src/components/PageHeader.tsx`.

**Tab-Seiten** (Training, Gewicht) – `<PageHeader>`: links kleine Beschriftung und Seitentitel, rechts oben das Zahnrad zu den Einstellungen. Unten schwebt die Tab-Leiste.

**Unterseiten** (Plan, Übungsdetail, Einstellungen) – `<SubpageHeader>`: oben links der Zurück-Pfeil, darunter Beschriftung und Seitentitel. Keine Tab-Leiste, kein Zahnrad.

```html
<!-- Tab-Seite -->
<header class="page-header page-header--row">
  <div>
    <p class="label">Montag, 16. November</p>
    <h1 class="title">Training</h1>
  </div>
  <a class="icon-btn" href="#/einstellungen" aria-label="Einstellungen">…</a>
</header>

<!-- Unterseite -->
<header class="page-header">
  <button class="icon-btn" aria-label="Zurück">…</button>
  <div class="page-header__text">
    <p class="label">Zwei Listen, vier Tage</p>
    <h1 class="title">Plan</h1>
  </div>
</header>
```

### Icon-Button

`.icon-btn`: runder Kreis mit 44 px Durchmesser in Kartenfarbe, Icon 22 px in gedämpfter Farbe. Die Tippfläche ist rundum 6 px größer als der sichtbare Kreis. Es gibt genau zwei: Zahnrad (oben rechts auf Tab-Seiten) und Zurück-Pfeil (oben links auf Unterseiten). Jeder Icon-Button hat ein `aria-label`.

### Abschnitt

`.section`: kleine Beschriftung (`.label`) als Überschrift, darunter eine Karte. Für nachgeordnete Inhalte am Seitenende, zum Beispiel „Vergangene Trainings“. 32 px Abstand nach oben.

### Karte

Dunkelblaue Fläche, 28 px Rundung, 24 px Innenabstand, kein Rahmen, kein Schatten. Mehrere Karten stehen in `.stack` mit 16 px Abstand untereinander.

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

Die Zahl breit und fett in Unbounded, die Einheit klein und gedämpft in IBM Plex Sans dahinter. Darüber steht eine Beschriftung, die sagt, was die Zahl bedeutet.

```html
<p class="label">7-Tage-Durchschnitt</p>
<p class="num num--xl num--accent">78,2<span class="num__unit">kg</span></p>
```

- **XL** einmal pro Bildschirm, für den einen Wert, um den es geht
- **L** für Gewicht und Wiederholungen einer Übung
- **M** für Nebenwerte in Zeilen (Sätze, Veränderung)
- `.num--accent` für höchstens eine Zahl pro Bildschirm

### Buttons

Immer pillenförmig, mindestens 52 px hoch, Text in normaler Schreibweise.

```html
<button class="btn btn--primary btn--block">Training starten</button>
<button class="btn btn--block">Satz hinzufügen</button>
<button class="btn btn--ghost">Abbrechen</button>
<button class="btn btn--danger">Löschen</button>
```

| Variante | Aussehen | Wofür |
|---|---|---|
| `.btn--primary` | Neongelb, dunkle Schrift | Die eine Hauptaktion des Bildschirms |
| `.btn` | Mittelblau (`--surface-2`), helle Schrift | Alle weiteren Aktionen |
| `.btn--ghost` | Nur gedämpfte Schrift | Abbrechen, Zurück |
| `.btn--danger` | Nur rote Schrift | Löschen, immer mit Rückfrage |

`.btn--small` (44 px hoch, 13 px Schrift) ist für Nebenwege, die nicht zur Aufgabe des Bildschirms gehören, zum Beispiel „Plan bearbeiten“ im Training-Tab. Nie in Gelb.

`.btn--block` macht den Button so breit wie die Karte. Der Hauptbutton steht im unteren Bereich, mit dem Daumen erreichbar. Ausnahme: Steht darunter eine lange Liste, kommt er darüber, damit er ohne Scrollen erreichbar ist (z. B. „Training starten“). Beschriftungen sind kurz, höchstens zwei Wörter, weil die Schrift breit läuft.

### Umschalter

Zwei oder drei Pillen in einer gemeinsamen Hülle (`.segmented`), zum Beispiel Oberkörper/Unterkörper oder der Zeitraum eines Diagramms. Die gewählte Option ist **hell** (`--text`), nicht gelb: Sie ist eine Auswahl, keine Hauptaktion.

### Eingabefeld

`.field__input`: 64 px hoch, mittelblaue Fläche, die Zahl groß, fett und zentriert in Unbounded. Beim Antippen erscheint ein gelber Rahmen. Für Zahlen immer `inputmode="decimal"` oder `"numeric"`. Zwei Felder nebeneinander (Gewicht und Wiederholungen) müssen „142,5“ vollständig zeigen.

### Textfeld

`.field__input.field__input--text`: für Namen. 52 px hoch, mittelblaue Fläche, IBM Plex Sans 17 px, linksbündig. Gelber Rahmen beim Antippen wie beim Zahlenfeld. Fehlermeldungen stehen als `.error` (rote Schrift, 14 px) direkt unter dem Feld.

### Zähler

`.stepper` (Komponente `Stepper`): links die Beschriftung, rechts Minus-Button, Zahl in Größe M und Plus-Button. Für kleine ganze Zahlen wie Zielsätze und Zielwiederholungen, weil das mit dem Daumen schneller geht als die Tastatur. Am Rand des Wertebereichs ist der jeweilige Button ausgegraut.

### Zeilenliste

`.rows` mit `.row`: Liste in einer Karte, Zeilen mindestens 64 px hoch, getrennt durch eine feine Linie (`--line`). Links der Name (`.row__name`, IBM Plex Sans 17 px, Gewicht 600, bricht bei langen Namen um), darunter bei Bedarf eine gedämpfte Zusatzzeile. Rechts entweder eine Zahl in Größe M oder bis zu zwei Icon-Buttons.

- Icon-Buttons auf einer Karte bekommen `.icon-btn--on-card` (mittelblaue Fläche), sonst verschwinden sie im Kartenhintergrund
- Zum Sortieren dienen ein Hoch- und ein Runter-Pfeil pro Zeile, kein Ziehen
- Lässt sich eine Zeile bearbeiten, klappt der Bereich `.row__editor` direkt unter ihr auf. Es ist immer höchstens eine Zeile aufgeklappt

### Auswahl-Pillen

`.chips`: kleine Buttons (`.btn--small`) in IBM Plex Sans, die umbrechen dürfen. Für eine Auswahl aus vorhandenen Einträgen, zum Beispiel „Vorhandene Übung übernehmen“.

### Satzzeile

`.set-row` im laufenden Training: Satznummer, Zahlenfeld für das Gewicht, Zahlenfeld für die Wiederholungen, Haken. Über der ersten Zeile stehen einmal die Beschriftungen „kg“ und „Wdh“. Die Eingabe muss mit einer Hand schnell gehen:

- **Grau ist Vorschlag, hell ist eingetragen.** Die Felder zeigen die Werte vom letzten Mal als grauen Platzhalter. Erst was eingetragen ist, steht in heller Schrift und ist gespeichert
- **Ein Tipp auf den Haken** (`.check-btn`, 56 px) trägt den Vorschlag unverändert ein. Ein zweiter Tipp trägt den Satz wieder aus
- **Tippen in ein Feld** überschreibt den Vorschlag. Das Feld ist leer, es muss nichts gelöscht werden. Der andere Wert wird aus dem Vorschlag ergänzt
- Gewicht mit `inputmode="decimal"`, Wiederholungen mit `inputmode="numeric"`, Felder 64 px hoch
- Der eingetragene Haken ist **hell** (`--text`), nicht gelb: Auf einem Bildschirm stehen viele davon, Gelb bleibt „Training beenden“ vorbehalten
- Unter den Zeilen stehen „− Satz“ (entfernt die letzte Zeile) und „+ Satz“
- **Aufwärmsätze** (`.set-row--warmup`) stehen vor den Arbeitssätzen und sind dreifach markiert: Zwischenüberschrift „Aufwärmen“, ein „A“ statt der Satznummer, und Felder, die nur umrandet statt gefüllt sind. Darunter folgt die Zwischenüberschrift „Arbeitssätze“
- Die Felder müssen „142,5“ bei 375 px Breite vollständig zeigen. Darunter schrumpft die Schrift mit

### Hinweis

`.hint`: kleine Pille in `--surface-2` mit Pfeil-Icon und heller Schrift (13 px, Gewicht 600), linksbündig unter der Zeile „Letztes Mal“. Für dezente Empfehlungen wie „Gewicht erhöhen“. Bewusst nicht gelb: Der Hinweis ist ein Rat, keine Aktion, und er kann bei mehreren Übungen gleichzeitig stehen.

### Löschen mit Nachfrage

Löschen fragt immer nach, und zwar an Ort und Stelle: Der aufgeklappte Bereich der Zeile zeigt statt der Felder einen Satz, der genau sagt, was passiert, darunter „Abbrechen“ (`.btn--ghost`) und „Ja, löschen“ (`.btn--danger`). Kein Systemdialog, kein Overlay.

### Tab-Leiste

Schwebt als kompakte Pille mittig über dem Inhalt: höchstens 320 px breit, 64 px hoch, blau (`--tabbar-bg`) mit Schatten nach unten. Sie hat genau **zwei Tabs**, Training und Gewicht, jeweils mit Icon und Beschriftung. Der aktive Tab ist eine neongelbe Pille, der andere gedämpft. Weitere Tabs kommen nicht dazu: Neue Bereiche werden Unterseiten. Auf Unterseiten ist die Tab-Leiste ausgeblendet.

### Icons

Linien-Icons als SVG direkt im Code: Strichstärke 2 bis 2,25, runde Enden, Farbe über `currentColor`. Das Zahnrad stammt aus Feather Icons (MIT-Lizenz), die übrigen sind selbst gezeichnet. Keine Emojis, keine Icon-Schrift, keine gefüllten Icons, keine Icons von fremden Servern.

## Diagramme

Diagramme sind in gedämpftem Blau gehalten. Gelb bekommt nur der eine Wert, auf den es ankommt.

| Element | Klasse | Aussehen |
|---|---|---|
| Hilfslinien | `.chart__grid` | `#1a2550`, 1 px, nur waagrecht, höchstens drei |
| Einzelwerte | `.chart__mark` | Punkte oder Balken in `#4a5a9c` |
| Verlaufslinie | `.chart__line` | `#8f9bc9`, 2,5 px, runde Ecken |
| Wichtigster Wert | `.chart__highlight` | Neongelber Punkt, 6 px Radius, mit schwachem Hof (`.chart__halo`) |
| Achsentext | `.chart__axis` | 11 px, Großbuchstaben, `--text-faint` |

- Im Gewichtsdiagramm sind die Tageswerte gedämpfte Punkte, der 7-Tage-Durchschnitt ist die Linie, und nur der aktuelle Durchschnitt leuchtet gelb
- Im Fortschrittsdiagramm einer Übung leuchtet nur das letzte Training (oder die Bestleistung)
- Der hervorgehobene Wert steht zusätzlich als große Zahl über dem Diagramm
- Keine Legende, keine Flächenfüllung unter der Linie, keine senkrechten Hilfslinien, keine zweite Akzentfarbe

## Bewegung

Sparsam. Buttons geben beim Drücken kurz nach (80 ms). Keine Einblend-Animationen beim Seitenwechsel, keine hüpfenden Zahlen. Bei „Bewegung reduzieren“ in den iPhone-Einstellungen entfällt alles.

## Vor dem Fertigmelden prüfen

- In 390 px Breite angesehen, nichts ragt über den Rand. Bei Zahlen und Buttonzeilen zusätzlich in 320 px
- Genau ein Blickfang pro Bildschirm
- Höchstens ein gelber Button und eine gelbe Zahl
- Alle Farben, Abstände und Rundungen kommen aus den Variablen, keine frei gewählten Werte
- Tippflächen mindestens 44 px, Buttons 52 px, Eingabefelder mindestens 16 px Schrift
- Tab-Seite mit Zahnrad und Tab-Leiste, Unterseite mit Zurück-Pfeil und ohne Tab-Leiste
