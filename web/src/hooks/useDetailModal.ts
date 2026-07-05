import { useCallback, useState } from 'react';
import type { DetailTarget, LibraryItem, MovieRecord, SeriesRecord } from '../types';

export function useDetailModal(series: SeriesRecord[], movies: MovieRecord[]) {
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const openDetail = useCallback((kind: LibraryItem['kind'], id: string) => {
    const exists =
      kind === 'tv'
        ? series.some((s) => s.id === id)
        : movies.some((m) => m.id === id);
    if (!exists) return;
    setDetail({ kind, id });
  }, [movies, series]);

  const closeDetail = useCallback(() => {
    setDetail(null);
  }, []);

  const getDetailItem = useCallback(() => {
    if (!detail) return undefined;
    return detail.kind === 'tv'
      ? series.find((s) => s.id === detail.id)
      : movies.find((m) => m.id === detail.id);
  }, [detail, movies, series]);

  return { detail, openDetail, closeDetail, getDetailItem };
}
