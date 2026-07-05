import { describe, expect, it } from 'vitest';
import { buildListItem, isItemInList, listItemRef } from './lists';
import type { ListRecord } from '../types';

const list: ListRecord = {
  id: 'l1',
  name: 'Acción',
  items: [
    { name: 'Dune', type: 'movie', uuid: 'abc', custom_order: 0 },
    { name: 'Breaking Bad', type: 'series', uuid: 'xyz', custom_order: 1 },
  ],
};

describe('listItemRef', () => {
  it('uses tvtime_uuid when present', () => {
    expect(listItemRef('movie', { id: 'pb1', tvtime_uuid: 'abc' })).toEqual({
      uuid: 'abc',
      type: 'movie',
    });
  });

  it('falls back to pocketbase id', () => {
    expect(listItemRef('tv', { id: 'pb1' })).toEqual({
      uuid: 'pb1',
      type: 'series',
    });
  });
});

describe('isItemInList', () => {
  it('detects existing movie by uuid', () => {
    expect(isItemInList(list, 'movie', { id: 'pb99', tvtime_uuid: 'abc' })).toBe(true);
  });

  it('returns false for items not in list', () => {
    expect(isItemInList(list, 'movie', { id: 'missing' })).toBe(false);
  });
});

describe('buildListItem', () => {
  it('creates TV Time compatible item', () => {
    expect(buildListItem('movie', { id: 'pb1', title: 'Inception' }, 3)).toEqual({
      name: 'Inception',
      type: 'movie',
      uuid: 'pb1',
      custom_order: 3,
    });
  });
});
