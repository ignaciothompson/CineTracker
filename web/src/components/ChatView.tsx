import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CLAUDE_MODELS,
  modelLabel,
  normalizeClaudeModel,
  type ClaudeModelId,
} from '../lib/claudeModels';
import { genreKey } from '../lib/tmdbGenres';
import { getRecentWatched, getReferenceCandidates, libraryGenres } from '../lib/library';
import {
  listAiRecommendations,
  requestRecommendation,
  saveAiRecommendation,
  setRecommendationFeedback,
  refKey,
} from '../lib/recommendations';
import { useLibraryContext, useTmdbContext } from '../context/AppContext';
import type { AiRecommendationRecord, RefItem, SeedContext, TmdbGenre } from '../types';
import './Views.css';

type Phase = 'setup' | 'result' | 'save' | 'history';

export function ChatView() {
  const { library } = useLibraryContext();
  const { anthropicReady, anthropicModel, saveAnthropicModel } = useTmdbContext();

  const [phase, setPhase] = useState<Phase>('setup');
  const [model, setModel] = useState<ClaudeModelId>(anthropicModel);
  const [lastWatched, setLastWatched] = useState<RefItem[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<TmdbGenre[]>([]);
  const [references, setReferences] = useState<RefItem[]>([]);
  const [refQuery, setRefQuery] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [chosenTitle, setChosenTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AiRecommendationRecord[]>([]);

  const genreOptions = useMemo(() => libraryGenres(library), [library]);
  const refCandidates = useMemo(() => getReferenceCandidates(library), [library]);
  const refSuggestions = useMemo(() => {
    const q = refQuery.trim().toLowerCase();
    const picked = new Set(references.map(refKey));
    return refCandidates
      .filter((l) => !picked.has(`${l.kind}:${l.id}`))
      .filter((l) => !q || l.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [refCandidates, refQuery, references]);

  const seedContext = useMemo<SeedContext>(
    () => ({
      last_watched: lastWatched,
      genres: selectedGenres,
      reference_titles: references,
    }),
    [lastWatched, selectedGenres, references],
  );

  const loadHistory = useCallback(async () => {
    const rows = await listAiRecommendations();
    setHistory(rows);
  }, []);

  useEffect(() => {
    setModel(anthropicModel);
  }, [anthropicModel]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const startNewChat = useCallback(() => {
    setLastWatched(getRecentWatched(library, 5));
    setSelectedGenres([]);
    setReferences([]);
    setRefQuery('');
    setRecommendationText('');
    setChosenTitle('');
    setError(null);
    setPhase('setup');
  }, [library]);

  useEffect(() => {
    startNewChat();
  }, [startNewChat]);

  const toggleGenre = (g: TmdbGenre) => {
    const key = genreKey(g);
    setSelectedGenres((prev) =>
      prev.some((x) => genreKey(x) === key)
        ? prev.filter((x) => genreKey(x) !== key)
        : [...prev, g],
    );
  };

  const addReference = (item: RefItem) => {
    setReferences((prev) => (prev.some((r) => refKey(r) === refKey(item)) ? prev : [...prev, item]));
    setRefQuery('');
  };

  const removeReference = (item: RefItem) => {
    setReferences((prev) => prev.filter((r) => refKey(r) !== refKey(item)));
  };

  const runRecommend = async () => {
    if (!anthropicReady) {
      setError('Chat IA no disponible: falta ANTHROPIC_API_KEY en el servidor.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await requestRecommendation({ seedContext, model });
      if (data.error) {
        setError(data.error);
        return;
      }
      setRecommendationText(data.reply || '');
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const title = chosenTitle.trim();
    if (!title) return;
    setLoading(true);
    try {
      await saveAiRecommendation({
        seed_context: seedContext,
        recommendation_text: recommendationText,
        chosen_title: title,
      });
      await loadHistory();
      startNewChat();
      setPhase('history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (id: string, feedback: 'buena' | 'mala') => {
    const row = history.find((h) => h.id === id);
    const next = row?.feedback === feedback ? 'sin_calificar' : feedback;
    await setRecommendationFeedback(id, next);
    await loadHistory();
  };

  return (
    <div className="chat-panel">
      <div className="rec-toolbar chat-phase-tabs">
        <button type="button" className={`ghost-btn${phase !== 'history' ? ' active-tab' : ''}`} onClick={startNewChat}>
          Nueva
        </button>
        <button
          type="button"
          className={`ghost-btn${phase === 'history' ? ' active-tab' : ''}`}
          onClick={() => { setPhase('history'); void loadHistory(); }}
        >
          Historial
        </button>
        <label className="rec-model-label">
          Modelo
          <select
            className="rec-model-select"
            value={model}
            disabled={loading}
            onChange={(e) => {
              const next = normalizeClaudeModel(e.target.value);
              setModel(next);
              void saveAnthropicModel(next);
            }}
          >
            {CLAUDE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      {phase === 'history' ? (
        <div className="rec-history">
          {!history.length ? <p className="chat-empty">Todavía no guardaste recomendaciones.</p> : null}
          {history.map((row) => (
            <div key={row.id} className="rec-history-card rec-box">
              <div className="rec-history-head">
                <strong>{row.chosen_title || 'Sin elección'}</strong>
                <span className="rec-history-date">
                  {row.created ? new Date(row.created).toLocaleDateString('es-AR') : ''}
                </span>
              </div>
              {row.seed_context?.genres?.length ? (
                <p className="rec-history-meta">
                  Géneros: {row.seed_context.genres.map((g) => g.name).join(', ')}
                </p>
              ) : null}
              <p className="rec-history-response">{row.recommendation_text}</p>
              <div className="rec-feedback-row">
                <button
                  type="button"
                  className={`ghost-btn${row.feedback === 'buena' ? ' active-tab' : ''}`}
                  onClick={() => void handleFeedback(row.id, 'buena')}
                >
                  Buena
                </button>
                <button
                  type="button"
                  className={`ghost-btn${row.feedback === 'mala' ? ' active-tab' : ''}`}
                  onClick={() => void handleFeedback(row.id, 'mala')}
                >
                  Mala
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {phase !== 'history' ? (
        <div className="chat-setup rec-box">
          <h3 className="chat-section-title">Últimos vistos (auto)</h3>
          <div className="chip-row">
            {lastWatched.length ? lastWatched.map((r) => (
              <span key={refKey(r)} className="chip active">{r.title}</span>
            )) : <span className="chat-empty">Nada marcado como visto todavía.</span>}
          </div>

          <h3 className="chat-section-title">Géneros</h3>
          <div className="chip-row">
            {genreOptions.length ? genreOptions.map((g) => (
              <button
                key={genreKey(g)}
                type="button"
                className={`chip${selectedGenres.some((x) => genreKey(x) === genreKey(g)) ? ' active' : ''}`}
                onClick={() => toggleGenre(g)}
              >
                {g.name}
              </button>
            )) : <span className="chat-empty">Sin géneros en tu biblioteca. Enriquecé con TMDB.</span>}
          </div>

          <h3 className="chat-section-title">Referencias de tu biblioteca (vistos)</h3>
          <div className="chip-row">
            {references.map((r) => (
              <button key={refKey(r)} type="button" className="chip active" onClick={() => removeReference(r)}>
                {r.title} ✕
              </button>
            ))}
          </div>
          <div className="typeahead-wrap">
            <input
              className="chat-input"
              placeholder="Buscar en títulos vistos..."
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value)}
            />
            {refQuery.trim() && refSuggestions.length ? (
              <div className="typeahead-list">
                {refSuggestions.map((l) => (
                  <button
                    key={`${l.kind}:${l.id}`}
                    type="button"
                    className="typeahead-item"
                    onClick={() => addReference({ kind: l.kind, id: l.id, title: l.title })}
                  >
                    {l.title} <span>({l.kind === 'tv' ? 'serie' : 'película'})</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {phase === 'setup' ? (
            <button type="button" className="ghost-btn" disabled={loading} onClick={() => void runRecommend()}>
              {loading ? 'Generando...' : 'Obtener recomendación'}
            </button>
          ) : null}

          {phase === 'result' || phase === 'save' ? (
            <>
              <h3 className="chat-section-title">Recomendación</h3>
              <div className="chat-result">{recommendationText}</div>
              {phase === 'result' ? (
                <button type="button" className="ghost-btn" onClick={() => setPhase('save')}>
                  Elegí una opción
                </button>
              ) : (
                <div className="chat-save-row">
                  <input
                    className="chat-input"
                    placeholder="¿Qué elegiste ver?"
                    value={chosenTitle}
                    onChange={(e) => setChosenTitle(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={loading || !chosenTitle.trim()}
                    onClick={() => void handleSave()}
                  >
                    Guardar
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="chat-error">{error}</p> : null}
      {recommendationText && phase !== 'history' ? (
        <p className="rec-model-used">Modelo: {modelLabel(model)}</p>
      ) : null}
    </div>
  );
}
