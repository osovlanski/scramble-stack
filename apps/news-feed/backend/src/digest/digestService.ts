import { prisma } from '../db';
import { claudeChat } from '../claude';

const DIGEST_SYSTEM = `You are a principal tech architect writing a morning briefing for yourself.
Given a list of today's top articles (pre-selected by relevance score), write a short
Architect's Take: 3-4 sentences covering the day's main themes, what's worth attention,
and what to skip. Be direct and opinionated. Write in second person ("Today's signal...").`;

export async function generateDigest(date: string): Promise<{ articleCount: number; briefing: string }> {
  const existing = await prisma.digest.findUnique({ where: { date } });
  if (existing) return { articleCount: JSON.parse(existing.articleIds).length, briefing: existing.briefingText };

  const articles = await prisma.article.findMany({
    where: { curatedAt: { not: null } },
    orderBy: { personalScore: 'desc' },
    take: 10,
    select: { id: true, title: true, summary: true, themes: true, signal: true, action: true, sourceId: true, personalScore: true },
  });

  const top10 = articles.slice(0, 10);

  const userMessage = `Today's top articles (${date}):\n${JSON.stringify(
    top10.map((a) => ({
      title: a.title,
      summary: a.summary,
      themes: a.themes ? JSON.parse(a.themes) : [],
      signal: a.signal,
      action: a.action,
      source: a.sourceId,
    })),
    null,
    2
  )}`;

  const briefing = await claudeChat({ system: DIGEST_SYSTEM, userMessage, maxTokens: 600 });

  await prisma.digest.create({
    data: {
      date,
      briefingText: briefing,
      articleIds: JSON.stringify(top10.map((a) => a.id)),
    },
  });

  return { articleCount: top10.length, briefing };
}

export async function getDigest(date: string) {
  return prisma.digest.findUnique({ where: { date } });
}
