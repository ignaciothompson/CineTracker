import { pb } from './pocketbase';
import type { AiRecommendationRecord, RecommendationFeedback, SeedContext } from '../types';

export async function listAiRecommendations(): Promise<AiRecommendationRecord[]> {
  try {
    return await pb.collection('ai_recommendations').getFullList({ sort: '-created' });
  } catch {
    return [];
  }
}

export async function saveAiRecommendation(data: {
  seed_context: SeedContext;
  recommendation_text: string;
  chosen_title: string;
}): Promise<AiRecommendationRecord> {
  return pb.collection('ai_recommendations').create({
    ...data,
    feedback: 'sin_calificar',
  });
}

export async function setRecommendationFeedback(
  id: string,
  feedback: RecommendationFeedback,
): Promise<void> {
  await pb.collection('ai_recommendations').update(id, { feedback });
}

export interface RecommendRequest {
  seedContext: SeedContext;
  model: string;
}

export interface RecommendResponse {
  reply?: string;
  error?: string;
  detail?: string;
  code?: string;
  model?: string;
}

export async function requestRecommendation(
  payload: RecommendRequest,
): Promise<RecommendResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: payload.model,
      seedContext: payload.seedContext,
    }),
  });
  const text = await res.text();
  let data: RecommendResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor.'
        : `El chat no respondió (${res.status}). ¿Redeployaste con pb_hooks?`,
    );
  }
  if (!res.ok) {
    if (data.error) return data;
    throw new Error(data.detail ? `${data.error}: ${data.detail}` : `Error ${res.status}`);
  }
  return data;
}

export function refKey(item: { kind: string; id: string }) {
  return `${item.kind}:${item.id}`;
}
