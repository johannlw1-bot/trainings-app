import { useEffect, useState, type ComponentType } from 'react';
import TabBar from './components/TabBar';
import { noteNavigation } from './nav';
import { DEFAULT_TAB, type TabId } from './tabs';
import Training from './pages/Training';
import Gewicht from './pages/Gewicht';
import Plan from './pages/Plan';
import ExerciseDetail from './pages/ExerciseDetail';
import Einstellungen from './pages/Einstellungen';

export interface PageProps {
  /** Zweiter Teil der Adresse, z. B. die Übungs-ID in #/uebung/12 */
  param?: string;
}

/**
 * Tab-Seiten haben `tab` gesetzt und zeigen die Tab-Leiste.
 * Unterseiten haben keinen Tab: Sie zeigen oben einen Zurück-Pfeil und keine Tab-Leiste.
 */
const ROUTES: Record<string, { page: ComponentType<PageProps>; tab?: TabId }> = {
  training: { page: Training, tab: 'training' },
  gewicht: { page: Gewicht, tab: 'gewicht' },
  plan: { page: Plan },
  uebung: { page: ExerciseDetail },
  einstellungen: { page: Einstellungen },
};

function parseHash(hash: string): { route: string; param?: string } {
  const [route, param] = hash.replace(/^#\/?/, '').split('/');
  return route in ROUTES ? { route, param } : { route: DEFAULT_TAB };
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

  const { page: Page, tab } = ROUTES[location.route];

  return (
    <div className="app">
      <main className={tab ? 'page' : 'page page--sub'}>
        <Page param={location.param} />
      </main>
      {tab && <TabBar active={tab} />}
    </div>
  );
}
