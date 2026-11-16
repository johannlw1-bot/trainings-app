export const TABS = [
  { id: 'training', label: 'Training' },
  { id: 'plan', label: 'Plan' },
  { id: 'gewicht', label: 'Gewicht' },
  { id: 'mehr', label: 'Mehr' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export const DEFAULT_TAB: TabId = 'training';
