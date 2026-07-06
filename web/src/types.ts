export interface TmdbGenre {
  id: number;
  name: string;
}

export type WatchStatus = 'pendientes' | 'viendo' | 'visto' | 'abandonadas';
export type MediaKind = 'tv' | 'movie';
export type MediaTab = 'todo' | 'tv' | 'movie';
export type RecommendationFeedback = 'sin_calificar' | 'buena' | 'mala';
export type ViewId =
  | 'viendo'
  | 'pendientes'
  | 'visto'
  | 'abandonadas'
  | 'todo'
  | 'listas'
  | 'importar'
  | 'stats'
  | 'chat';

export interface Season {
  season_number: number;
  episode_count: number;
  watched_episodes: number[];
}

export interface SeriesRecord {
  id: string;
  title: string;
  watch_status?: WatchStatus;
  is_favorite?: boolean;
  seasons?: Season[];
  rating?: number | null;
  poster_path?: string;
  overview?: string;
  tmdb_id?: number;
  genres?: TmdbGenre[];
  tvtime_uuid?: string;
  tvdb_id?: number | null;
  imdb_id?: string | null;
  year?: number;
  watched_at?: string;
  updated?: string;
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
  genres?: TmdbGenre[];
  tvtime_uuid?: string;
  tvdb_id?: number | null;
  imdb_id?: string | null;
  rewatch_count?: number;
  watched_at?: string;
  updated?: string;
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
  anthropic_api_key?: string;
  anthropic_model?: string;
}

export interface RefItem {
  kind: MediaKind;
  id: string;
  title: string;
}

export interface SeedContext {
  last_watched: RefItem[];
  genres: TmdbGenre[];
  reference_titles: RefItem[];
}

export interface AiRecommendationRecord {
  id: string;
  seed_context?: SeedContext;
  recommendation_text?: string;
  chosen_title?: string;
  feedback?: RecommendationFeedback;
  created?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  kind: MediaKind;
  watch_status?: WatchStatus;
  rating?: number | null;
  poster_path?: string;
  overview?: string;
  year?: number | null;
  seasons?: Season[];
  genres?: TmdbGenre[];
  updated?: string;
  watched_at?: string;
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
  Exclude<ViewId, 'listas' | 'stats' | 'chat'>,
  { title: string; sub: string }
> = {
  viendo: { title: 'Viendo', sub: 'Lo que tenés arrancado ahora mismo.' },
  pendientes: { title: 'Pendientes', sub: 'En la fila, esperando su turno.' },
  visto: { title: 'Visto', sub: 'Terminado. Con calificación cuando la tengas.' },
  abandonadas: { title: 'Abandonadas', sub: 'Arrancaste pero no seguiste. Lo marcás vos a mano.' },
  todo: { title: 'Toda la biblioteca', sub: 'Todo lo que trackeaste, en un solo lugar.' },
};

export const MEDIA_TABS: { id: MediaTab; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'tv', label: 'Series' },
  { id: 'movie', label: 'Películas' },
];

export const NAV_ITEMS: { id: ViewId; label: string; showCount?: boolean }[] = [
  { id: 'viendo', label: 'Viendo', showCount: true },
  { id: 'pendientes', label: 'Pendientes', showCount: true },
  { id: 'visto', label: 'Visto', showCount: true },
  { id: 'abandonadas', label: 'Abandonadas', showCount: true },
  { id: 'todo', label: 'Toda la biblioteca', showCount: true },
  { id: 'listas', label: 'Listas' },
  { id: 'importar', label: 'Importar TV Time' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'chat', label: 'Chat IA' },
];
