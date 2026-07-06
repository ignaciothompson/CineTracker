import { visibleSeasons } from '../lib/library';
import { tmdbImg } from '../lib/tmdb';
import type { LibraryItem } from '../types';
import './TicketCard.css';

interface TicketCardProps {
  item: LibraryItem;
  onOpen: () => void;
  onMarkWatched?: () => void;
}

function Filmstrip({ seasons }: { seasons: NonNullable<LibraryItem['seasons']> }) {
  const visible = visibleSeasons(seasons);
  const total = visible.reduce((a, s) => a + s.episode_count, 0);
  const watched = visible.reduce((a, s) => a + (s.watched_episodes?.length || 0), 0);
  const frames = Math.min(total, 24) || 1;
  const filled = total ? Math.round(frames * (watched / total)) : 0;
  return (
    <div className="filmstrip">
      {Array.from({ length: frames }).map((_, i) => (
        <div key={i} className={`frame${i < filled ? ' on' : ''}`} />
      ))}
    </div>
  );
}

export function TicketCard({ item, onOpen, onMarkWatched }: TicketCardProps) {
  const tag = item.genres?.[0]?.name || (item.kind === 'tv' ? 'Serie' : 'Película');
  const showMarkWatched =
    item.kind === 'movie' && item.watch_status !== 'visto' && onMarkWatched;

  return (
    <div className="ticket" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      {showMarkWatched ? (
        <button
          type="button"
          className="ticket-mark-watched"
          title="Marcar como visto"
          aria-label={`Marcar ${item.title} como visto`}
          onClick={(e) => {
            e.stopPropagation();
            onMarkWatched();
          }}
        >
          ✓
        </button>
      ) : null}
      <span className={`cat-tag ${item.kind === 'tv' ? 'Serie' : 'Pelicula'}`}>{tag}</span>
      <img
        className="poster"
        src={tmdbImg(item.poster_path)}
        alt={item.title}
        onError={(e) => { (e.target as HTMLImageElement).style.background = 'var(--surface-raised)'; }}
      />
      <div className="body">
        <div className="title">{item.title}</div>
        {item.kind === 'tv' && item.seasons ? <Filmstrip seasons={item.seasons} /> : null}
        <div className="meta-row">
          <span>{item.kind === 'tv' ? 'Serie' : item.year || ''}</span>
          {item.rating ? <span className="rating-badge">{item.rating}/10</span> : null}
        </div>
      </div>
    </div>
  );
}
