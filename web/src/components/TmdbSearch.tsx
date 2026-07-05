import { useEffect, useRef, useState } from 'react';
import { useTmdbContext } from '../context/AppContext';
import { tmdbImg, tmdbSearch } from '../lib/tmdb';
import type { TmdbSearchResult } from '../types';
import './TmdbSearch.css';

export function TmdbSearch() {
  const { tmdbKey, settingsReady, addFromTmdb } = useTmdbContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q) {
      setOpen(false);
      setResults([]);
      setMessage(null);
      return;
    }
    if (!settingsReady) return;
    if (!tmdbKey) {
      setMessage('Falta configurar tu API key de TMDB (botón abajo a la izquierda).');
      setOpen(true);
      return;
    }
    timerRef.current = window.setTimeout(async () => {
      try {
        const data = await tmdbSearch(tmdbKey, q);
        setResults(data);
        setMessage(data.length ? null : 'Sin resultados');
        setOpen(true);
      } catch {
        setMessage('Error buscando en TMDB. Revisá tu API key.');
        setOpen(true);
      }
    }, 400);
    return () => window.clearTimeout(timerRef.current);
  }, [query, tmdbKey, settingsReady]);

  const pick = async (r: TmdbSearchResult) => {
    await addFromTmdb(r.id, r.media_type);
    setQuery('');
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="search-wrap" ref={wrapRef}>
      <input
        className="search-input"
        type="text"
        placeholder="Buscar en TMDB para agregar una serie o película..."
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={`search-results${open ? ' show' : ''}`}>
        {message && !results.length ? <div className="sr-item">{message}</div> : null}
        {results.slice(0, 10).map((r) => {
          const title = r.name || r.title || '';
          const date = r.first_air_date || r.release_date || '';
          const year = date ? date.split('-')[0] : '—';
          return (
            <div key={`${r.media_type}-${r.id}`} className="sr-item" onClick={() => pick(r)}>
              <img src={tmdbImg(r.poster_path, 'w92')} alt="" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              <div className="sr-info">
                <div className="t">{title}</div>
                <div className="y">
                  {year} · {r.media_type === 'tv' ? 'Serie' : 'Película'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
