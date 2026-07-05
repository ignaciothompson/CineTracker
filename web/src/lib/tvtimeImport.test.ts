import { describe, expect, it } from 'vitest';
import { normalizeSeasonsFromExport, watchStatusFromSeasons } from './tvtimeImport';

describe('normalizeSeasonsFromExport', () => {
  it('skips season 0 and specials', () => {
    const seasons = normalizeSeasonsFromExport([
      {
        number: 0,
        is_specials: true,
        episodes: [{ number: 23, special: true, is_watched: false }],
      },
      {
        number: 1,
        is_specials: false,
        episodes: [
          { number: 1, special: false, is_watched: true },
          { number: 2, special: false, is_watched: false },
        ],
      },
    ]);
    expect(seasons).toEqual([
      { season_number: 1, episode_count: 2, watched_episodes: [1] },
    ]);
  });
});

describe('watchStatusFromSeasons', () => {
  it('returns visto when all episodes watched', () => {
    const { status } = watchStatusFromSeasons([
      {
        number: 1,
        is_specials: false,
        episodes: [{ number: 1, special: false, is_watched: true }],
      },
    ]);
    expect(status).toBe('visto');
  });

  it('returns viendo when partially watched', () => {
    const { status } = watchStatusFromSeasons([
      {
        number: 1,
        is_specials: false,
        episodes: [
          { number: 1, special: false, is_watched: true },
          { number: 2, special: false, is_watched: false },
        ],
      },
    ]);
    expect(status).toBe('viendo');
  });
});
