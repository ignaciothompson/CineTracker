import { useEffect, useMemo, useState } from 'react';
import { useDetailContext, useLibraryContext } from '../context/AppContext';
import { visibleSeasons, isSeasonFullyWatched } from '../lib/library';
import { listsContainingItem } from '../lib/lists';
import { tmdbImg } from '../lib/tmdb';
import type { MovieRecord, SeriesRecord } from '../types';
import './DetailModal.css';

export function DetailModal() {
  const {
    detail,
    closeDetail,
    getDetailItem,
    updateField,
    toggleEpisode,
    toggleSeasonWatch,
    deleteItem,
  } = useDetailContext();
  const { lists, addToList, removeFromList } = useLibraryContext();
  const [selectedListId, setSelectedListId] = useState('');

  const item = detail ? getDetailItem() : undefined;

  useEffect(() => {
    if (detail && !item) closeDetail();
  }, [detail, item, closeDetail]);

  useEffect(() => {
    setSelectedListId('');
  }, [detail?.id, detail?.kind]);

  const memberLists = useMemo(() => {
    if (!detail || !item) return [];
    return listsContainingItem(lists, detail.kind, {
      id: item.id,
      tvtime_uuid: item.tvtime_uuid,
    });
  }, [detail, item, lists]);

  const availableLists = useMemo(() => {
    if (!detail || !item) return lists;
    return lists.filter(
      (l) => !listsContainingItem([l], detail.kind, { id: item.id, tvtime_uuid: item.tvtime_uuid }).length,
    );
  }, [detail, item, lists]);

  if (!detail || !item) return null;

  const kind = detail.kind;
  const isTv = kind === 'tv';
  const series = isTv ? (item as SeriesRecord) : null;
  const movie = !isTv ? (item as MovieRecord) : null;
  const listRecord = { id: item.id, title: item.title, tvtime_uuid: item.tvtime_uuid };

  const handleAddToList = async () => {
    if (!selectedListId) return;
    const ok = await addToList(selectedListId, kind, listRecord);
    if (ok) setSelectedListId('');
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && closeDetail()}>
      <div className="modal">
        <div style={{ position: 'relative' }}>
          <button type="button" className="close-x" onClick={closeDetail}>✕</button>
          <div className="modal-head">
            <img
              src={tmdbImg(item.poster_path)}
              alt={item.title}
              onError={(e) => { (e.target as HTMLImageElement).style.background = 'var(--surface-raised)'; }}
            />
            <div className="info">
              <h2>{item.title}</h2>
              <div className="section-sub" style={{ margin: 0 }}>
                {isTv ? 'Serie' : `Película${movie?.year ? ` · ${movie.year}` : ''}`}
              </div>
              <div className="overview">{item.overview || 'Sin sinopsis disponible.'}</div>
            </div>
          </div>
          <div className="modal-body">
            <div className="field-row">
              <div className="field">
                <label>Estado</label>
                <select
                  value={item.watch_status || 'pendientes'}
                  onChange={(e) => void updateField(kind, item.id, 'watch_status', e.target.value)}
                >
                  <option value="pendientes">Pendientes</option>
                  <option value="viendo">Viendo</option>
                  <option value="visto">Visto</option>
                </select>
              </div>
              {isTv && series ? (
                <div className="field">
                  <label>Categoría</label>
                  <select
                    value={series.category || 'Seria'}
                    onChange={(e) => void updateField('tv', item.id, 'category', e.target.value)}
                  >
                    <option value="Seria">Seria</option>
                    <option value="Comedia">Comedia</option>
                  </select>
                </div>
              ) : null}
              <div className="field">
                <label>Rating (1-10)</label>
                <select
                  value={item.rating ?? ''}
                  onChange={(e) =>
                    void updateField(
                      kind,
                      item.id,
                      'rating',
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                >
                  <option value="">Sin calificar</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
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
                        <option key={l.id} value={l.id}>{l.name}</option>
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
                          onClick={() => void removeFromList(l.id, kind, listRecord)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {isTv && series && visibleSeasons(series.seasons).map((s) => {
              const allWatched = isSeasonFullyWatched(s);
              return (
              <div key={s.season_number} className="season-block">
                <div className="season-head">
                  <div className="season-title">
                    Temporada {s.season_number} — {(s.watched_episodes || []).length}/{s.episode_count}
                  </div>
                  <button
                    type="button"
                    className="btn ghost season-action"
                    onClick={() => void toggleSeasonWatch(item.id, s.season_number)}
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
                        onClick={() => void toggleEpisode(item.id, s.season_number, epNum)}
                        role="button"
                        tabIndex={0}
                      >
                        {epNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn danger" onClick={() => void deleteItem(kind, item.id)}>
              Eliminar de la biblioteca
            </button>
            <button type="button" className="btn ghost" onClick={closeDetail}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
