import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CLAUDE_MODEL, normalizeClaudeModel, type ClaudeModelId } from '../lib/claudeModels';
import { pb } from '../lib/pocketbase';

export function useTmdbSettings() {
  const [tmdbKey, setTmdbKey] = useState<string | null>(null);
  const [anthropicConfigured, setAnthropicConfigured] = useState(false);
  const [anthropicModel, setAnthropicModel] = useState<ClaudeModelId>(DEFAULT_CLAUDE_MODEL);
  const [settingsRecordId, setSettingsRecordId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const recs = await pb.collection('settings').getFullList({ sort: '-id' });
      if (recs.length) {
        setSettingsRecordId(recs[0].id);
        setTmdbKey(recs[0].tmdb_api_key || null);
        setAnthropicModel(normalizeClaudeModel(recs[0].anthropic_model));
      }
    } catch {
      /* settings optional */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadSettings();
      try {
        const res = await fetch('/api/chat/status');
        if (res.ok) {
          const data = (await res.json()) as { configured?: boolean };
          setAnthropicConfigured(!!data.configured);
        }
      } catch {
        /* chat hook optional */
      }
      setReady(true);
    })();
  }, [loadSettings]);

  const saveSettings = useCallback(
    async (patch: { tmdb_api_key?: string; anthropic_model?: string }) => {
      if ('tmdb_api_key' in patch) setTmdbKey(patch.tmdb_api_key ?? null);
      if ('anthropic_model' in patch) {
        setAnthropicModel(normalizeClaudeModel(patch.anthropic_model));
      }
      if (settingsRecordId) {
        await pb.collection('settings').update(settingsRecordId, patch);
      } else {
        const rec = await pb.collection('settings').create(patch);
        setSettingsRecordId(rec.id);
      }
    },
    [settingsRecordId],
  );

  const saveApiKey = useCallback(
    async (val: string) => {
      await saveSettings({ tmdb_api_key: val });
    },
    [saveSettings],
  );

  const saveAnthropicModel = useCallback(
    async (val: ClaudeModelId) => {
      await saveSettings({ anthropic_model: val });
    },
    [saveSettings],
  );

  const promptApiKey = useCallback(() => {
    const val = prompt(
      'Pegá tu API key de TMDB (v3 auth). Se guarda en tu base de datos.',
      tmdbKey || '',
    );
    if (val === null) return;
    void saveApiKey(val.trim());
  }, [saveApiKey, tmdbKey]);

  return {
    tmdbKey,
    anthropicReady: anthropicConfigured,
    anthropicModel,
    ready,
    saveApiKey,
    saveAnthropicModel,
    promptApiKey,
  };
}
