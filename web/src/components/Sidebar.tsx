import { useLibraryContext, useNavigationContext, useTmdbContext } from '../context/AppContext';
import { NAV_ITEMS } from '../types';
import './Sidebar.css';

export function Sidebar() {
  const { counts } = useLibraryContext();
  const { currentView, setView, sidebarOpen } = useNavigationContext();
  const { promptApiKey, promptAnthropicApiKey } = useTmdbContext();

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="brand">
        <h1 className="marquee">Cinetracker</h1>
        <div className="film-strip">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${currentView === item.id ? ' active' : ''}`}
            onClick={() => setView(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setView(item.id)}
          >
            <span>{item.label}</span>
            {item.showCount ? (
              <span className="count">{counts[item.id as keyof typeof counts]}</span>
            ) : (
              <span />
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="ghost-btn" onClick={promptApiKey}>
          TMDB API key
        </button>
        <button type="button" className="ghost-btn" onClick={promptAnthropicApiKey}>
          Claude API key
        </button>
      </div>
    </aside>
  );
}
