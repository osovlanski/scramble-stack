import { rssFetcher } from './rssFetcher';
import { redditFetcher } from './redditFetcher';
import { rsshubFetcher } from './rsshubFetcher';
import type { SourceConfig, RawArticle } from './types';

type FetcherFn = (source: any) => Promise<RawArticle[]>;

const registry: Record<string, FetcherFn> = {
  rss: rssFetcher,
  reddit: redditFetcher,
  rsshub: rsshubFetcher,
};

export function fetchFromSource(source: SourceConfig): Promise<RawArticle[]> {
  const fetcher = registry[source.type];
  if (!fetcher) throw new Error(`No fetcher registered for source type: ${source.type}`);
  return fetcher(source);
}
