import { useEffect, useState } from 'react';
import { useDetailContext, useLibraryContext, useNavigationContext } from '../context/AppContext';
import { filterLibraryItems } from '../lib/filters';
import { TicketCard } from './TicketCard';
import { EmptyState } from './EmptyState';
import './TicketGrid.css';

const PAGE_SIZE = 60;
const PAGINATE_THRESHOLD = 100;

export function TicketGrid() {
  const { library, updateField } = useLibraryContext();
  const { currentView, mediaTab, genreFilter, searchQuery } = useNavigationContext();
  const { openDetail } = useDetailContext();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const items = filterLibraryItems(library, currentView, mediaTab, searchQuery, genreFilter);
  const paginate = items.length > PAGINATE_THRESHOLD;
  const visibleItems = paginate ? items.slice(0, visibleCount) : items;
  const hasMore = paginate && visibleCount < items.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [currentView, mediaTab, genreFilter, searchQuery]);

  if (!items.length) {
    const text = searchQuery.trim()
      ? 'Nada coincide con tu búsqueda.'
      : 'Nada acá todavía.';
    return <EmptyState icon="🎬" text={text} />;
  }

  return (
    <>
      <div className="grid">
        {visibleItems.map((item) => (
          <TicketCard
            key={`${item.kind}-${item.id}`}
            item={item}
            onOpen={() => openDetail(item.kind, item.id)}
            onMarkWatched={
              item.kind === 'movie'
                ? () => void updateField('movie', item.id, 'watch_status', 'visto')
                : undefined
            }
          />
        ))}
      </div>
      {hasMore ? (
        <div className="grid-load-more">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Cargar más ({items.length - visibleCount} restantes)
          </button>
        </div>
      ) : null}
    </>
  );
}
