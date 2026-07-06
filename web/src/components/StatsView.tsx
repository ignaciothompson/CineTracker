import { useLibraryContext } from '../context/AppContext';
import { topGenres } from '../lib/library';
import './Views.css';

const STARTED_STATUSES = new Set(['viendo', 'visto', 'abandonadas']);

export function StatsView() {
  const { library, series, movies } = useLibraryContext();
  const total = library.length;
  const seriesCount = library.filter((l) => l.kind === 'tv').length;
  const moviesCount = library.filter((l) => l.kind === 'movie').length;
  const visto = library.filter((l) => l.watch_status === 'visto').length;
  const abandonadas = library.filter((l) => l.watch_status === 'abandonadas').length;
  const arrancados = library.filter((l) => STARTED_STATUSES.has(l.watch_status || '')).length;
  const abandonadasPct = arrancados ? Math.round((abandonadas / arrancados) * 100) : 0;
  const favoritos =
    series.filter((s) => s.is_favorite).length + movies.filter((m) => m.is_favorite).length;
  const rated = library.filter((l) => l.rating);
  const avgRating = rated.length
    ? (rated.reduce((a, l) => a + (l.rating || 0), 0) / rated.length).toFixed(1)
    : '—';
  const totalEpisodes = series.reduce(
    (a, l) => a + (l.seasons || []).reduce((b, s) => b + (s.watched_episodes?.length || 0), 0),
    0,
  );
  const ratingCounts = Array.from({ length: 10 }, (_, i) =>
    library.filter((l) => l.rating === i + 1).length,
  );
  const maxRatingCount = Math.max(...ratingCounts, 1);
  const genreTop = topGenres(library, 8);
  const maxGenre = Math.max(...genreTop.map(([, n]) => n), 1);

  const bar = (label: string, val: number, max: number, color: string, key?: string) => (
    <div className="bar-row" key={key ?? label}>
      <span className="lbl">{label}</span>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${max ? Math.round((val / max) * 100) : 0}%`, background: color }}
        />
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
        <div className="stat-card"><div className="num">{abandonadas}</div><div className="lbl">Abandonadas ({abandonadasPct}% de arrancados)</div></div>
        <div className="stat-card"><div className="num">{favoritos}</div><div className="lbl">Favoritos</div></div>
      </div>
      <h3 className="section-subsection marquee">Distribución</h3>
      {bar('Series', seriesCount, total, 'var(--seria)')}
      {bar('Películas', moviesCount, total, 'var(--stub)')}
      {genreTop.length ? (
        <>
          <h3 className="section-subsection marquee">Géneros top</h3>
          {genreTop.map(([name, count]) => bar(name, count, maxGenre, 'var(--comedia)', `genre-${name}`))}
        </>
      ) : null}
      <h3 className="section-subsection marquee">Ratings</h3>
      {ratingCounts.map((count, i) =>
        bar(String(i + 1), count, maxRatingCount, 'var(--progress)', `rating-${i + 1}`),
      )}
    </>
  );
}
