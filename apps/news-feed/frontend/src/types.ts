export type Theme = 'infra' | 'ai-ml' | 'security' | 'frontend' | 'data' | 'cloud' | 'culture' | 'tooling';
export type Signal = 'real' | 'hype' | 'noise';
export type Action = 'adopt' | 'watch' | 'avoid';

export interface Article {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  publishedAt: string;
  summary: string;
  themes: Theme[];
  signal: Signal;
  action: Action | null;
  insight: string;
  personalScore: number;
}

export interface FeedResponse {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DigestArticle {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  themes: Theme[];
  signal: Signal;
  action: Action | null;
  personalScore: number;
}

export interface DigestResponse {
  date: string;
  briefingText: string;
  articles: DigestArticle[];
  articleCount: number;
}
