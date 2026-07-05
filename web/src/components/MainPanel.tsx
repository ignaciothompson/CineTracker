import { useNavigationContext } from '../context/AppContext';
import { TmdbSearch } from './TmdbSearch';
import { CategoryFilters } from './CategoryFilters';
import { ViewHeader } from './ViewHeader';
import { MainContent } from './MainContent';
import './MainPanel.css';

export function MainPanel() {
  const { toggleSidebar, contentScrollRef, currentView } = useNavigationContext();
  const showFilters = !['stats', 'listas', 'recomendaciones'].includes(currentView);

  return (
    <main>
      <div className="main-header">
        <div className="mobile-header">
          <button
            type="button"
            className="menu-btn"
            aria-label="Abrir menú"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <span className="mobile-title marquee">Cinetracker</span>
        </div>
        <div className="topbar">
          <TmdbSearch />
          <CategoryFilters hidden={!showFilters} />
        </div>
        <ViewHeader />
      </div>
      <div className="main-scroll" ref={contentScrollRef}>
        <MainContent />
      </div>
    </main>
  );
}
