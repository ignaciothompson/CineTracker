import { useNavigationContext } from '../context/AppContext';
import './LibrarySearch.css';

export function LibrarySearch() {
  const { searchQuery, setSearchQuery } = useNavigationContext();

  return (
    <div className="library-search">
      <input
        className="library-search-input"
        type="text"
        placeholder="Filtrar por título..."
        autoComplete="off"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Filtrar biblioteca por título"
      />
      {searchQuery ? (
        <button
          type="button"
          className="library-search-clear"
          onClick={() => setSearchQuery('')}
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
