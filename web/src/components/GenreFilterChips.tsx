import { useMemo, useState } from 'react';
import { useLibraryContext, useNavigationContext } from '../context/AppContext';
import { libraryGenres } from '../lib/library';
import './CategoryFilters.css';

const VISIBLE_LIMIT = 10;

export function GenreFilterChips({ hidden }: { hidden: boolean }) {
  const { library } = useLibraryContext();
  const { genreFilter, toggleGenreFilter } = useNavigationContext();
  const [expanded, setExpanded] = useState(false);
  const options = useMemo(() => libraryGenres(library), [library]);

  if (hidden || !options.length) return null;

  const canCollapse = options.length > VISIBLE_LIMIT;
  const visible = expanded || !canCollapse ? options : options.slice(0, VISIBLE_LIMIT);
  const hiddenCount = options.length - VISIBLE_LIMIT;

  return (
    <div className="genre-filters" style={{ visibility: hidden ? 'hidden' : 'visible' }}>
      {visible.map((g) => (
        <button
          key={`${g.id}:${g.name}`}
          type="button"
          className={`chip${genreFilter.includes(g.name) ? ' active' : ''}`}
          onClick={() => toggleGenreFilter(g.name)}
        >
          {g.name}
        </button>
      ))}
      {canCollapse ? (
        <button
          type="button"
          className="chip genre-more-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Menos' : `+${hiddenCount} más`}
        </button>
      ) : null}
    </div>
  );
}
