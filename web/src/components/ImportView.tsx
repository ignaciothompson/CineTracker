import { useMemo, useState } from 'react';
import { useLibraryContext } from '../context/AppContext';
import {
  importListsFromExport,
  importMoviesFromExport,
  importSeriesFromExport,
  parseJsonFile,
  type ImportProgress,
  type ImportStats,
  type TvTimeListExport,
  type TvTimeMovieExport,
  type TvTimeSeriesExport,
} from '../lib/tvtimeImport';
import { ImportResultCard } from './import/ImportResultCard';
import { JsonFileSlot } from './import/JsonFileSlot';
import { EnrichPanel } from './import/EnrichPanel';
import { TVTIME_IMPORT_SLOTS, type TvTimeImportKind } from './import/tvtimeImportConfig';
import './ImportView.css';

interface ImportRunResult {
  label: string;
  stats: ImportStats;
}

export function ImportView() {
  const { reloadLibrary } = useLibraryContext();
  const [files, setFiles] = useState<Partial<Record<TvTimeImportKind, File>>>({});
  const [skipExisting, setSkipExisting] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [results, setResults] = useState<ImportRunResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const selectedCount = useMemo(
    () => TVTIME_IMPORT_SLOTS.filter((s) => files[s.kind]).length,
    [files],
  );

  const progressPct = progress
    ? Math.round((progress.current / Math.max(progress.total, 1)) * 100)
    : 0;

  const setFile = (kind: TvTimeImportKind, file: File | undefined) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[kind] = file;
      else delete next[kind];
      return next;
    });
    setDone(false);
    setResults([]);
    setErrors([]);
  };

  const clearAll = () => {
    setFiles({});
    setResults([]);
    setErrors([]);
    setDone(false);
  };

  const runImport = async () => {
    if (!selectedCount || running) return;

    setRunning(true);
    setResults([]);
    setErrors([]);
    setProgress(null);
    setDone(false);

    const summary: ImportRunResult[] = [];
    const allErrors: string[] = [];

    const run = async (label: string, statsPromise: Promise<ImportStats>) => {
      const stats = await statsPromise;
      summary.push({ label, stats });
      allErrors.push(...stats.errors);
    };

    try {
      if (files.series) {
        const data = await parseJsonFile<TvTimeSeriesExport[]>(files.series);
        await run('Series', importSeriesFromExport(data, skipExisting, setProgress));
      }
      if (files.movies) {
        const data = await parseJsonFile<TvTimeMovieExport[]>(files.movies);
        await run('Películas', importMoviesFromExport(data, skipExisting, setProgress));
      }
      if (files.lists) {
        const data = await parseJsonFile<TvTimeListExport[]>(files.lists);
        await run('Listas', importListsFromExport(data, skipExisting, setProgress));
      }

      setResults(summary);
      setErrors(allErrors);
      setDone(true);
      await reloadLibrary();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Error al importar']);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <div className="import-view">
      <section className="import-card import-intro">
        <h3 className="import-card-title">Export de TV Time</h3>
        <p className="import-card-text">
          Elegí uno o más JSON. Re-import seguro: no duplica por{' '}
          <code>tvtime_uuid</code> si dejás activada la opción de abajo.
        </p>
        <ol className="import-steps">
          <li>Exportá desde TV Time (series, películas, listas).</li>
          <li>Subí los archivos acá.</li>
          <li>Enriquecé posters con TMDB (sección de abajo).</li>
        </ol>
      </section>

      <div className="import-slots">
        {TVTIME_IMPORT_SLOTS.map((slot) => (
          <JsonFileSlot
            key={slot.kind}
            label={slot.label}
            hint={slot.hint}
            icon={slot.icon}
            accent={slot.accent}
            file={files[slot.kind]}
            disabled={running}
            onFileChange={(file) => setFile(slot.kind, file)}
          />
        ))}
      </div>

      <section className="import-card import-actions">
        <label className="import-toggle">
          <input
            type="checkbox"
            checked={skipExisting}
            disabled={running}
            onChange={(e) => setSkipExisting(e.target.checked)}
          />
          <span>
            <strong>No duplicar</strong>
            <small>Salta registros que ya existen (tvtime_uuid)</small>
          </span>
        </label>

        <div className="import-action-row">
          <button
            type="button"
            className="btn"
            disabled={!selectedCount || running}
            onClick={() => void runImport()}
          >
            {running ? 'Importando…' : `Importar${selectedCount ? ` (${selectedCount})` : ''}`}
          </button>
          {selectedCount && !running ? (
            <button type="button" className="btn ghost" onClick={clearAll}>
              Limpiar archivos
            </button>
          ) : null}
        </div>

        {progress ? (
          <div className="import-progress-wrap">
            <div className="import-progress-label">
              <span>{progress.label}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="import-progress-track">
              <div className="import-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </section>

      {results.length ? (
        <section className="import-results-section">
          <h3 className="import-section-title">
            {done && !errors.length ? 'Import completado' : 'Resultado'}
          </h3>
          <div className="import-results-grid">
            {results.map((r) => (
              <ImportResultCard key={r.label} label={r.label} stats={r.stats} />
            ))}
          </div>
        </section>
      ) : null}

      {errors.length ? (
        <section className="import-errors-section">
          <h3 className="import-section-title">Errores ({errors.length})</h3>
          <ul className="import-error-list">
            {errors.slice(0, 10).map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
          {errors.length > 10 ? (
            <p className="import-error-more">… y {errors.length - 10} más</p>
          ) : null}
        </section>
      ) : null}

      <EnrichPanel disabled={running} />

    </div>
  );
}
