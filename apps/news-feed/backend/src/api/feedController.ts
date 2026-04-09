import type { Request, Response } from 'express';
import { prisma } from '../db';
import { generateDigest, getDigest } from '../digest/digestService';
import { runIngestion } from '../sources/ingestor';
import { runCuration } from '../curator/curatorService';
import sourcesConfig from '../../sources.config';

const PAGE_SIZE = 20;

export async function getFeed(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
  const theme = (req.query.theme as string) || undefined;
  const signal = (req.query.signal as string) || undefined;

  const where: Record<string, unknown> = { curatedAt: { not: null } };
  if (theme) where.themes = { contains: theme };
  if (signal) where.signal = signal;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { personalScore: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, url: true, sourceId: true, publishedAt: true,
        summary: true, themes: true, signal: true, action: true, insight: true,
        personalScore: true, curatedAt: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  res.json({
    articles: articles.map((a) => ({ ...a, themes: a.themes ? JSON.parse(a.themes) : [] })),
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function getTodayDigest(req: Request, res: Response): Promise<void> {
  const date = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
  const digest = await getDigest(date);

  if (!digest) {
    const { briefing, articleCount } = await generateDigest(date);
    const created = await getDigest(date);
    const articles = created ? await getDigestArticles(JSON.parse(created.articleIds)) : [];
    res.json({ date, briefingText: briefing, articles, articleCount });
    return;
  }

  const articles = await getDigestArticles(JSON.parse(digest.articleIds));
  res.json({ date, briefingText: digest.briefingText, articles, articleCount: articles.length });
}

async function getDigestArticles(ids: string[]) {
  return prisma.article.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, url: true, sourceId: true, themes: true, signal: true, action: true, personalScore: true },
    orderBy: { personalScore: 'desc' },
  });
}

export async function triggerRefresh(_req: Request, res: Response): Promise<void> {
  const { fetched } = await runIngestion(sourcesConfig);
  const { curated } = await runCuration();
  res.json({ ok: true, fetched, curated });
}
