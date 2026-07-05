import { useNavigationContext } from '../context/AppContext';
import { isLibraryView } from '../lib/filters';
import { LibrarySearch } from './LibrarySearch';
import { VIEW_META } from '../types';

export function ViewHeader() {
  const { currentView } = useNavigationContext();

  if (currentView === 'stats') {
    return (
      <div className="view-header">
        <h2 className="section-title marquee">Estadísticas</h2>
        <p className="section-sub">Tu perfil de espectador, en números.</p>
      </div>
    );
  }
  if (currentView === 'listas') {
    return (
      <div className="view-header">
        <h2 className="section-title marquee">Listas</h2>
        <p className="section-sub">Tus listas custom, importadas o creadas acá.</p>
      </div>
    );
  }
  if (currentView === 'recomendaciones') {
    return (
      <div className="view-header">
        <h2 className="section-title marquee">Recomendaciones IA</h2>
        <p className="section-sub">Basadas en lo que ya viste y calificaste.</p>
      </div>
    );
  }

  const meta = VIEW_META[currentView];
  return (
    <div className="view-header">
      <h2 className="section-title marquee">{meta.title}</h2>
      <p className="section-sub">{meta.sub}</p>
      {isLibraryView(currentView) ? <LibrarySearch /> : null}
    </div>
  );
}
