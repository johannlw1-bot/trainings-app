// Karte „Abgleich“ in den Einstellungen: Anmelden per E-Mail-Code, Status, Abmelden.
// Dexie Cloud fragt über db.cloud.userInteraction nach E-Mail und Code (customLoginGui), die Fragen
// werden hier auf Deutsch gezeigt.
import { useState, type FormEvent } from 'react';
import type { DXCAlert, DXCUserInteraction, SyncState } from 'dexie-cloud-addon';
import { login, logout } from '../cloud';
import { db } from '../db';
import { useObservable } from './useObservable';

const ALERT_TEXT: Partial<Record<DXCAlert['messageCode'], string>> = {
  INVALID_EMAIL: 'Bitte gib eine gültige E-Mail-Adresse ein.',
  INVALID_OTP: 'Der Code stimmt nicht. Bitte prüfe ihn und versuche es noch einmal.',
  LICENSE_LIMIT_REACHED: 'Die Cloud-Datenbank hat keine freien Plätze für weitere Nutzer.',
  NO_SEATS_AVAILABLE: 'Die Cloud-Datenbank hat keine freien Plätze für weitere Nutzer.',
  USER_NOT_REGISTERED: 'Diese E-Mail-Adresse ist für die Cloud-Datenbank nicht freigeschaltet.',
  USER_NOT_ACCEPTED: 'Diese E-Mail-Adresse ist für die Cloud-Datenbank nicht freigeschaltet.',
  USER_DEACTIVATED: 'Dieses Konto ist deaktiviert.',
};

function alertText(alert: DXCAlert): string {
  if (alert.messageCode === 'OTP_SENT') {
    return `Wir haben dir einen Code an ${alert.messageParams.email ?? 'deine E-Mail-Adresse'} geschickt.`;
  }
  if (alert.messageCode === 'LOGOUT_CONFIRMATION') {
    const count = alert.messageParams.numUnsyncedChanges;
    return `${count} ${count === '1' ? 'Änderung ist' : 'Änderungen sind'} noch nicht abgeglichen und gehen beim Abmelden verloren.`;
  }
  const known = ALERT_TEXT[alert.messageCode];
  if (known) return known;
  // Unbekannte Meldung: den Text von Dexie Cloud zeigen, damit der Grund nicht verloren geht.
  const detail = alert.message.replace(/\{(\w+)\}/g, (_, name: string) => alert.messageParams[name] ?? '');
  return `Das hat nicht geklappt: ${detail}`;
}

/** Die Frage, die Dexie Cloud gerade stellt, als Formular. */
function Interaction({ ui }: { ui: DXCUserInteraction }) {
  const [value, setValue] = useState('');
  const alerts = ui.alerts.map((alert, i) => (
    <p key={i} className={alert.type === 'error' ? 'error' : 'muted'}>
      {alertText(alert)}
    </p>
  ));

  if (ui.type === 'logout-confirmation') {
    return (
      <div className="confirm">
        <p className="confirm__text">Trotzdem abmelden?</p>
        {alerts}
        <div className="confirm__buttons">
          <button type="button" className="btn btn--ghost" onClick={() => ui.onCancel()}>
            Abbrechen
          </button>
          <button type="button" className="btn btn--danger" onClick={() => ui.onSubmit({})}>
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  if (ui.type !== 'email' && ui.type !== 'otp') {
    return (
      <div className="stack">
        {alerts}
        <button type="button" className="btn btn--block" onClick={() => ui.onSubmit({})}>
          OK
        </button>
      </div>
    );
  }

  const isEmail = ui.type === 'email';
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;
    ui.onSubmit(isEmail ? { email: text } : { otp: text });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <p className="muted">
        {isEmail
          ? 'Du bekommst einen Code per E-Mail. Die Anmeldung ist nur einmal pro Gerät nötig.'
          : 'Gib den Code aus der E-Mail ein.'}
      </p>
      {alerts}
      <label className="field">
        <span className="label">{isEmail ? 'E-Mail-Adresse' : 'Code'}</span>
        {isEmail ? (
          <input
            className="field__input field__input--text"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        ) : (
          <input
            className="field__input field__input--text"
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
      </label>
      <div className="confirm__buttons">
        <button type="button" className="btn btn--ghost" onClick={() => ui.onCancel()}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn--primary" disabled={!value.trim()}>
          {isEmail ? 'Code senden' : 'Anmelden'}
        </button>
      </div>
    </form>
  );
}

function syncText(state: SyncState): string {
  if (state.phase === 'offline' || state.status === 'offline') {
    return 'Offline. Änderungen werden abgeglichen, sobald Internet da ist.';
  }
  if (state.phase === 'error' || state.status === 'error') {
    return 'Der Abgleich hat gerade nicht geklappt. Er wird automatisch wiederholt.';
  }
  if (state.phase === 'in-sync') return 'Alles abgeglichen.';
  return 'Gleicht ab …';
}

export default function CloudCard() {
  const user = useObservable(db.cloud.currentUser);
  const ui = useObservable(db.cloud.userInteraction);
  const syncState = useObservable(db.cloud.syncState);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLogin = () => {
    setError(null);
    login().catch((reason: unknown) => {
      // Abbrechen ist kein Fehler.
      if (reason instanceof Error && reason.name === 'AbortError') return;
      console.error('Anmeldung fehlgeschlagen', reason);
      setError('Die Anmeldung hat nicht geklappt. Bitte versuche es noch einmal.');
    });
  };

  const startLogout = () => {
    setConfirmingLogout(false);
    setError(null);
    logout().catch((reason: unknown) => {
      // Bei der Nachfrage zu nicht abgeglichenen Änderungen „Abbrechen“ gewählt.
      if (reason instanceof Error && /cancel/i.test(reason.message)) return;
      console.error('Abmelden fehlgeschlagen', reason);
      setError('Das Abmelden hat nicht geklappt.');
    });
  };

  let body;
  if (ui) {
    // key: Nach der E-Mail kommt der Code, das Feld soll dann leer sein.
    body = <Interaction key={ui.type} ui={ui} />;
  } else if (user.isLoggedIn) {
    body = confirmingLogout ? (
      <div className="confirm">
        <p className="confirm__text">
          Abmelden? Die Daten auf diesem Gerät werden entfernt, in der Cloud bleiben sie erhalten.
        </p>
        <div className="confirm__buttons">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingLogout(false)}>
            Abbrechen
          </button>
          <button type="button" className="btn btn--danger" onClick={startLogout}>
            Abmelden
          </button>
        </div>
      </div>
    ) : (
      <>
        <div>
          <p className="label">Angemeldet als</p>
          <p className="cloud__user">{user.email ?? user.name ?? user.userId}</p>
        </div>
        <p className="muted">{syncText(syncState)}</p>
        <button type="button" className="btn btn--block" onClick={() => setConfirmingLogout(true)}>
          Abmelden
        </button>
      </>
    );
  } else {
    body = (
      <>
        <p className="muted">
          Melde dich an, um deine Daten zwischen iPhone und Mac abzugleichen. Ohne Anmeldung bleiben sie
          nur auf diesem Gerät. Offline geht alles weiter, abgeglichen wird, sobald Internet da ist.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={user.isLoading}
          onClick={startLogin}
        >
          Anmelden
        </button>
      </>
    );
  }

  return (
    <section className="card stack">
      <h2 className="heading">Abgleich</h2>
      {body}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
