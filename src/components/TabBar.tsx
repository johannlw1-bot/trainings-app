import type { ReactElement } from 'react';
import { TABS, type TabId } from '../tabs';

const ICONS: Record<TabId, ReactElement> = {
  // Hantel
  training: <path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" />,
  // Verlaufslinie
  gewicht: <path d="M3 17l5-5 4 3 8-8M15 7h5v5" />,
};

export default function TabBar({ active }: { active: TabId }) {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={`#/${tab.id}`}
          className="tabbar__tab"
          aria-current={tab.id === active ? 'page' : undefined}
        >
          <svg
            className="tabbar__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[tab.id]}
          </svg>
          <span>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
