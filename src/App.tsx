import { useEffect, useState, type ComponentType } from 'react';
import TabBar from './components/TabBar';
import { DEFAULT_TAB, TABS, type TabId } from './tabs';
import Training from './pages/Training';
import Plan from './pages/Plan';
import Gewicht from './pages/Gewicht';
import Mehr from './pages/Mehr';

const PAGES: Record<TabId, ComponentType> = {
  training: Training,
  plan: Plan,
  gewicht: Gewicht,
  mehr: Mehr,
};

function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#\/?/, '').split('/')[0];
  return TABS.some((tab) => tab.id === id) ? (id as TabId) : DEFAULT_TAB;
}

export default function App() {
  const [tab, setTab] = useState<TabId>(() => tabFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const Page = PAGES[tab];

  return (
    <div className="app">
      <main className="page">
        <Page />
      </main>
      <TabBar active={tab} />
    </div>
  );
}
