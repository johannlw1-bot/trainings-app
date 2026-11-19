import { formatTimer } from '../lib/duration';
import type { ExerciseStatus } from '../lib/exerciseTiming';
import Icon from './Icon';

export interface OverviewItem {
  id: number;
  name: string;
  status: ExerciseStatus;
  timeMs: number;
  workingSets: number;
}

const STATUS_TEXT: Record<ExerciseStatus, string> = {
  open: 'offen',
  current: 'aktuell',
  done: 'erledigt',
};

/** Kachel links: erledigt gelb mit Haken, aktuell gelb umrandet, offen dunkel. Darin die Nummer. */
function StatusTile({ status, number }: { status: ExerciseStatus; number: number }) {
  if (status === 'done') {
    return (
      <span className="icon-tile">
        <Icon name="check" strokeWidth={2.5} />
      </span>
    );
  }
  return <span className={status === 'current' ? 'icon-tile icon-tile--outline' : 'icon-tile icon-tile--muted'}>{number}</span>;
}

/** Übersicht aller Übungen des laufenden Trainings. Ein Tipp springt zur Übung. */
export default function WorkoutOverview({
  items,
  onPick,
  onClose,
  onFinish,
}: {
  items: OverviewItem[];
  onPick: (exerciseId: number) => void;
  onClose: () => void;
  onFinish: () => void;
}) {
  const done = items.filter((item) => item.status === 'done').length;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Übersicht">
      <div className="sheet__inner">
        <header className="session__top">
          <span />
          <button type="button" className="icon-btn" aria-label="Übersicht schließen" onClick={onClose}>
            <Icon name="close" className="icon-btn__icon" />
          </button>
        </header>
        <div>
          <h1 className="title">Übersicht</h1>
          <p className="label">
            {done} von {items.length} erledigt
          </p>
        </div>

        <ul className="item-list">
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className="item"
                aria-current={item.status === 'current' ? 'step' : undefined}
                onClick={() => onPick(item.id)}
              >
                <StatusTile status={item.status} number={index + 1} />
                <span className="item__main">
                  <span className="item__title">{item.name}</span>
                  <span className="item__sub">
                    {STATUS_TEXT[item.status]}
                    {item.workingSets > 0 && ` · ${item.workingSets} ${item.workingSets === 1 ? 'Satz' : 'Sätze'}`}
                  </span>
                </span>
                <span className="num num--m timer">{item.timeMs >= 1000 ? formatTimer(item.timeMs) : '–'}</span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn--block" onClick={onFinish}>
          Training beenden
        </button>
      </div>
    </div>
  );
}
