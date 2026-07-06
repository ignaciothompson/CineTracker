import type { TmdbSearchResult } from '../types';

export function tmdbImg(path: string | undefined, size = 'w342') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
}

export async function tmdbSearch(apiKey: string, query: string): Promise<TmdbSearchResult[]> {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=es-ES`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB search failed');
  const data = await res.json();
  return (data.results || []).filter(
    (r: TmdbSearchResult) => r.media_type === 'tv' || r.media_type === 'movie',
  );
}

export async function tmdbDetails(apiKey: string, id: number, type: 'tv' | 'movie') {
  const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=es-ES`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB details failed');
  return res.json();
}
