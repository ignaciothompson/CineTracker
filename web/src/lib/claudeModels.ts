export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-5';

export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-5', label: 'Sonnet 5 (recomendado)' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 (rápido, barato)' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6 (más capaz)' },
] as const;

export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]['id'];

const ALLOWED = new Set(CLAUDE_MODELS.map((m) => m.id));

export function normalizeClaudeModel(value: string | null | undefined): ClaudeModelId {
  if (value && ALLOWED.has(value as ClaudeModelId)) {
    return value as ClaudeModelId;
  }
  return DEFAULT_CLAUDE_MODEL;
}

export function modelLabel(id: string) {
  return CLAUDE_MODELS.find((m) => m.id === id)?.label ?? id;
}
