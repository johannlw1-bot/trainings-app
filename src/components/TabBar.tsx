import type { ReactElement } from 'react';
import { TABS, type TabId } from '../tabs';

const ICONS: Record<TabId, ReactElement> = {
  // Hantel
  training: <path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" />,
  // Liste
  plan: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  // Verlaufslinie
  gewicht: <path d="M3 17l5-5 4 3 8-8M15 7h5v5" />,
  // Drei Punkte
  mehr: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
};

export default function TabBar({ active }: { active: TabId }) {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={`#/${tab.id}`}
          className="tabbar__tab"
          aria-label={tab.label}
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
          <span className="tabbar__label">{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
