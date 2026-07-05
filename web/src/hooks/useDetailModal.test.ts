import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDetailModal } from './useDetailModal';
import type { MovieRecord, SeriesRecord } from '../types';

const series: SeriesRecord[] = [{ id: 's1', title: 'Elite' }];
const movies: MovieRecord[] = [{ id: 'm1', title: 'Dune', year: 2021 }];

describe('useDetailModal', () => {
  it('opens detail only when id exists in library', () => {
    const { result } = renderHook(() => useDetailModal(series, movies));

    act(() => result.current.openDetail('tv', 's1'));
    expect(result.current.detail).toEqual({ kind: 'tv', id: 's1' });
    expect(result.current.getDetailItem()?.title).toBe('Elite');

    act(() => result.current.openDetail('tv', 'missing'));
    expect(result.current.detail).toEqual({ kind: 'tv', id: 's1' });
  });

  it('closes detail and resolves movie item', () => {
    const { result } = renderHook(() => useDetailModal(series, movies));

    act(() => result.current.openDetail('movie', 'm1'));
    expect(result.current.getDetailItem()?.title).toBe('Dune');

    act(() => result.current.closeDetail());
    expect(result.current.detail).toBeNull();
    expect(result.current.getDetailItem()).toBeUndefined();
  });
});
