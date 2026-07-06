import { useMemo, useState } from 'react';
import { visibleSeasons, isSeasonFullyWatched } from '../lib/library';
import { listsContainingItem } from '../lib/lists';
import { tmdbImg } from '../lib/tmdb';
import type { ListRecord, MediaKind, MovieRecord, SeriesRecord } from '../types';

export interface DetailContentProps {
  item: SeriesRecord | MovieRecord;
  kind: MediaKind;
  lists: ListRecord[];
  variant: 'modal' | 'screen';
  onClose: () => void;
  onUpdateField: (field: string, value: unknown) => void;
  onToggleEpisode: (seasonNum: number, epNum: number) => void;
  onToggleSeasonWatch: (seasonNum: number) => void;
  onDelete: () => void;
  onAddToList: (listId: string) => Promise<boolean>;
  onRemoveFromList: (listId: string) => void;
}

export function DetailContent({
  item,
  kind,
  lists,
  variant,
  onClose,
  onUpdateField,
  onToggleEpisode,
  onToggleSeasonWatch,
  onDelete,
  onAddToList,
  onRemoveFromList,
}: DetailContentProps) {
  const [selectedListId, setSelectedListId] = useState('');

  const isTv = kind === 'tv';
  const series = isTv ? (item as SeriesRecord) : null;
  const movie = !isTv ? (item as MovieRecord) : null;
  const listRecord = { id: item.id, title: item.title, tvtime_uuid: item.tvtime_uuid };

  const memberLists = useMemo(
    () => listsContainingItem(lists, kind, { id: item.id, tvtime_uuid: item.tvtime_uuid }),
    [item.id, item.tvtime_uuid, kind, lists],
  );

  const availableLists = useMemo(
    () =>
      lists.filter(
        (l) =>
          !listsContainingItem([l], kind, { id: item.id, tvtime_uuid: item.tvtime_uuid }).length,
      ),
    [item.id, item.tvtime_uuid, kind, lists],
  );

  const handleAddToList = async () => {
    if (!selectedListId) return;
    const ok = await onAddToList(selectedListId);
    if (ok) setSelectedListId('');
  };

  return (
    <>
      {variant === 'modal' ? (
        <button type="button" className="close-x" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      ) : null}

      <div className="detail-head">
        <img
          src={tmdbImg(item.poster_path)}
          alt={item.title}
          onError={(e) => {
            (e.target as HTMLImageElement).style.background = 'var(--surface-raised)';
          }}
        />
        <div className="info">
          <h2>{item.title}</h2>
          <div className="section-sub" style={{ margin: 0 }}>
            {isTv ? 'Serie' : `Película${movie?.year ? ` · ${movie.year}` : ''}`}
          </div>
          <div className="overview">{item.overview || 'Sin sinopsis disponible.'}</div>
        </div>
      </div>

      <div className="detail-body">
        <div className="field-row">
          <div className="field">
            <label>Estado</label>
            <select
              value={item.watch_status || 'pendientes'}
              onChange={(e) => onUpdateField('watch_status', e.target.value)}
            >
              <option value="pendientes">Pendientes</option>
              <option value="viendo">Viendo</option>
              <option value="visto">Visto</option>
              <option value="abandonadas">Abandonadas</option>
            </select>
          </div>
          {series?.genres?.length || movie?.genres?.length ? (
            <div className="field">
              <label>Géneros</label>
              <div className="genre-tags">
                {(series?.genres || movie?.genres || []).map((g) => (
                  <span key={`${g.id}:${g.name}`} className="genre-tag">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="field">
            <label>Rating (1-10)</label>
            <select
              value={item.rating ?? ''}
              onChange={(e) =>
                onUpdateField('rating', e.target.value ? parseInt(e.target.value, 10) : null)
              }
            >
              <option value="">Sin calificar</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="list-section">
          <div className="field">
            <label>Listas</label>
            {lists.length ? (
              <div className="list-add-row">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  disabled={!availableLists.length}
                >
                  <option value="">
                    {availableLists.length ? 'Elegir lista...' : 'Ya está en todas las listas'}
                  </option>
                  {availableLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn"
                  disabled={!selectedListId}
                  onClick={() => void handleAddToList()}
                >
                  Agregar
                </button>
              </div>
            ) : (
              <p className="list-hint">No tenés listas. Creá una en la sección Listas.</p>
            )}
            {memberLists.length ? (
              <div className="list-tags">
                {memberLists.map((l) => (
                  <span key={l.id} className="list-tag">
                    {l.name}
                    <button
                      type="button"
                      className="list-tag-remove"
                      aria-label={`Quitar de ${l.name}`}
                      onClick={() => onRemoveFromList(l.id)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {isTv && series
          ? visibleSeasons(series.seasons).map((s) => {
              const allWatched = isSeasonFullyWatched(s);
              return (
                <div key={s.season_number} className="season-block">
                  <div className="season-head">
                    <div className="season-title">
                      Temporada {s.season_number} — {(s.watched_episodes || []).length}/
                      {s.episode_count}
                    </div>
                    <button
                      type="button"
                      className="btn ghost season-action"
                      onClick={() => onToggleSeasonWatch(s.season_number)}
                    >
                      {allWatched ? 'Desmarcar temporada' : 'Marcar temporada'}
                    </button>
                  </div>
                  <div className="ep-grid">
                    {Array.from({ length: s.episode_count }, (_, i) => i + 1).map((epNum) => {
                      const on = (s.watched_episodes || []).includes(epNum);
                      return (
                        <div
                          key={epNum}
                          className={`ep-chip${on ? ' watched' : ''}`}
                          onClick={() => onToggleEpisode(s.season_number, epNum)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && onToggleEpisode(s.season_number, epNum)
                          }
                        >
                          {epNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          : null}
      </div>

      <div className="detail-footer">
        <button type="button" className="btn danger" onClick={onDelete}>
          Eliminar de la biblioteca
        </button>
        {variant === 'modal' ? (
          <button type="button" className="btn ghost" onClick={onClose}>
            Cerrar
          </button>
        ) : null}
      </div>
    </>
  );
}
