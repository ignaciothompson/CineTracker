import type { Category, LibraryItem, ViewId } from '../types';

const LIBRARY_VIEWS = new Set<ViewId>(['viendo', 'pendientes', 'visto', 'todo']);

export function isLibraryView(view: ViewId): boolean {
  return LIBRARY_VIEWS.has(view);
}

export function filterLibraryItems(
  library: LibraryItem[],
  view: ViewId,
  catFilter: Category | 'all',
  searchQuery = '',
) {
  let items = library;
  if (view !== 'todo') items = items.filter((l) => l.watch_status === view);
  if (catFilter !== 'all') items = items.filter((l) => l.category === catFilter);

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    items = items.filter((l) => l.title.toLowerCase().includes(q));
  }

  return items;
}
