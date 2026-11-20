import { useSyncExternalStore } from 'react';
import { dataVersionStore } from '../cloud';

/**
 * Zählt hoch, sobald ein Abgleich mit Dexie Cloud fertig ist. In die Abhängigkeiten des Ladens
 * aufnehmen, dann zeigt die Seite Daten vom anderen Gerät, ohne neu geöffnet zu werden.
 */
export function useDataVersion(): number {
  return useSyncExternalStore(dataVersionStore.subscribe, dataVersionStore.get);
}
