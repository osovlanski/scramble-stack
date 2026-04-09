import { describe, it, expect, vi } from 'vitest';
import type { RsshubSource } from './types';

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        items: [
          {
            title: 'Telegram post',
            link: 'https://t.me/geektime_il/1234',
            contentSnippet: 'Post content',
            isoDate: '2026-04-08T08:00:00.000Z',
          },
        ],
      })
    ),
  })),
}));

import { rsshubFetcher } from './rsshubFetcher';

describe('rsshubFetcher', () => {
  const source: RsshubSource = {
    id: 'tg-geektime',
    type: 'rsshub',
    label: 'GeekTime Telegram',
    rsshubRoute: '/telegram/channel/geektime_il',
  };

  it('builds rsshub.app URL from route and fetches as RSS', async () => {
    const articles = await rsshubFetcher(source);
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Telegram post');
    expect(articles[0].sourceId).toBe('tg-geektime');
    expect(articles[0].externalId).toBe('tg-geektime::https://t.me/geektime_il/1234');
  });
});
