import { PageHeader } from '../components/PageHeader';

const dateFormat = new Intl.DateTimeFormat('de', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function Training() {
  return (
    <>
      <PageHeader label={dateFormat.format(new Date())} title="Training" />

      <div className="stack">
        <div>
          <a className="btn btn--small" href="#/plan">
            Plan bearbeiten
          </a>
        </div>

        <section className="card">
          <h2 className="heading">Noch keine Übungen</h2>
          <p className="muted">
            Lege zuerst im Plan fest, welche Übungen zu Oberkörper und Unterkörper gehören.
          </p>
        </section>
      </div>

      <section className="section">
        <h2 className="label">Vergangene Trainings</h2>
        <div className="card">
          <p className="muted">Noch keine Trainings.</p>
        </div>
      </section>
    </>
  );
}
