export type TvTimeImportKind = 'series' | 'movies' | 'lists';

export interface TvTimeImportSlotConfig {
  kind: TvTimeImportKind;
  label: string;
  hint: string;
  icon: string;
  accent: string;
}

export const TVTIME_IMPORT_SLOTS: TvTimeImportSlotConfig[] = [
  {
    kind: 'series',
    label: 'Series',
    hint: 'tvtime-series-*.json',
    icon: '📺',
    accent: 'var(--seria)',
  },
  {
    kind: 'movies',
    label: 'Películas',
    hint: 'tvtime-movies-*.json',
    icon: '🎬',
    accent: 'var(--comedia)',
  },
  {
    kind: 'lists',
    label: 'Listas',
    hint: 'tvtime-lists-*.json',
    icon: '📋',
    accent: 'var(--progress)',
  },
];
