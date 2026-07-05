import type { ImportStats } from '../../lib/tvtimeImport';
import './ImportResultCard.css';

interface ImportResultCardProps {
  label: string;
  stats: ImportStats;
}

export function ImportResultCard({ label, stats }: ImportResultCardProps) {
  const total = stats.ok + stats.skipped + stats.failed;
  const success = stats.failed === 0;

  return (
    <div className={`import-result-card${success ? ' success' : ' partial'}`}>
      <div className="import-result-card-head">
        <span className="import-result-card-label">{label}</span>
        <span className="import-result-card-total">{total} ítems</span>
      </div>
      <div className="import-result-card-stats">
        <div className="import-stat ok">
          <span className="import-stat-num">{stats.ok}</span>
          <span className="import-stat-lbl">nuevos</span>
        </div>
        <div className="import-stat skip">
          <span className="import-stat-num">{stats.skipped}</span>
          <span className="import-stat-lbl">skip</span>
        </div>
        <div className="import-stat fail">
          <span className="import-stat-num">{stats.failed}</span>
          <span className="import-stat-lbl">error</span>
        </div>
      </div>
    </div>
  );
}
