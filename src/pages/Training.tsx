const dateFormat = new Intl.DateTimeFormat('de', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function Training() {
  return (
    <>
      <header className="page-header">
        <p className="label">{dateFormat.format(new Date())}</p>
        <h1 className="title">Training</h1>
      </header>

      <section className="card">
        <h2 className="heading">Noch keine Übungen</h2>
        <p className="muted">
          Lege zuerst im Plan fest, welche Übungen zu Oberkörper und Unterkörper gehören.
        </p>
        <a className="btn btn--primary btn--block" href="#/plan">
          Zum Plan
        </a>
      </section>
    </>
  );
}
