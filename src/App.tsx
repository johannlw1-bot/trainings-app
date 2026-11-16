import { useEffect, useState, type ComponentType } from 'react';
import TabBar from './components/TabBar';
import { DEFAULT_TAB, type TabId } from './tabs';
import Training from './pages/Training';
import Plan from './pages/Plan';
import Gewicht from './pages/Gewicht';
import Mehr from './pages/Mehr';
import DesignMuster from './pages/DesignMuster';

/** Jede Route gehört zu einem Tab, der in der Tab-Leiste hervorgehoben wird. */
const ROUTES: Record<string, { page: ComponentType; tab: TabId }> = {
  training: { page: Training, tab: 'training' },
  plan: { page: Plan, tab: 'plan' },
  gewicht: { page: Gewicht, tab: 'gewicht' },
  mehr: { page: Mehr, tab: 'mehr' },
  design: { page: DesignMuster, tab: 'mehr' },
};

function routeFromHash(hash: string): string {
  const id = hash.replace(/^#\/?/, '').split('/')[0];
  return id in ROUTES ? id : DEFAULT_TAB;
}

export default function App() {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { page: Page, tab } = ROUTES[route];

  return (
    <div className="app">
      <main className="page">
        <Page />
      </main>
      <TabBar active={tab} />
    </div>
  );
}
