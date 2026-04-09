import Parser from 'rss-parser';
import type { RsshubSource, RawArticle } from './types';

const RSSHUB_BASE = 'https://rsshub.app';

export async function rsshubFetcher(source: RsshubSource): Promise<RawArticle[]> {
  const parser = new Parser();
  const url = `${RSSHUB_BASE}${source.rsshubRoute}`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items
      .filter((item) => Boolean(item.link))
      .map((item) => ({
        externalId: `${source.id}::${item.link!}`,
        title: item.title ?? 'Untitled',
        url: item.link!,
        sourceId: source.id,
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        rawContent: item.contentSnippet ?? item.content ?? '',
      }));
  } catch {
    return [];
  }
}
