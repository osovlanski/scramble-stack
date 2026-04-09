import Parser from 'rss-parser';
import type { RssSource, RawArticle } from './types';

export async function rssFetcher(source: RssSource): Promise<RawArticle[]> {
  const parser = new Parser();
  try {
    const feed = await parser.parseURL(source.url);
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
