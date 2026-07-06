import { useDetailContext, useLibraryContext, useNavigationContext } from '../context/AppContext';
import { filterLibraryItems } from '../lib/filters';
import { TicketCard } from './TicketCard';
import { EmptyState } from './EmptyState';
import './TicketGrid.css';

export function TicketGrid() {
  const { library } = useLibraryContext();
  const { currentView, mediaTab, genreFilter, searchQuery } = useNavigationContext();
  const { openDetail } = useDetailContext();
  const items = filterLibraryItems(library, currentView, mediaTab, searchQuery, genreFilter);

  if (!items.length) {
    const text = searchQuery.trim()
      ? 'Nada coincide con tu búsqueda.'
      : 'Nada acá todavía.';
    return <EmptyState icon="🎬" text={text} />;
  }

  return (
    <div className="grid">
      {items.map((item) => (
        <TicketCard
          key={`${item.kind}-${item.id}`}
          item={item}
          onOpen={() => openDetail(item.kind, item.id)}
        />
      ))}
    </div>
  );
}
