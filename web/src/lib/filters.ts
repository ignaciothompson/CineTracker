import type { LibraryItem, MediaTab, ViewId } from '../types';
import { itemMatchesGenres } from './library';

const LIBRARY_VIEWS = new Set<ViewId>(['viendo', 'pendientes', 'visto', 'abandonadas', 'todo']);

export function isLibraryView(view: ViewId): boolean {
  return LIBRARY_VIEWS.has(view);
}

export function filterLibraryItems(
  library: LibraryItem[],
  view: ViewId,
  mediaTab: MediaTab,
  searchQuery = '',
  genreFilter: string[] = [],
) {
  let items = library;
  if (view !== 'todo') items = items.filter((l) => l.watch_status === view);
  if (mediaTab === 'tv') items = items.filter((l) => l.kind === 'tv');
  if (mediaTab === 'movie') items = items.filter((l) => l.kind === 'movie');
  if (genreFilter.length) items = items.filter((l) => itemMatchesGenres(l, genreFilter));

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    items = items.filter((l) => l.title.toLowerCase().includes(q));
  }

  return items;
}
