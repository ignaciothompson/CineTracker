import type { LibraryItem, MediaKind, MediaTab, MovieRecord, Season, SeriesRecord, WatchStatus } from '../types';
import { normalizeGenresList } from './tmdbGenres';
import type { TmdbGenre } from '../types';

export function unifiedLibrary(series: SeriesRecord[], movies: MovieRecord[]): LibraryItem[] {
  const s = series.map((r) => ({
    id: r.id,
    title: r.title,
    kind: 'tv' as const,
    watch_status: r.watch_status,
    rating: r.rating,
    poster_path: r.poster_path,
    overview: r.overview,
    seasons: r.seasons,
    genres: normalizeGenresList(r.genres),
    updated: r.updated,
    watched_at: r.watched_at,
  }));
  const m = movies.map((r) => ({
    id: r.id,
    title: r.title,
    kind: 'movie' as const,
    watch_status: r.watch_status,
    rating: r.rating,
    poster_path: r.poster_path,
    overview: r.overview,
    year: r.year,
    genres: normalizeGenresList(r.genres),
    updated: r.updated,
    watched_at: r.watched_at,
  }));
  return [...s, ...m];
}

export function countByStatus(lib: LibraryItem[]) {
  return {
    viendo: lib.filter((l) => l.watch_status === 'viendo').length,
    pendientes: lib.filter((l) => l.watch_status === 'pendientes').length,
    visto: lib.filter((l) => l.watch_status === 'visto').length,
    abandonadas: lib.filter((l) => l.watch_status === 'abandonadas').length,
    todo: lib.length,
  };
}

export function computeWatchStatus(seasons: Season[]): WatchStatus {
  const visible = visibleSeasons(seasons);
  const totalEps = visible.reduce((a, s) => a + s.episode_count, 0);
  const watchedEps = visible.reduce((a, s) => a + (s.watched_episodes?.length || 0), 0);
  if (watchedEps === 0) return 'pendientes';
  if (watchedEps < totalEps) return 'viendo';
  return 'visto';
}

export function collectionForKind(kind: MediaKind) {
  return kind === 'tv' ? 'series' : 'movies';
}

export function visibleSeasons(seasons: Season[] | undefined): Season[] {
  if (!seasons) return [];
  return seasons.filter((s) => s.season_number >= 1);
}

export function isSeasonFullyWatched(season: Season): boolean {
  if (season.episode_count <= 0) return false;
  const watched = new Set(season.watched_episodes || []);
  for (let i = 1; i <= season.episode_count; i++) {
    if (!watched.has(i)) return false;
  }
  return true;
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

/** Últimos títulos con estado "visto" (máx 5), por watched_at. */
export function getRecentWatched(library: LibraryItem[], limit = 5) {
  return library
    .filter((l) => l.watch_status === 'visto')
    .sort((a, b) =>
      (b.watched_at || b.updated || '').localeCompare(a.watched_at || a.updated || ''),
    )
    .slice(0, limit)
    .map((l) => ({ kind: l.kind, id: l.id, title: l.title }));
}

/** Solo títulos ya vistos — referencias "parecido a X". */
export function getReferenceCandidates(library: LibraryItem[]) {
  return library.filter((l) => l.watch_status === 'visto');
}

export function libraryGenres(library: LibraryItem[]): TmdbGenre[] {
  const map = new Map<string, TmdbGenre>();
  for (const item of library) {
    for (const g of item.genres || []) {
      map.set(`${g.id}:${g.name.toLowerCase()}`, g);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function itemMatchesGenres(item: LibraryItem, selected: string[]) {
  if (!selected.length) return true;
  const names = (item.genres || []).map((g) => g.name);
  return selected.some((name) => names.includes(name));
}

export function topGenres(library: LibraryItem[], limit = 8) {
  const counts = new Map<string, number>();
  for (const item of library) {
    for (const g of item.genres || []) {
      counts.set(g.name, (counts.get(g.name) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}
