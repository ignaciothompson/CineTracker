import { describe, expect, it } from 'vitest';
import { buildEnrichPayload, suggestSeriesCategory } from './tmdbEnrich';

describe('suggestSeriesCategory', () => {
  it('returns Comedia when genre 35 present', () => {
    expect(suggestSeriesCategory([35, 18])).toBe('Comedia');
  });

  it('returns Seria otherwise', () => {
    expect(suggestSeriesCategory([18])).toBe('Seria');
    expect(suggestSeriesCategory(undefined)).toBe('Seria');
  });
});

describe('buildEnrichPayload', () => {
  it('adds category for series without one', () => {
    expect(
      buildEnrichPayload(
        { id: 1, poster_path: '/p.jpg', overview: 'Synopsis', genre_ids: [35] },
        'tv',
        '',
      ),
    ).toMatchObject({
      tmdb_id: 1,
      poster_path: '/p.jpg',
      overview: 'Synopsis',
      category: 'Comedia',
    });
  });

  it('does not overwrite existing category', () => {
    const payload = buildEnrichPayload(
      { id: 2, genre_ids: [35] },
      'tv',
      'Seria',
    );
    expect(payload.category).toBeUndefined();
  });

  it('skips category for movies', () => {
    const payload = buildEnrichPayload({ id: 3 }, 'movie', null);
    expect(payload.category).toBeUndefined();
  });
});
