import { useNavigationContext } from '../context/AppContext';
import { CATEGORY_FILTERS } from '../types';
import './CategoryFilters.css';

export function CategoryFilters({ hidden }: { hidden: boolean }) {
  const { catFilter, setCatFilter } = useNavigationContext();

  return (
    <div className="filters" id="cat-filters" style={{ visibility: hidden ? 'hidden' : 'visible' }}>
      {CATEGORY_FILTERS.map((f) => (
        <div
          key={f.id}
          className={`chip${catFilter === f.id ? ' active' : ''}`}
          onClick={() => setCatFilter(f.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setCatFilter(f.id)}
        >
          {f.label}
        </div>
      ))}
    </div>
  );
}
