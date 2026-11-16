import { SubpageHeader } from '../components/PageHeader';

export default function Einstellungen() {
  return (
    <>
      <SubpageHeader label="Daten und Backup" title="Einstellungen" />

      <section className="card">
        <h2 className="heading">Backup</h2>
        <p className="muted">
          Deine Daten liegen nur auf diesem Gerät. Export und Import als Datei kommen in einem
          späteren Schritt.
        </p>
      </section>
    </>
  );
}
