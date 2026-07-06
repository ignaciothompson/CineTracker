import { useNavigationContext } from '../context/AppContext';
import { TmdbSearch } from './TmdbSearch';
import { MediaTabs } from './CategoryFilters';
import { GenreFilterChips } from './GenreFilterChips';
import { ViewHeader } from './ViewHeader';
import { MainContent } from './MainContent';
import './MainPanel.css';

export function MainPanel() {
  const { toggleSidebar, contentScrollRef, currentView } = useNavigationContext();
  const showFilters = !['stats', 'listas', 'importar', 'chat'].includes(currentView);

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
          {showFilters ? (
            <div className="topbar-filters">
              <MediaTabs />
              <GenreFilterChips hidden={false} />
            </div>
          ) : null}
        </div>
        <ViewHeader />
      </div>
      <div className="main-scroll" ref={contentScrollRef}>
        <MainContent />
      </div>
    </main>
  );
}
