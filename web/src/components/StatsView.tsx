import { useLibraryContext } from '../context/AppContext';
import './Views.css';

export function StatsView() {
  const { library, series } = useLibraryContext();
  const total = library.length;
  const seria = library.filter((l) => l.category === 'Seria').length;
  const comedia = library.filter((l) => l.category === 'Comedia').length;
  const peliculas = library.filter((l) => l.category === 'Pelicula').length;
  const visto = library.filter((l) => l.watch_status === 'visto').length;
  const rated = library.filter((l) => l.rating);
  const avgRating = rated.length
    ? (rated.reduce((a, l) => a + (l.rating || 0), 0) / rated.length).toFixed(1)
    : '—';
  const totalEpisodes = series.reduce(
    (a, l) => a + (l.seasons || []).reduce((b, s) => b + (s.watched_episodes?.length || 0), 0),
    0,
  );

  const bar = (label: string, val: number, max: number, color: string) => (
    <div className="bar-row" key={label}>
      <span className="lbl">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${max ? Math.round((val / max) * 100) : 0}%`, background: color }} />
      </div>
      <span className="val">{val}</span>
    </div>
  );

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card"><div className="num">{total}</div><div className="lbl">Títulos trackeados</div></div>
        <div className="stat-card"><div className="num">{visto}</div><div className="lbl">Terminados</div></div>
        <div className="stat-card"><div className="num">{totalEpisodes}</div><div className="lbl">Episodios vistos</div></div>
        <div className="stat-card"><div className="num">{avgRating}</div><div className="lbl">Rating promedio</div></div>
      </div>
      <h2 className="section-title marquee" style={{ fontSize: 18, marginBottom: 16 }}>Distribución</h2>
      {bar('Seria', seria, total, 'var(--seria)')}
      {bar('Comedia', comedia, total, 'var(--comedia)')}
      {bar('Películas', peliculas, total, 'var(--stub)')}
    </>
  );
}
