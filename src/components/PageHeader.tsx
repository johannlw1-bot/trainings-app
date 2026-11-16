import type { ReactNode } from 'react';
import { goBack } from '../nav';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon-btn__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Kopf der beiden Tab-Seiten: Beschriftung, Titel und rechts das Zahnrad zu den Einstellungen. */
export function PageHeader({ label, title }: { label: string; title: string }) {
  return (
    <header className="page-header page-header--row">
      <div>
        <p className="label">{label}</p>
        <h1 className="title">{title}</h1>
      </div>
      <a className="icon-btn" href="#/einstellungen" aria-label="Einstellungen">
        <Icon>
          {/* Zahnrad aus Feather Icons (MIT-Lizenz) */}
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Icon>
      </a>
    </header>
  );
}

/** Kopf einer Unterseite: Zurück-Pfeil, darunter Beschriftung und Titel. */
export function SubpageHeader({
  label,
  title,
  fallback = '#/training',
}: {
  label: string;
  title: string;
  /** Wohin der Pfeil führt, wenn die Seite direkt aufgerufen wurde. */
  fallback?: string;
}) {
  return (
    <header className="page-header">
      <button type="button" className="icon-btn" aria-label="Zurück" onClick={() => goBack(fallback)}>
        <Icon>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </Icon>
      </button>
      <div className="page-header__text">
        <p className="label">{label}</p>
        <h1 className="title">{title}</h1>
      </div>
    </header>
  );
}
