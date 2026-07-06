import { describe, expect, it } from 'vitest';
import {
  collectionForKind,
  computeWatchStatus,
  countByStatus,
  getRecentWatched,
  unifiedLibrary,
  visibleSeasons,
  isSeasonFullyWatched,
} from './library';
import type { MovieRecord, SeriesRecord } from '../types';

const seriesFixture: SeriesRecord[] = [
  {
    id: 's1',
    title: 'The Bear',
    watch_status: 'viendo',
    genres: ['Comedia'],
    seasons: [
      { season_number: 1, episode_count: 8, watched_episodes: [1, 2, 3] },
    ],
    updated: '2026-07-01',
  },
  {
    id: 's2',
    title: 'Elite',
    watch_status: 'visto',
    genres: ['Drama'],
    watched_at: '2026-07-02',
  },
];

const moviesFixture: MovieRecord[] = [
  {
    id: 'm1',
    title: 'Megamind',
    watch_status: 'visto',
    year: 2010,
    rating: 8,
    watched_at: '2026-07-05',
  },
  {
    id: 'm2',
    title: 'Dune',
    watch_status: 'pendientes',
    year: 2021,
  },
];

describe('unifiedLibrary', () => {
  it('merges series and movies with correct kind', () => {
    const lib = unifiedLibrary(seriesFixture, moviesFixture);

    expect(lib).toHaveLength(4);
    expect(lib[0]).toMatchObject({ id: 's1', kind: 'tv', genres: [{ id: 0, name: 'Comedia' }] });
    expect(lib[2]).toMatchObject({ id: 'm1', kind: 'movie' });
  });
});

describe('countByStatus', () => {
  it('counts watch_status buckets and total', () => {
    const lib = unifiedLibrary(seriesFixture, moviesFixture);
    expect(countByStatus(lib)).toEqual({
      viendo: 1,
      pendientes: 1,
      visto: 2,
      abandonadas: 0,
      todo: 4,
    });
  });
});

describe('getRecentWatched', () => {
  it('returns up to 5 visto items sorted by watched_at', () => {
    const lib = unifiedLibrary(seriesFixture, moviesFixture);
    const recent = getRecentWatched(lib, 5);
    expect(recent.map((r) => r.title)).toEqual(['Megamind', 'Elite']);
  });
});

describe('computeWatchStatus', () => {
  it('returns pendientes when no episodes watched', () => {
    expect(
      computeWatchStatus([{ season_number: 1, episode_count: 10, watched_episodes: [] }]),
    ).toBe('pendientes');
  });

  it('returns viendo when partially watched', () => {
    expect(
      computeWatchStatus([{ season_number: 1, episode_count: 10, watched_episodes: [1, 2] }]),
    ).toBe('viendo');
  });

  it('returns visto when all episodes watched across seasons', () => {
    expect(
      computeWatchStatus([
        { season_number: 1, episode_count: 2, watched_episodes: [1, 2] },
        { season_number: 2, episode_count: 1, watched_episodes: [1] },
      ]),
    ).toBe('visto');
  });
});

describe('visibleSeasons', () => {
  it('filters out season 0 / specials bucket from TV Time', () => {
    const seasons = [
      { season_number: 0, episode_count: 1, watched_episodes: [] },
      { season_number: 1, episode_count: 8, watched_episodes: [1] },
    ];
    expect(visibleSeasons(seasons)).toEqual([seasons[1]]);
  });
});

describe('isSeasonFullyWatched', () => {
  it('returns true only when every episode is watched', () => {
    expect(
      isSeasonFullyWatched({ season_number: 1, episode_count: 3, watched_episodes: [1, 2, 3] }),
    ).toBe(true);
    expect(
      isSeasonFullyWatched({ season_number: 1, episode_count: 3, watched_episodes: [1, 2] }),
    ).toBe(false);
  });
});

describe('collectionForKind', () => {
  it('maps media kind to PocketBase collection name', () => {
    expect(collectionForKind('tv')).toBe('series');
    expect(collectionForKind('movie')).toBe('movies');
  });
});

describe('countByStatus edge cases', () => {
  it('handles empty library', () => {
    expect(countByStatus([])).toEqual({
      viendo: 0,
      pendientes: 0,
      visto: 0,
      abandonadas: 0,
      todo: 0,
    });
  });

  it('counts abandonadas bucket', () => {
    const lib = unifiedLibrary(
      [{ id: 's1', title: 'Dropped', watch_status: 'abandonadas' }],
      [],
    );
    expect(countByStatus(lib).abandonadas).toBe(1);
  });
});
