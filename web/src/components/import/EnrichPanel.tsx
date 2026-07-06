import { useMemo, useState } from 'react';
import { useLibraryContext, useTmdbContext } from '../context/AppContext';
import {
  countPendingEnrich,
  enrichLibrary,
  type EnrichProgress,
  type EnrichStats,
} from '../../lib/tmdbEnrich';
import { EnrichResultCard } from './EnrichResultCard';
import './EnrichPanel.css';

interface EnrichPanelProps {
  disabled?: boolean;
}

export function EnrichPanel({ disabled = false }: EnrichPanelProps) {
  const { series, movies, reloadLibrary } = useLibraryContext();
  const { tmdbKey, promptApiKey } = useTmdbContext();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<EnrichProgress | null>(null);
  const [results, setResults] = useState<{ label: string; stats: EnrichStats }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const pending = useMemo(() => countPendingEnrich(series, movies), [series, movies]);
  const progressPct = progress
    ? Math.round((progress.current / Math.max(progress.total, 1)) * 100)
    : 0;

  const runEnrich = async () => {
    if (!tmdbKey || running || !pending.total) return;

    setRunning(true);
    setResults([]);
    setErrors([]);
    setProgress(null);

    try {
      const summary = await enrichLibrary(tmdbKey, series, movies, setProgress);
      setResults(summary);
      const allErrors = summary.flatMap((r) => r.stats.errors);
      setErrors(allErrors);
      await reloadLibrary();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Error al enriquecer']);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <section className="import-card enrich-panel">
      <div className="enrich-panel-head">
        <h3 className="import-card-title">Enriquecer con TMDB</h3>
        <span className="enrich-badge">
          {pending.total} sin poster
        </span>
      </div>

      <p className="import-card-text">
        Matchea por <code>tvdb_id</code> / <code>imdb_id</code> y agrega poster, sinopsis y{' '}
        <code>tmdb_id</code>. Los que ya tienen TMDB se saltan.
      </p>

      {!tmdbKey ? (
        <div className="enrich-missing-key">
          <p>Necesitás configurar tu API key de TMDB primero.</p>
          <button type="button" className="btn" onClick={promptApiKey}>
            Configurar API key
          </button>
        </div>
      ) : (
        <>
          <div className="enrich-pending-row">
            <span>{pending.series} series</span>
            <span>{pending.movies} películas</span>
          </div>

          <div className="import-action-row">
            <button
              type="button"
              className="btn"
              disabled={disabled || running || !pending.total}
              onClick={() => void runEnrich()}
            >
              {running ? 'Enriqueciendo…' : 'Enriquecer biblioteca'}
            </button>
          </div>

          {progress ? (
            <div className="import-progress-wrap">
              <div className="import-progress-label">
                <span>{progress.label}</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div className="import-progress-track">
                <div
                  className="import-progress-fill enrich-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}
        </>
      )}

      {results.length ? (
        <div className="enrich-results">
          {results.map((r) => (
            <EnrichResultCard key={r.label} label={r.label} stats={r.stats} />
          ))}
        </div>
      ) : null}

      {errors.length ? (
        <ul className="import-error-list enrich-errors">
          {errors.slice(0, 6).map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
