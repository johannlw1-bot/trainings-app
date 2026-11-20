import { goBack } from '../nav';
import Icon from './Icon';

/**
 * Kopf der Startseite: optional klein und grau eine Zeile darüber (der Gruß), dann der Titel
 * in einer eigenen Zeile ohne Umbruch (der Name), darunter grau die Beschriftung, rechts das Zahnrad.
 */
export function PageHeader({ overline, label, title }: { overline?: string; label: string; title: string }) {
  return (
    <header className="page-header page-header--row">
      <div className="page-header__text--row">
        {overline && <p className="label page-header__overline">{overline}</p>}
        <h1 className="title title--nowrap">{title}</h1>
        <p className="label">{label}</p>
      </div>
      <a className="icon-btn" href="#/einstellungen" aria-label="Einstellungen">
        <Icon name="gear" className="icon-btn__icon" />
      </a>
    </header>
  );
}

/** Kopf einer Unterseite: Zurück-Pfeil, darunter Titel und grau die Beschriftung. */
export function SubpageHeader({
  label,
  title,
  fallback = '#/',
}: {
  label: string;
  title: string;
  /** Wohin der Pfeil führt, wenn die Seite direkt aufgerufen wurde. */
  fallback?: string;
}) {
  return (
    <header className="page-header">
      <button
        type="button"
        className="icon-btn page-header__back"
        aria-label="Zurück"
        onClick={() => goBack(fallback)}
      >
        <Icon name="back" className="icon-btn__icon" />
      </button>
      <div className="page-header__text">
        <h1 className="title">{title}</h1>
        <p className="label">{label}</p>
      </div>
    </header>
  );
}
