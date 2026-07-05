import { useEffect, useState } from 'react';
import { fetchRecommendations } from '../lib/tmdb';
import './Views.css';

export function RecommendationsView() {
  const [text, setText] = useState('Pensando recomendaciones a partir de tu biblioteca...');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchRecommendations();
        if (cancelled) return;
        if (data.error) setText(`Error: ${data.error}`);
        else setText(data.recommendation);
      } catch {
        if (!cancelled) setText('No se pudo conectar con el servidor de recomendaciones.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <div className="rec-box">{text}</div>;
}
