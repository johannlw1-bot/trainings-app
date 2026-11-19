import { useEffect, useState, type ComponentType } from 'react';
import { noteNavigation } from './nav';
import Uebersicht from './pages/Uebersicht';
import Gewicht from './pages/Gewicht';
import Plan from './pages/Plan';
import ExerciseDetail from './pages/ExerciseDetail';
import Einstellungen from './pages/Einstellungen';
import Verlauf from './pages/Verlauf';
import WorkoutSession from './pages/WorkoutSession';
import Auswertung from './pages/Auswertung';

export interface PageProps {
  /** Zweiter Teil der Adresse, z. B. die Übungs-ID in #/uebung/12 */
  param?: string;
  /** Dritter Teil der Adresse, z. B. „neu“ in #/auswertung/7/neu */
  extra?: string;
}

/**
 * Startseite ist die Übersicht unter `#/` (Schlüssel ''). Alle anderen Seiten sind Unterseiten
 * mit Zurück-Pfeil. Eine Tab-Leiste gibt es nicht.
 * `fullscreen` (Trainingsansicht) bekommt den ganzen Bildschirm ohne Seitenrahmen.
 */
const HOME = '';

const ROUTES: Record<string, { page: ComponentType<PageProps>; fullscreen?: boolean }> = {
  [HOME]: { page: Uebersicht },
  gewicht: { page: Gewicht },
  plan: { page: Plan },
  uebung: { page: ExerciseDetail },
  einstellungen: { page: Einstellungen },
  verlauf: { page: Verlauf },
  einheit: { page: WorkoutSession, fullscreen: true },
  auswertung: { page: Auswertung },
};

function parseHash(hash: string): { route: string; param?: string; extra?: string } {
  const [route, param, extra] = hash.replace(/^#\/?/, '').split('/');
  return route in ROUTES ? { route, param, extra } : { route: HOME };
}

export default function App() {
  const [location, setLocation] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      noteNavigation();
      setLocation(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { page: Page, fullscreen } = ROUTES[location.route];
  // Schlüssel aus der ganzen Adresse: Ein Wechsel von #/auswertung/1 zu /2 baut die Seite neu auf.
  const key = `${location.route}/${location.param ?? ''}/${location.extra ?? ''}`;

  if (fullscreen) {
    return (
      <div className="app">
        <Page key={key} param={location.param} extra={location.extra} />
      </div>
    );
  }

  return (
    <div className="app">
      <main className="page">
        <Page key={key} param={location.param} extra={location.extra} />
      </main>
    </div>
  );
}
