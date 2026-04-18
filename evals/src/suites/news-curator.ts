import type { EvalSuite } from '../types';
import { judgeWithClaude } from '../judge';

interface FeedArticle {
  id: string;
  title: string;
  summary?: string;
  insight?: string;
  themes?: string | string[];
  signal?: string;
  action?: string;
}

async function fetchFeed(baseUrl: string): Promise<FeedArticle[]> {
  const res = await fetch(`${baseUrl}/api/feed?page=1`);
  if (!res.ok) throw new Error(`GET /feed ${res.status}`);
  const body = await res.json() as { articles?: FeedArticle[] };
  return body.articles ?? [];
}

export const newsCuratorSuite: EvalSuite = {
  name: 'news-curator',
  description: 'Validate curator output quality and ranking sanity',
  cases: [
    {
      id: 'feed-returns-non-empty',
      description: 'Feed endpoint returns at least 3 curated articles',
      run: async ctx => {
        const articles = await fetchFeed(ctx.newsFeedBackendUrl);
        const pass = articles.length >= 3;
        return {
          pass,
          score: Math.min(articles.length, 10),
          maxScore: 10,
          details: `articles=${articles.length}`,
          metrics: { articleCount: articles.length },
        };
      },
    },
    {
      id: 'articles-have-insight',
      description: 'Each article has non-empty summary and insight fields',
      run: async ctx => {
        const articles = await fetchFeed(ctx.newsFeedBackendUrl);
        const withContent = articles.filter(a => (a.summary?.length ?? 0) > 20 && (a.insight?.length ?? 0) > 20);
        const pass = articles.length > 0 && withContent.length / articles.length >= 0.8;
        return {
          pass,
          score: articles.length ? withContent.length / articles.length : 0,
          maxScore: 1,
          details: `${withContent.length}/${articles.length} articles have full content`,
          metrics: { articleCount: articles.length, withContent: withContent.length },
        };
      },
    },
    {
      id: 'insight-quality',
      description: 'Claude judge confirms top-3 insights are specific and actionable',
      run: async ctx => {
        const articles = await fetchFeed(ctx.newsFeedBackendUrl);
        const top3 = articles.slice(0, 3);
        if (top3.length === 0) return { pass: false, details: 'no articles to judge' };
        const verdict = await judgeWithClaude({
          apiKey: ctx.anthropicApiKey,
          rubric:
            'Each of the provided article insights should be: (a) specific to the article (not generic), ' +
            '(b) actionable for a senior engineer (names a trade-off, pattern, or decision), ' +
            '(c) free of marketing fluff. Penalize platitudes like "this is interesting" or "worth watching".',
          artifact: top3.map((a, i) => `[${i + 1}] ${a.title}\nInsight: ${a.insight ?? '(none)'}`).join('\n\n'),
          passThreshold: 6,
        });
        return {
          pass: verdict.pass,
          score: verdict.score,
          maxScore: 10,
          details: `judge=${verdict.score}/10 — ${verdict.reasoning}`,
          metrics: { judgeScore: verdict.score, judgedCount: top3.length },
        };
      },
    },
  ],
};
