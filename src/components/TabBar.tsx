import { TABS, type TabId } from '../tabs';
import Icon, { type IconName } from './Icon';

const ICONS: Record<TabId, IconName> = {
  training: 'dumbbell',
  gewicht: 'trend',
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
          <Icon name={ICONS[tab.id]} className="tabbar__icon" strokeWidth={2.25} />
          <span>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
