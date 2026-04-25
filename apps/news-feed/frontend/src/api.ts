import axios from 'axios';
import type { FeedResponse, DigestResponse } from './types';

// Use `||` (not `??`) so an empty-string env var (e.g. `VITE_NEWS_FEED_API_URL=` in .env,
// which Vite reads as "") still falls back to the dev-server proxy at /api. `??` only
// triggers on null/undefined; an empty string would silently send every request to the
// SPA root and crash on JSON parse of the returned HTML.
const baseURL = (import.meta.env.VITE_NEWS_FEED_API_URL || '/api').replace(/\/$/, '');
const http = axios.create({ baseURL });

export async function fetchFeed(params: { page?: number; theme?: string; signal?: string }): Promise<FeedResponse> {
  const { data } = await http.get<FeedResponse>('/feed', { params });
  return data;
}

export async function fetchDigest(date?: string): Promise<DigestResponse> {
  const { data } = await http.get<DigestResponse>('/digest', { params: date ? { date } : {} });
  return data;
}

export async function recordInteraction(articleId: string, type: string, value?: number): Promise<void> {
  await http.post(`/articles/${articleId}/interact`, { type, value });
}

export async function triggerRefresh(): Promise<{ fetched: number; curated: number }> {
  const { data } = await http.post('/sources/refresh');
  return data;
}
