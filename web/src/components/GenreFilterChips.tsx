import { useMemo } from 'react';
import { useLibraryContext, useNavigationContext } from '../context/AppContext';
import { libraryGenres } from '../lib/library';
import './CategoryFilters.css';

export function GenreFilterChips({ hidden }: { hidden: boolean }) {
  const { library } = useLibraryContext();
  const { genreFilter, toggleGenreFilter } = useNavigationContext();
  const options = useMemo(() => libraryGenres(library), [library]);

  if (hidden || !options.length) return null;

  return (
    <div className="genre-filters" style={{ visibility: hidden ? 'hidden' : 'visible' }}>
      {options.map((g) => (
        <button
          key={`${g.id}:${g.name}`}
          type="button"
          className={`chip${genreFilter.includes(g.name) ? ' active' : ''}`}
          onClick={() => toggleGenreFilter(g.name)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
