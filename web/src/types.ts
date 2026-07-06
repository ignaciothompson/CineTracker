export type WatchStatus = 'pendientes' | 'viendo' | 'visto';
export type Category = 'Seria' | 'Comedia' | 'Pelicula';
export type MediaKind = 'tv' | 'movie';
export type ViewId =
  | 'viendo'
  | 'pendientes'
  | 'visto'
  | 'todo'
  | 'listas'
  | 'importar'
  | 'stats'
  | 'recomendaciones';

export interface Season {
  season_number: number;
  episode_count: number;
  watched_episodes: number[];
}

export interface SeriesRecord {
  id: string;
  title: string;
  category?: Category | '';
  watch_status?: WatchStatus;
  is_favorite?: boolean;
  seasons?: Season[];
  rating?: number | null;
  poster_path?: string;
  overview?: string;
  tmdb_id?: number;
  tvtime_uuid?: string;
  tvdb_id?: number | null;
  imdb_id?: string | null;
  year?: number;
}

export interface MovieRecord {
  id: string;
  title: string;
  year?: number | null;
  watch_status?: WatchStatus;
  is_favorite?: boolean;
  rating?: number | null;
  poster_path?: string;
  overview?: string;
  tmdb_id?: number;
  tvtime_uuid?: string;
  tvdb_id?: number | null;
  imdb_id?: string | null;
  rewatch_count?: number;
}

export interface ListItem {
  name: string;
  type?: 'movie' | 'series' | 'tv';
  uuid?: string;
  custom_order?: number;
}

export interface ListRecord {
  id: string;
  name: string;
  description?: string;
  items?: ListItem[];
}

export interface SettingsRecord {
  id: string;
  tmdb_api_key?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  kind: MediaKind;
  category: Category;
  watch_status?: WatchStatus;
  rating?: number | null;
  poster_path?: string;
  overview?: string;
  year?: number | null;
  seasons?: Season[];
}

export interface TmdbSearchResult {
  id: number;
  media_type: 'tv' | 'movie';
  name?: string;
  title?: string;
  poster_path?: string;
  first_air_date?: string;
  release_date?: string;
}

export interface DetailTarget {
  kind: MediaKind;
  id: string;
}

export const VIEW_META: Record<
  Exclude<ViewId, 'listas' | 'stats' | 'recomendaciones'>,
  { title: string; sub: string }
> = {
  viendo: { title: 'Viendo', sub: 'Lo que tenés arrancado ahora mismo.' },
  pendientes: { title: 'Pendientes', sub: 'En la fila, esperando su turno.' },
  visto: { title: 'Visto', sub: 'Terminado. Con calificación cuando la tengas.' },
  todo: { title: 'Toda la biblioteca', sub: 'Todo lo que trackeaste, en un solo lugar.' },
};

export const CATEGORY_FILTERS: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'Seria', label: 'Seria' },
  { id: 'Comedia', label: 'Comedia' },
  { id: 'Pelicula', label: 'Películas' },
];

export const NAV_ITEMS: { id: ViewId; label: string; showCount?: boolean }[] = [
  { id: 'viendo', label: 'Viendo', showCount: true },
  { id: 'pendientes', label: 'Pendientes', showCount: true },
  { id: 'visto', label: 'Visto', showCount: true },
  { id: 'todo', label: 'Toda la biblioteca', showCount: true },
  { id: 'listas', label: 'Listas' },
  { id: 'importar', label: 'Importar TV Time' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'recomendaciones', label: 'Recomendaciones IA' },
];
