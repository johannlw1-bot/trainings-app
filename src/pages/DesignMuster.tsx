// Musterseite zu DESIGN.md. Alle Zahlen hier sind Beispielwerte, keine echten Daten.

const DAILY = [79.4, 79.1, 79.6, 78.9, 79.0, 78.6, 78.8, 78.3, 78.7, 78.2, 78.4, 77.9, 78.1, 77.8];
const AVERAGE = [79.4, 79.3, 79.4, 79.2, 79.2, 79.1, 79.1, 78.9, 78.8, 78.6, 78.6, 78.4, 78.3, 78.2];

const W = 320;
const H = 140;
const MIN = 77.5;
const MAX = 80;

const x = (i: number) => (i / (DAILY.length - 1)) * W;
const y = (value: number) => H - ((value - MIN) / (MAX - MIN)) * H;

function ExampleChart() {
  const last = AVERAGE.length - 1;
  return (
    <svg className="chart" viewBox={`0 -8 ${W} ${H + 32}`} role="img" aria-label="Beispieldiagramm">
      {[78, 79, 80].map((value) => (
        <line key={value} className="chart__grid" x1="0" x2={W} y1={y(value)} y2={y(value)} />
      ))}
      {DAILY.map((value, i) => (
        <circle key={i} className="chart__mark" cx={x(i)} cy={y(value)} r="3" />
      ))}
      <polyline className="chart__line" points={AVERAGE.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      <circle className="chart__halo" cx={x(last)} cy={y(AVERAGE[last])} r="12" />
      <circle className="chart__highlight" cx={x(last)} cy={y(AVERAGE[last])} r="6" />
      <text className="chart__axis" x="0" y={H + 20}>
        VOR 2 WOCHEN
      </text>
      <text className="chart__axis" x={W} y={H + 20} textAnchor="end">
        HEUTE
      </text>
    </svg>
  );
}

export default function DesignMuster() {
  return (
    <>
      <header className="page-header">
        <p className="label">Beispielwerte, keine echten Daten</p>
        <h1 className="title">Design-Muster</h1>
      </header>

      <div className="stack">
        <section className="card">
          <p className="label">Zahl XL · 7-Tage-Durchschnitt</p>
          <p className="num num--xl num--accent">
            78,2<span className="num__unit">kg</span>
          </p>
          <ExampleChart />
        </section>

        <section className="card">
          <p className="label">Breitentest · längste Werte</p>
          <p className="num num--xl">
            142,5<span className="num__unit">kg</span>
          </p>
          <div className="card__row">
            <p className="num num--l">
              142,5<span className="num__unit">kg</span>
            </p>
            <p className="num num--l">
              12<span className="num__unit">Wdh</span>
            </p>
          </div>
        </section>

        <section className="card">
          <p className="label">Karte mit Zahl L</p>
          <h2 className="heading">Bankdrücken</h2>
          <div className="card__row">
            <p className="num num--l">
              82,5<span className="num__unit">kg</span>
            </p>
            <p className="num num--l">
              8<span className="num__unit">Wdh</span>
            </p>
          </div>
          <p className="muted small">Letztes Mal: 80 kg × 8, 8, 7</p>
        </section>

        <section className="card">
          <p className="label">Zahl M</p>
          <div className="card__row">
            <p className="num num--m">
              80<span className="num__unit">kg</span>
            </p>
            <p className="num num--m">
              3<span className="num__unit">Sätze</span>
            </p>
            <p className="num num--m num--accent">
              +2,5<span className="num__unit">kg</span>
            </p>
          </div>
        </section>

        <section className="card">
          <p className="label">Buttons</p>
          <button type="button" className="btn btn--primary btn--block">
            Training starten
          </button>
          <button type="button" className="btn btn--block">
            Satz hinzufügen
          </button>
          <div className="card__row">
            <button type="button" className="btn btn--ghost">
              Abbrechen
            </button>
            <button type="button" className="btn btn--danger">
              Löschen
            </button>
          </div>
        </section>

        <section className="card">
          <label className="field">
            <span className="label">Eingabefeld</span>
            <input className="field__input" inputMode="decimal" placeholder="0,0" />
          </label>
        </section>

        <a className="btn btn--ghost" href="#/mehr">
          Zurück
        </a>
      </div>
    </>
  );
}
