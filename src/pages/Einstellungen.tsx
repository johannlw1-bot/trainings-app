import Icon from '../components/Icon';
import { SubpageHeader } from '../components/PageHeader';

export default function Einstellungen() {
  return (
    <>
      <SubpageHeader label="Plan, Daten und Backup" title="Einstellungen" />

      <div className="stack">
        <ul className="item-list">
          <li>
            <a className="item" href="#/plan">
              <span className="icon-tile">
                <Icon name="edit" />
              </span>
              <span className="item__main">
                <span className="item__title">Trainingsplan</span>
                <span className="item__sub">Oberkörper und Unterkörper bearbeiten</span>
              </span>
              <Icon name="chevron" className="item__chevron" />
            </a>
          </li>
        </ul>

        <section className="card">
          <h2 className="heading">Backup</h2>
          <p className="muted">
            Deine Daten liegen nur auf diesem Gerät. Export und Import als Datei kommen in einem
            späteren Schritt.
          </p>
        </section>
      </div>
    </>
  );
}
