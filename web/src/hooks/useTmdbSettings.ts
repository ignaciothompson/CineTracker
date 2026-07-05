import { useCallback, useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';

export function useTmdbSettings() {
  const [tmdbKey, setTmdbKey] = useState<string | null>(null);
  const [settingsRecordId, setSettingsRecordId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const recs = await pb.collection('settings').getFullList({ sort: '-id' });
      if (recs.length) {
        setSettingsRecordId(recs[0].id);
        setTmdbKey(recs[0].tmdb_api_key || null);
      }
    } catch {
      /* settings optional */
    }
  }, []);

  useEffect(() => {
    void loadSettings().finally(() => setReady(true));
  }, [loadSettings]);

  const saveApiKey = useCallback(
    async (val: string) => {
      setTmdbKey(val);
      if (settingsRecordId) {
        await pb.collection('settings').update(settingsRecordId, { tmdb_api_key: val });
      } else {
        const rec = await pb.collection('settings').create({ tmdb_api_key: val });
        setSettingsRecordId(rec.id);
      }
    },
    [settingsRecordId],
  );

  const promptApiKey = useCallback(() => {
    const val = prompt(
      'Pegá tu API key de TMDB (v3 auth). Se guarda en tu base de datos.',
      tmdbKey || '',
    );
    if (val === null) return;
    void saveApiKey(val.trim());
  }, [saveApiKey, tmdbKey]);

  return { tmdbKey, ready, saveApiKey, promptApiKey };
}
