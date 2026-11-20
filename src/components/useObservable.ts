import { useCallback, useSyncExternalStore } from 'react';

/** Ein Wert, der sich ändern kann, wie die BehaviorSubjects von Dexie Cloud (db.cloud.currentUser …). */
interface ObservableValue<T> {
  readonly value: T;
  subscribe(next: (value: T) => void): { unsubscribe(): void };
}

/** Liest den aktuellen Wert und zeichnet bei jeder Änderung neu. */
export function useObservable<T>(observable: ObservableValue<T>): T {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const subscription = observable.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [observable],
  );
  return useSyncExternalStore(subscribe, () => observable.value);
}
