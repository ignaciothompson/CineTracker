import { useLibraryContext, useNavigationContext } from '../context/AppContext';
import { TicketGrid } from './TicketGrid';
import { StatsView } from './StatsView';
import { ListsView } from './ListsView';
import { RecommendationsView } from './RecommendationsView';
import { ImportView } from './ImportView';

export function MainContent() {
  const { loading } = useLibraryContext();
  const { currentView } = useNavigationContext();

  if (loading) {
    return <div className="empty-state"><div>Cargando biblioteca...</div></div>;
  }

  switch (currentView) {
    case 'stats':
      return <StatsView />;
    case 'listas':
      return <ListsView />;
    case 'importar':
      return <ImportView />;
    case 'recomendaciones':
      return <RecommendationsView />;
    default:
      return <TicketGrid />;
  }
}
