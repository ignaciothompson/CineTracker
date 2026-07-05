import { describe, expect, it } from 'vitest';
import { filterLibraryItems } from './filters';
import type { LibraryItem } from '../types';

const items: LibraryItem[] = [
  { id: '1', title: 'Breaking Bad', kind: 'tv', category: 'Seria', watch_status: 'viendo' },
  { id: '2', title: 'Brooklyn Nine-Nine', kind: 'tv', category: 'Comedia', watch_status: 'viendo' },
  { id: '3', title: 'Dune', kind: 'movie', category: 'Pelicula', watch_status: 'visto' },
];

describe('filterLibraryItems', () => {
  it('filters by view when not todo', () => {
    expect(filterLibraryItems(items, 'visto', 'all')).toHaveLength(1);
    expect(filterLibraryItems(items, 'visto', 'all')[0].title).toBe('Dune');
  });

  it('filters by category', () => {
    expect(filterLibraryItems(items, 'todo', 'Comedia')).toHaveLength(1);
    expect(filterLibraryItems(items, 'todo', 'Comedia')[0].title).toBe('Brooklyn Nine-Nine');
  });

  it('combines view and category filters', () => {
    expect(filterLibraryItems(items, 'viendo', 'Seria')).toEqual([
      items[0],
    ]);
  });

  it('returns all items for todo + all', () => {
    expect(filterLibraryItems(items, 'todo', 'all')).toHaveLength(3);
  });

  it('filters by search query on title', () => {
    expect(filterLibraryItems(items, 'todo', 'all', 'brook')).toEqual([items[1]]);
    expect(filterLibraryItems(items, 'viendo', 'all', 'bad')).toEqual([items[0]]);
  });

  it('search is case insensitive', () => {
    expect(filterLibraryItems(items, 'todo', 'all', 'DUNE')).toEqual([items[2]]);
  });
});
