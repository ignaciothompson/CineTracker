import type { TmdbGenre } from '../types';

/** Mapas TMDB es-ES — TV y movie tienen IDs distintos. */
export const TMDB_TV_GENRES: Record<number, string> = {
  10759: 'Acción y aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  10762: 'Kids',
  9648: 'Misterio',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

export const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia ficción',
  10770: 'Película de TV',
  53: 'Suspenso',
  10752: 'Guerra',
  37: 'Western',
};

export function normalizeGenre(raw: unknown): TmdbGenre | null {
  if (typeof raw === 'string' && raw.trim()) {
    return { id: 0, name: raw.trim() };
  }
  if (raw && typeof raw === 'object' && 'name' in raw) {
    const g = raw as { id?: number; name?: string };
    const name = String(g.name || '').trim();
    if (!name) return null;
    return { id: Number(g.id) || 0, name };
  }
  return null;
}

export function normalizeGenresList(raw: unknown): TmdbGenre[] {
  if (!Array.isArray(raw)) return [];
  const out: TmdbGenre[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const g = normalizeGenre(item);
    if (!g) continue;
    const key = `${g.id}:${g.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
  }
  return out;
}

export function genreIdsToGenres(
  ids: number[] | undefined,
  mediaType: 'tv' | 'movie',
): TmdbGenre[] {
  if (!ids?.length) return [];
  const map = mediaType === 'tv' ? TMDB_TV_GENRES : TMDB_MOVIE_GENRES;
  const out: TmdbGenre[] = [];
  const seen = new Set<number>();
  for (const id of ids) {
    const name = map[id];
    if (!name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
  }
  return out;
}

export function genresFromTmdbDetails(
  genres: { id: number; name: string }[] | undefined,
): TmdbGenre[] {
  if (!genres?.length) return [];
  return normalizeGenresList(genres);
}

export function genreKey(g: TmdbGenre) {
  return `${g.id}:${g.name}`;
}
