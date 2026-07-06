import { describe, expect, it } from 'vitest';
import { buildEnrichPayload } from './tmdbEnrich';

describe('buildEnrichPayload', () => {
  it('adds genres for series without existing genres', () => {
    const payload = buildEnrichPayload(
      { id: 1, poster_path: '/p.jpg', overview: 'x', genre_ids: [35, 18] },
      'tv',
      null,
    );
    expect(payload).toMatchObject({
      tmdb_id: 1,
      genres: [
        { id: 35, name: 'Comedia' },
        { id: 18, name: 'Drama' },
      ],
    });
  });

  it('does not overwrite existing genres', () => {
    const payload = buildEnrichPayload(
      { id: 2, genre_ids: [35] },
      'tv',
      [{ id: 18, name: 'Drama' }],
    );
    expect(payload.genres).toBeUndefined();
  });

  it('adds genres for movies', () => {
    const payload = buildEnrichPayload({ id: 3, genre_ids: [878, 28] }, 'movie', []);
    expect(payload.genres).toEqual([
      { id: 878, name: 'Ciencia ficción' },
      { id: 28, name: 'Acción' },
    ]);
  });
});
