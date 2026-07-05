import { useCallback, useEffect, useMemo, useState } from 'react';
import { pb } from '../lib/pocketbase';
import {
  collectionForKind,
  computeWatchStatus,
  countByStatus,
  unifiedLibrary,
} from '../lib/library';
import { tmdbDetails } from '../lib/tmdb';
import type {
  LibraryItem,
  ListRecord,
  ListItem,
  MovieRecord,
  MediaKind,
  SeriesRecord,
} from '../types';
import { buildListItem, isItemInList, listItemRef } from '../lib/lists';

export function useLibrary(tmdbKey: string | null) {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<SeriesRecord[]>([]);
  const [movies, setMovies] = useState<MovieRecord[]>([]);
  const [lists, setLists] = useState<ListRecord[]>([]);

  const reloadLibrary = useCallback(async () => {
    let s: SeriesRecord[] = [];
    let m: MovieRecord[] = [];
    let l: ListRecord[] = [];
    try {
      s = await pb.collection('series').getFullList({ sort: '-id' });
    } catch {
      /* empty */
    }
    try {
      m = await pb.collection('movies').getFullList({ sort: '-id' });
    } catch {
      /* empty */
    }
    try {
      l = await pb.collection('lists').getFullList({ sort: '-id' });
    } catch {
      /* empty */
    }
    setSeries(s);
    setMovies(m);
    setLists(l);
  }, []);

  useEffect(() => {
    (async () => {
      await reloadLibrary();
      setLoading(false);
    })();
  }, [reloadLibrary]);

  const library = useMemo(() => unifiedLibrary(series, movies), [series, movies]);
  const counts = useMemo(() => countByStatus(library), [library]);

  const addFromTmdb = useCallback(
    async (tmdbId: number, type: 'tv' | 'movie') => {
      if (!tmdbKey) return;
      const details = await tmdbDetails(tmdbKey, tmdbId, type);
      const genreIds = (details.genres || []).map((g: { id: number }) => g.id);
      const category = genreIds.includes(35) ? 'Comedia' : 'Seria';

      if (type === 'tv') {
        const seasons = (details.seasons || [])
          .filter((s: { season_number: number }) => s.season_number > 0)
          .map((s: { season_number: number; episode_count: number }) => ({
            season_number: s.season_number,
            episode_count: s.episode_count,
            watched_episodes: [],
          }));
        await pb.collection('series').create({
          title: details.name,
          tmdb_id: tmdbId,
          poster_path: details.poster_path || '',
          overview: details.overview || '',
          category,
          watch_status: 'pendientes',
          is_favorite: false,
          seasons,
        });
      } else {
        await pb.collection('movies').create({
          title: details.title,
          year: details.release_date ? parseInt(details.release_date.split('-')[0], 10) : null,
          tmdb_id: tmdbId,
          poster_path: details.poster_path || '',
          overview: details.overview || '',
          watch_status: 'pendientes',
          is_favorite: false,
          rewatch_count: 0,
        });
      }
      await reloadLibrary();
    },
    [reloadLibrary, tmdbKey],
  );

  const updateField = useCallback(
    async (kind: LibraryItem['kind'], id: string, field: string, value: unknown) => {
      await pb.collection(collectionForKind(kind)).update(id, { [field]: value });
      await reloadLibrary();
    },
    [reloadLibrary],
  );

  const toggleEpisode = useCallback(
    async (id: string, seasonNum: number, epNum: number) => {
      const item = series.find((s) => s.id === id);
      if (!item?.seasons) return;
      const seasons = structuredClone(item.seasons);
      const season = seasons.find((s) => s.season_number === seasonNum);
      if (!season) return;
      const idx = season.watched_episodes.indexOf(epNum);
      if (idx >= 0) season.watched_episodes.splice(idx, 1);
      else season.watched_episodes.push(epNum);
      const watch_status = computeWatchStatus(seasons);
      await pb.collection('series').update(id, { seasons, watch_status });
      await reloadLibrary();
    },
    [reloadLibrary, series],
  );

  const toggleSeasonWatch = useCallback(
    async (id: string, seasonNum: number) => {
      const item = series.find((s) => s.id === id);
      if (!item?.seasons) return;
      const seasons = structuredClone(item.seasons);
      const season = seasons.find((s) => s.season_number === seasonNum);
      if (!season || season.episode_count <= 0) return;

      const allEps = Array.from({ length: season.episode_count }, (_, i) => i + 1);
      const fullyWatched = allEps.every((n) => season.watched_episodes.includes(n));
      season.watched_episodes = fullyWatched ? [] : allEps;

      const watch_status = computeWatchStatus(seasons);
      await pb.collection('series').update(id, { seasons, watch_status });
      await reloadLibrary();
    },
    [reloadLibrary, series],
  );

  const deleteItem = useCallback(
    async (kind: LibraryItem['kind'], id: string) => {
      await pb.collection(collectionForKind(kind)).delete(id);
      await reloadLibrary();
    },
    [reloadLibrary],
  );

  const createList = useCallback(
    async (name: string, description = '') => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      await pb.collection('lists').create({
        name: trimmed,
        description: description.trim(),
        is_public: false,
        items: [],
      });
      await reloadLibrary();
      return true;
    },
    [reloadLibrary],
  );

  const deleteList = useCallback(
    async (id: string) => {
      await pb.collection('lists').delete(id);
      await reloadLibrary();
    },
    [reloadLibrary],
  );

  const addToList = useCallback(
    async (
      listId: string,
      kind: MediaKind,
      record: { id: string; title: string; tvtime_uuid?: string },
    ) => {
      const list = lists.find((l) => l.id === listId);
      if (!list || isItemInList(list, kind, record)) return false;

      const items: ListItem[] = structuredClone(list.items || []);
      items.push(buildListItem(kind, record, items.length));
      await pb.collection('lists').update(listId, { items });
      await reloadLibrary();
      return true;
    },
    [lists, reloadLibrary],
  );

  const removeFromList = useCallback(
    async (
      listId: string,
      kind: MediaKind,
      record: { id: string; tvtime_uuid?: string },
    ) => {
      const list = lists.find((l) => l.id === listId);
      if (!list) return false;

      const ref = listItemRef(kind, record);
      const items = (list.items || [])
        .filter((i) => !(i.uuid === ref.uuid && i.type === ref.type))
        .map((i, idx) => ({ ...i, custom_order: idx }));

      await pb.collection('lists').update(listId, { items });
      await reloadLibrary();
      return true;
    },
    [lists, reloadLibrary],
  );

  return {
    loading,
    series,
    movies,
    lists,
    library,
    counts,
    reloadLibrary,
    addFromTmdb,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
    createList,
    deleteList,
    addToList,
    removeFromList,
  };
}
