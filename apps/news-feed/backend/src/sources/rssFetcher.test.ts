import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockResolvedValue({
      items: [
        {
          title: 'Test article',
          link: 'https://example.com/article-1',
          contentSnippet: 'Article content here',
          isoDate: '2026-04-08T10:00:00.000Z',
          guid: 'https://example.com/article-1',
        },
        {
          title: 'Article without link',
          link: undefined,
          contentSnippet: 'No link',
          isoDate: '2026-04-08T09:00:00.000Z',
        },
      ],
    }),
  })),
}));

import { rssFetcher } from './rssFetcher';
import type { RssSource } from './types';

describe('rssFetcher', () => {
  const source: RssSource = { id: 'test-rss', type: 'rss', label: 'Test', url: 'https://example.com/feed' };

  it('returns RawArticle array from RSS feed', async () => {
    const articles = await rssFetcher(source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Test article');
    expect(articles[0].url).toBe('https://example.com/article-1');
    expect(articles[0].sourceId).toBe('test-rss');
    expect(articles[0].rawContent).toBe('Article content here');
  });

  it('generates stable externalId from url', async () => {
    const articles = await rssFetcher(source);
    expect(articles[0].externalId).toBe('test-rss::https://example.com/article-1');
  });

  it('returns empty array on parse failure', async () => {
    vi.mocked((await import('rss-parser')).default).mockImplementationOnce(() => ({
      parseURL: vi.fn().mockRejectedValue(new Error('Network error')),
    }) as any);
    const articles = await rssFetcher(source);
    expect(articles).toEqual([]);
  });
});
