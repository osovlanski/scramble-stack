import axios from 'axios';
import type { FeedResponse, DigestResponse } from './types';

const http = axios.create({ baseURL: '/api' });

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
