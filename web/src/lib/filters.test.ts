import { describe, expect, it } from 'vitest';
import { filterLibraryItems } from './filters';
import type { LibraryItem } from '../types';

const g = (name: string, id = 0) => ({ id, name });

const items: LibraryItem[] = [
  { id: '1', title: 'Breaking Bad', kind: 'tv', watch_status: 'viendo', genres: [g('Drama', 18)] },
  { id: '2', title: 'Brooklyn Nine-Nine', kind: 'tv', watch_status: 'viendo', genres: [g('Comedia', 35)] },
  { id: '3', title: 'Dune', kind: 'movie', watch_status: 'visto', genres: [g('Ciencia ficción', 878)] },
];

describe('filterLibraryItems', () => {
  it('filters by view when not todo', () => {
    expect(filterLibraryItems(items, 'visto', 'todo')).toHaveLength(1);
    expect(filterLibraryItems(items, 'visto', 'todo')[0].title).toBe('Dune');
  });

  it('filters by media tab', () => {
    expect(filterLibraryItems(items, 'todo', 'movie')).toHaveLength(1);
    expect(filterLibraryItems(items, 'todo', 'tv')).toHaveLength(2);
  });

  it('combines view and media tab filters', () => {
    expect(filterLibraryItems(items, 'viendo', 'tv')).toEqual([items[0], items[1]]);
  });

  it('returns all items for todo + todo tab', () => {
    expect(filterLibraryItems(items, 'todo', 'todo')).toHaveLength(3);
  });

  it('filters by search query on title', () => {
    expect(filterLibraryItems(items, 'todo', 'todo', 'brook')).toEqual([items[1]]);
    expect(filterLibraryItems(items, 'viendo', 'todo', 'bad')).toEqual([items[0]]);
  });

  it('filters by genre names', () => {
    expect(filterLibraryItems(items, 'todo', 'todo', '', ['Comedia'])).toEqual([items[1]]);
    expect(filterLibraryItems(items, 'todo', 'todo', '', ['Drama', 'Comedia'])).toHaveLength(2);
  });

  it('filters abandonadas view', () => {
    const withDropped: LibraryItem[] = [
      ...items,
      { id: '4', title: 'Lost Interest', kind: 'tv', watch_status: 'abandonadas' },
    ];
    expect(filterLibraryItems(withDropped, 'abandonadas', 'todo')).toHaveLength(1);
    expect(filterLibraryItems(withDropped, 'abandonadas', 'todo')[0].title).toBe('Lost Interest');
  });

  it('search is case insensitive', () => {
    expect(filterLibraryItems(items, 'todo', 'todo', 'DUNE')).toEqual([items[2]]);
  });
});
