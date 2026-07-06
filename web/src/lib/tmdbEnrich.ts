import { pb } from './pocketbase';
import { genreIdsToGenres, normalizeGenresList } from './tmdbGenres';
import type { TmdbGenre } from '../types';

const TMDB_FIND = 'https://api.themoviedb.org/3/find';
const ENRICH_DELAY_MS = 50;

export interface TmdbFindMatch {
  id: number;
  poster_path?: string | null;
  overview?: string;
  genre_ids?: number[];
}

export interface EnrichableRecord {
  id: string;
  title: string;
  tmdb_id?: number | null;
  tvdb_id?: number | null;
  imdb_id?: string | null;
  genres?: TmdbGenre[] | null;
}

export interface EnrichStats {
  updated: number;
  skipped: number;
  noMatch: number;
  failed: number;
  errors: string[];
}

export interface EnrichProgress {
  label: string;
  current: number;
  total: number;
}

export function buildEnrichPayload(
  match: TmdbFindMatch,
  mediaType: 'tv' | 'movie',
  existingGenres?: TmdbGenre[] | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    tmdb_id: match.id,
    poster_path: match.poster_path || '',
    overview: match.overview || '',
  };
  if (!normalizeGenresList(existingGenres).length) {
    payload.genres = genreIdsToGenres(match.genre_ids, mediaType);
  }
  return payload;
}

export async function findByExternalId(
  apiKey: string,
  extId: string | number,
  source: 'tvdb_id' | 'imdb_id',
  mediaType: 'tv' | 'movie',
): Promise<TmdbFindMatch | null> {
  const url = `${TMDB_FIND}/${encodeURIComponent(String(extId))}?api_key=${apiKey}&external_source=${source}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const bucket = mediaType === 'tv' ? 'tv_results' : 'movie_results';
  const results = (data[bucket] || []) as TmdbFindMatch[];
  return results[0] ?? null;
}

async function resolveMatch(
  apiKey: string,
  item: EnrichableRecord,
  mediaType: 'tv' | 'movie',
): Promise<TmdbFindMatch | null> {
  if (item.tvdb_id) {
    const match = await findByExternalId(apiKey, item.tvdb_id, 'tvdb_id', mediaType);
    if (match) return match;
  }
  if (item.imdb_id) {
    return findByExternalId(apiKey, item.imdb_id, 'imdb_id', mediaType);
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichCollection(
  apiKey: string,
  collection: 'series' | 'movies',
  mediaType: 'tv' | 'movie',
  items: EnrichableRecord[],
  onProgress?: (progress: EnrichProgress) => void,
): Promise<EnrichStats> {
  const stats: EnrichStats = {
    updated: 0,
    skipped: 0,
    noMatch: 0,
    failed: 0,
    errors: [],
  };

  const pending = items.filter((item) => !item.tmdb_id);
  const label = mediaType === 'tv' ? 'Series TMDB' : 'Películas TMDB';

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    onProgress?.({ label, current: i + 1, total: pending.length });

    try {
      const match = await resolveMatch(apiKey, item, mediaType);
      if (!match) {
        stats.noMatch += 1;
      } else {
        const payload = buildEnrichPayload(match, mediaType, item.genres);
        await pb.collection(collection).update(item.id, payload);
        stats.updated += 1;
      }
    } catch (err) {
      stats.failed += 1;
      stats.errors.push(
        `${item.title}: ${err instanceof Error ? err.message : 'error'}`,
      );
    }

    if (i < pending.length - 1) await sleep(ENRICH_DELAY_MS);
  }

  stats.skipped = items.length - pending.length;
  return stats;
}

export async function enrichLibrary(
  apiKey: string,
  series: EnrichableRecord[],
  movies: EnrichableRecord[],
  onProgress?: (progress: EnrichProgress) => void,
): Promise<{ label: string; stats: EnrichStats }[]> {
  const results: { label: string; stats: EnrichStats }[] = [];

  if (series.length) {
    const stats = await enrichCollection(apiKey, 'series', 'tv', series, onProgress);
    results.push({ label: 'Series', stats });
  }

  if (movies.length) {
    const stats = await enrichCollection(apiKey, 'movies', 'movie', movies, onProgress);
    results.push({ label: 'Películas', stats });
  }

  return results;
}

export function countPendingEnrich(series: EnrichableRecord[], movies: EnrichableRecord[]) {
  return {
    series: series.filter((s) => !s.tmdb_id).length,
    movies: movies.filter((m) => !m.tmdb_id).length,
    total: [...series, ...movies].filter((i) => !i.tmdb_id).length,
  };
}
