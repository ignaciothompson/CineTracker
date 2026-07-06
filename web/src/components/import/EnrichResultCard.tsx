import type { EnrichStats } from '../../lib/tmdbEnrich';
import './EnrichResultCard.css';

interface EnrichResultCardProps {
  label: string;
  stats: EnrichStats;
}

export function EnrichResultCard({ label, stats }: EnrichResultCardProps) {
  const processed = stats.updated + stats.noMatch + stats.failed;
  const success = stats.failed === 0;

  return (
    <div className={`enrich-result-card${success ? ' success' : ' partial'}`}>
      <div className="enrich-result-card-head">
        <span className="enrich-result-card-label">{label}</span>
        <span className="enrich-result-card-total">{processed} procesados</span>
      </div>
      <div className="enrich-result-card-stats">
        <div className="enrich-stat updated">
          <span className="enrich-stat-num">{stats.updated}</span>
          <span className="enrich-stat-lbl">ok</span>
        </div>
        <div className="enrich-stat skip">
          <span className="enrich-stat-num">{stats.skipped}</span>
          <span className="enrich-stat-lbl">ya tenían</span>
        </div>
        <div className="enrich-stat nomatch">
          <span className="enrich-stat-num">{stats.noMatch}</span>
          <span className="enrich-stat-lbl">sin match</span>
        </div>
        <div className="enrich-stat fail">
          <span className="enrich-stat-num">{stats.failed}</span>
          <span className="enrich-stat-lbl">error</span>
        </div>
      </div>
    </div>
  );
}
