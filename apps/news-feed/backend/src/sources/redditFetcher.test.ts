import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import type { RedditSource } from './types';

vi.mock('axios');

const mockRedditResponse = (subreddit: string, posts: Array<{ id: string; title: string; url: string; created_utc: number; selftext: string }>) => ({
  data: {
    data: {
      children: posts.map((p) => ({ data: { ...p, is_self: false, thumbnail: '' } })),
    },
  },
});

import { redditFetcher } from './redditFetcher';

describe('redditFetcher', () => {
  const source: RedditSource = {
    id: 'reddit-eng',
    type: 'reddit',
    label: 'r/engineering',
    subreddits: ['ExperiencedDevs', 'devops'],
    limit: 5,
  };

  it('fetches posts from each subreddit and returns RawArticles', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce(mockRedditResponse('ExperiencedDevs', [
        { id: 'abc', title: 'Good article', url: 'https://example.com/a', created_utc: 1712570000, selftext: '' },
      ]))
      .mockResolvedValueOnce(mockRedditResponse('devops', [
        { id: 'xyz', title: 'Devops article', url: 'https://example.com/b', created_utc: 1712570001, selftext: '' },
      ]));

    const articles = await redditFetcher(source);
    expect(articles).toHaveLength(2);
    expect(articles[0].externalId).toBe('reddit-eng::reddit-abc');
    expect(articles[0].sourceId).toBe('reddit-eng');
    expect(articles[1].title).toBe('Devops article');
  });

  it('skips self-posts (text-only Reddit posts)', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        data: {
          children: [{ data: { id: 'self1', title: 'Ask thread', url: '', is_self: true, created_utc: 1712570000, selftext: 'discussion' } }],
        },
      },
    });
    vi.mocked(axios.get).mockResolvedValueOnce(mockRedditResponse('devops', []));

    const articles = await redditFetcher(source);
    expect(articles).toHaveLength(0);
  });

  it('returns empty array if request fails', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));
    const articles = await redditFetcher(source);
    expect(articles).toEqual([]);
  });
});
