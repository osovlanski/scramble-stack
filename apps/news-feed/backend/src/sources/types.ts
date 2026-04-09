export interface RssSource {
  id: string;
  type: 'rss';
  label: string;
  url: string;
  lang?: string;
}

export interface RedditSource {
  id: string;
  type: 'reddit';
  label: string;
  subreddits: string[];
  limit?: number;
}

export interface RsshubSource {
  id: string;
  type: 'rsshub';
  label: string;
  rsshubRoute: string;
}

export type SourceConfig = RssSource | RedditSource | RsshubSource;

export interface RawArticle {
  externalId: string;
  title: string;
  url: string;
  sourceId: string;
  publishedAt: Date;
  rawContent: string;
}

export type Theme = 'infra' | 'ai-ml' | 'security' | 'frontend' | 'data' | 'cloud' | 'culture' | 'tooling';
export type Signal = 'real' | 'hype' | 'noise';
export type Action = 'adopt' | 'watch' | 'avoid';

export interface EnrichedArticle extends RawArticle {
  id: string;
  summary: string;
  themes: Theme[];
  signal: Signal;
  action: Action | null;
  insight: string;
  curatedAt: Date;
}

export interface UserPreferenceProfile {
  themeWeights: Record<Theme, number>;
  signalWeights: Record<Signal, number>;
  actionWeights: Record<Action | 'null', number>;
  sourceWeights: Record<string, number>;
  summary: string;
  updatedAt: string;
}

export function defineSource<T extends SourceConfig>(source: T): T {
  return source;
}
