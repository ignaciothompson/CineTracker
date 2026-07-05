import type {
  LibraryItem,
  MediaKind,
  MovieRecord,
  Season,
  SeriesRecord,
  WatchStatus,
} from '../types';

export function unifiedLibrary(series: SeriesRecord[], movies: MovieRecord[]): LibraryItem[] {
  const s = series.map((r) => ({
    id: r.id,
    title: r.title,
    kind: 'tv' as const,
    category: (r.category || 'Seria') as LibraryItem['category'],
    watch_status: r.watch_status,
    rating: r.rating,
    poster_path: r.poster_path,
    overview: r.overview,
    seasons: r.seasons,
  }));
  const m = movies.map((r) => ({
    id: r.id,
    title: r.title,
    kind: 'movie' as const,
    category: 'Pelicula' as const,
    watch_status: r.watch_status,
    rating: r.rating,
    poster_path: r.poster_path,
    overview: r.overview,
    year: r.year,
  }));
  return [...s, ...m];
}

export function countByStatus(lib: LibraryItem[]) {
  return {
    viendo: lib.filter((l) => l.watch_status === 'viendo').length,
    pendientes: lib.filter((l) => l.watch_status === 'pendientes').length,
    visto: lib.filter((l) => l.watch_status === 'visto').length,
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

/** Excluye temporada 0 / specials de TV Time. */
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
