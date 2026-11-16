import { PageHeader } from '../components/PageHeader';

export default function Gewicht() {
  return (
    <>
      <PageHeader label="Körpergewicht" title="Gewicht" />

      <section className="card">
        <h2 className="heading">Noch kein Eintrag</h2>
        <p className="muted">
          Sobald du dein Gewicht einträgst, stehen hier dein 7-Tage-Durchschnitt und der Verlauf.
        </p>
      </section>
    </>
  );
}
