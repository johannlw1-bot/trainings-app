import { useState } from 'react';
import { SubpageHeader } from '../components/PageHeader';
import type { Split } from '../db';

const LISTS: { split: Split; label: string; days: string }[] = [
  { split: 'upper', label: 'Oberkörper', days: 'Mo · Do' },
  { split: 'lower', label: 'Unterkörper', days: 'Di · Fr' },
];

export default function Plan() {
  const [split, setSplit] = useState<Split>('upper');
  const current = LISTS.find((list) => list.split === split)!;

  return (
    <>
      <SubpageHeader label="Zwei Listen, vier Tage" title="Plan" />

      <div className="stack">
        <div className="segmented" role="group" aria-label="Liste wählen">
          {LISTS.map((list) => (
            <button
              key={list.split}
              type="button"
              className="segmented__option"
              aria-pressed={list.split === split}
              onClick={() => setSplit(list.split)}
            >
              {list.label}
              <small>{list.days}</small>
            </button>
          ))}
        </div>

        <section className="card">
          <p className="label">{current.days}</p>
          <h2 className="heading">{current.label}</h2>
          <p className="muted">Diese Liste ist noch leer.</p>
        </section>
      </div>
    </>
  );
}
