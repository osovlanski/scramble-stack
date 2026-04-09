import axios from 'axios';
import type { RedditSource, RawArticle } from './types';

export async function redditFetcher(source: RedditSource): Promise<RawArticle[]> {
  const limit = source.limit ?? 20;
  const articles: RawArticle[] = [];

  for (const subreddit of source.subreddits) {
    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=${Math.ceil(limit / source.subreddits.length)}`,
        { headers: { 'User-Agent': 'ScrambleStack/1.0' }, timeout: 8000 }
      );
      const posts: any[] = response.data?.data?.children ?? [];
      for (const post of posts) {
        const data = post.data;
        if (data.is_self || !data.url) continue;
        articles.push({
          externalId: `${source.id}::reddit-${data.id}`,
          title: data.title,
          url: data.url,
          sourceId: source.id,
          publishedAt: new Date(data.created_utc * 1000),
          rawContent: data.selftext || `r/${subreddit} · ${data.score} upvotes`,
        });
      }
    } catch {
      // skip failed subreddit
    }
    if (articles.length >= limit) break;
  }

  return articles.slice(0, limit);
}
