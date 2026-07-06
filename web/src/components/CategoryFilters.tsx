import { useNavigationContext } from '../context/AppContext';
import { MEDIA_TABS } from '../types';
import './CategoryFilters.css';

export function MediaTabs({ hidden }: { hidden: boolean }) {
  const { mediaTab, setMediaTab } = useNavigationContext();

  return (
    <div className="filters" id="media-tabs" style={{ visibility: hidden ? 'hidden' : 'visible' }}>
      {MEDIA_TABS.map((f) => (
        <div
          key={f.id}
          className={`chip${mediaTab === f.id ? ' active' : ''}`}
          onClick={() => setMediaTab(f.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setMediaTab(f.id)}
        >
          {f.label}
        </div>
      ))}
    </div>
  );
}

/** @deprecated use MediaTabs */
export const CategoryFilters = MediaTabs;
