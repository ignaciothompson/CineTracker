import { pb } from './pocketbase';
import { computeWatchStatus } from './library';
import type { Season, WatchStatus } from '../types';

interface TvTimeEpisode {
  number: number;
  special?: boolean;
  is_watched?: boolean;
}

interface TvTimeSeason {
  number?: number;
  is_specials?: boolean;
  episodes?: TvTimeEpisode[];
}

export interface TvTimeSeriesExport {
  uuid?: string;
  title?: string;
  status?: string;
  is_favorite?: boolean;
  seasons?: TvTimeSeason[];
  id?: { tvdb?: number; imdb?: string | null };
}

export interface TvTimeMovieExport {
  uuid?: string;
  title?: string;
  year?: number | null;
  is_watched?: boolean;
  watched_at?: string | null;
  is_favorite?: boolean;
  rewatch_count?: number;
  id?: { tvdb?: number; imdb?: string | null };
}

export interface TvTimeListExport {
  id?: string;
  name?: string;
  description?: string;
  is_public?: boolean;
  items?: unknown[];
}

export interface ImportStats {
  ok: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface ImportProgress {
  label: string;
  current: number;
  total: number;
}

export function normalizeSeasonsFromExport(seasonsRaw: TvTimeSeason[]): Season[] {
  const simplified: Season[] = [];
  for (const s of seasonsRaw) {
    const num = s.number;
    if (num === undefined || num === null || num < 1) continue;
    if (s.is_specials) continue;

    let eps = (s.episodes || []).filter((e) => !e.special);
    if (!eps.length) eps = s.episodes || [];

    const watchedNums = eps.filter((e) => e.is_watched).map((e) => e.number);
    simplified.push({
      season_number: num,
      episode_count: eps.length,
      watched_episodes: watchedNums,
    });
  }
  return simplified;
}

export function watchStatusFromSeasons(seasonsRaw: TvTimeSeason[]): {
  status: WatchStatus;
  seasons: Season[];
} {
  const seasons = normalizeSeasonsFromExport(seasonsRaw);
  return { status: computeWatchStatus(seasons), seasons };
}

async function fetchExistingUuids(collection: 'series' | 'movies' | 'lists'): Promise<Set<string>> {
  const existing = new Set<string>();
  let page = 1;
  while (true) {
    const data = await pb.collection(collection).getList(page, 500, { fields: 'tvtime_uuid' });
    for (const item of data.items) {
      const uid = item.tvtime_uuid as string | undefined;
      if (uid) existing.add(uid);
    }
    if (page >= data.totalPages) break;
    page += 1;
  }
  return existing;
}

export async function importSeriesFromExport(
  data: TvTimeSeriesExport[],
  skipExisting: boolean,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportStats> {
  const stats: ImportStats = { ok: 0, skipped: 0, failed: 0, errors: [] };
  const existing = skipExisting ? await fetchExistingUuids('series') : new Set<string>();

  for (let i = 0; i < data.length; i++) {
    const s = data[i];
    onProgress?.({ label: 'Series', current: i + 1, total: data.length });

    const uuid = s.uuid || '';
    if (skipExisting && uuid && existing.has(uuid)) {
      stats.skipped += 1;
      continue;
    }

    const { status, seasons } = watchStatusFromSeasons(s.seasons || []);
    try {
      await pb.collection('series').create({
        tvtime_uuid: uuid,
        tvdb_id: s.id?.tvdb,
        imdb_id: s.id?.imdb || '',
        title: s.title || 'Sin título',
        tvtime_status: s.status || '',
        watch_status: status,
        is_favorite: Boolean(s.is_favorite),
        seasons,
      });
      stats.ok += 1;
      if (uuid) existing.add(uuid);
    } catch (err) {
      stats.failed += 1;
      stats.errors.push(`${s.title || uuid}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  return stats;
}

export async function importMoviesFromExport(
  data: TvTimeMovieExport[],
  skipExisting: boolean,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportStats> {
  const stats: ImportStats = { ok: 0, skipped: 0, failed: 0, errors: [] };
  const existing = skipExisting ? await fetchExistingUuids('movies') : new Set<string>();

  for (let i = 0; i < data.length; i++) {
    const m = data[i];
    onProgress?.({ label: 'Películas', current: i + 1, total: data.length });

    const uuid = m.uuid || '';
    if (skipExisting && uuid && existing.has(uuid)) {
      stats.skipped += 1;
      continue;
    }

    try {
      await pb.collection('movies').create({
        tvtime_uuid: uuid,
        tvdb_id: m.id?.tvdb,
        imdb_id: m.id?.imdb || '',
        title: m.title || 'Sin título',
        year: m.year,
        watch_status: m.is_watched ? 'visto' : 'pendientes',
        watched_at: m.watched_at || null,
        is_favorite: Boolean(m.is_favorite),
        rewatch_count: m.rewatch_count ?? 0,
      });
      stats.ok += 1;
      if (uuid) existing.add(uuid);
    } catch (err) {
      stats.failed += 1;
      stats.errors.push(`${m.title || uuid}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  return stats;
}

export async function importListsFromExport(
  data: TvTimeListExport[],
  skipExisting: boolean,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportStats> {
  const stats: ImportStats = { ok: 0, skipped: 0, failed: 0, errors: [] };
  const existing = skipExisting ? await fetchExistingUuids('lists') : new Set<string>();

  for (let i = 0; i < data.length; i++) {
    const l = data[i];
    onProgress?.({ label: 'Listas', current: i + 1, total: data.length });

    const uuid = l.id || '';
    if (skipExisting && uuid && existing.has(uuid)) {
      stats.skipped += 1;
      continue;
    }

    try {
      await pb.collection('lists').create({
        tvtime_uuid: uuid,
        name: l.name || 'Sin título',
        description: l.description || '',
        is_public: Boolean(l.is_public),
        items: l.items || [],
      });
      stats.ok += 1;
      if (uuid) existing.add(uuid);
    } catch (err) {
      stats.failed += 1;
      stats.errors.push(`${l.name || uuid}: ${err instanceof Error ? err.message : 'error'}`);
    }
  }

  return stats;
}

export async function parseJsonFile<T>(file: File): Promise<T> {
  const text = await file.text();
  return JSON.parse(text) as T;
}

export function formatImportStats(label: string, stats: ImportStats): string {
  return `${label}: ${stats.ok} ok, ${stats.skipped} skip, ${stats.failed} error`;
}
