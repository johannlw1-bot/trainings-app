export const TABS = [
  { id: 'training', label: 'Training' },
  { id: 'gewicht', label: 'Gewicht' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export const DEFAULT_TAB: TabId = 'training';
