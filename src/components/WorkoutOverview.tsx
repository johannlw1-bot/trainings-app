import { formatTimer } from '../lib/duration';
import type { ExerciseStatus } from '../lib/exerciseTiming';

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
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Übersicht">
      <div className="sheet__inner">
        <header className="session__top">
          <p className="label">Übersicht</p>
          <button type="button" className="icon-btn" aria-label="Übersicht schließen" onClick={onClose}>
            <svg className="icon-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <section className="card">
          <ul className="rows">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="row row--button"
                  aria-current={item.status === 'current' ? 'step' : undefined}
                  onClick={() => onPick(item.id)}
                >
                  <span className={`ring__dot ring__dot--${item.status}`} aria-hidden="true" />
                  <span className="row__main">
                    <span className="row__name">
                      {index + 1}. {item.name}
                    </span>
                    <span className="muted small">
                      {STATUS_TEXT[item.status]}
                      {item.workingSets > 0 &&
                        ` · ${item.workingSets} ${item.workingSets === 1 ? 'Satz' : 'Sätze'}`}
                    </span>
                  </span>
                  <span className="num num--m">{item.timeMs > 0 ? formatTimer(item.timeMs) : '–'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <button type="button" className="btn btn--block" onClick={onFinish}>
          Training beenden
        </button>
      </div>
    </div>
  );
}
