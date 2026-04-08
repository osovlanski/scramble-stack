import { prisma } from '../db';
import { claudeChat } from '../claude';
import type { UserPreferenceProfile } from '../sources/types';

const BASE_CURATOR_SYSTEM = `You are a principal tech architect reviewing engineering news.
For each article: summarise in 2-3 sentences, tag relevant themes, assess whether this
is real signal or hype, and if actionable: recommend adopt/watch/avoid.
Be opinionated and concise. Skip obvious content. Surface what a senior engineer
designing distributed systems should actually care about.

Valid themes: infra, ai-ml, security, frontend, data, cloud, culture, tooling
Valid signal: real, hype, noise
Valid action: adopt, watch, avoid (or null if not actionable)

Respond ONLY with a JSON array — no markdown, no explanation:
[{ "id": "...", "summary": "...", "themes": [...], "signal": "...", "action": "..." | null, "insight": "..." }]`;

async function getCuratorSystem(): Promise<string> {
  const row = await prisma.userPreferenceProfile.findUnique({ where: { id: 1 } });
  if (!row) return BASE_CURATOR_SYSTEM;
  try {
    const profile: UserPreferenceProfile = JSON.parse(row.profileJson);
    if (!profile.summary) return BASE_CURATOR_SYSTEM;
    return `${BASE_CURATOR_SYSTEM}\n\nUser context: ${profile.summary} Weight your signal and action recommendations accordingly.`;
  } catch {
    return BASE_CURATOR_SYSTEM;
  }
}

const BATCH_SIZE = 5;

export async function runCuration(): Promise<{ curated: number }> {
  const uncurated = await prisma.article.findMany({
    where: { curatedAt: null },
    select: { id: true, title: true, url: true, rawContent: true },
    take: BATCH_SIZE * 4,
  });

  if (uncurated.length === 0) return { curated: 0 };

  let curated = 0;
  const curatorSystem = await getCuratorSystem();

  for (let i = 0; i < uncurated.length; i += BATCH_SIZE) {
    const batch = uncurated.slice(i, i + BATCH_SIZE);

    const userMessage = `Curate these articles:\n${JSON.stringify(
      batch.map((a) => ({ id: a.id, title: a.title, content: a.rawContent.slice(0, 500) })),
      null,
      2
    )}`;

    try {
      const raw = await claudeChat({ system: curatorSystem, userMessage });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const enriched: Array<{
        id: string;
        summary: string;
        themes: string[];
        signal: string;
        action: string | null;
        insight: string;
      }> = JSON.parse(cleaned);

      for (const item of enriched) {
        if (!item.id || !item.summary || !item.signal) continue; // skip malformed items
        await prisma.article.update({
          where: { id: item.id },
          data: {
            summary: item.summary,
            themes: JSON.stringify(item.themes),
            signal: item.signal,
            action: item.action,
            insight: item.insight,
            curatedAt: new Date(),
          },
        });
        curated++;
      }
    } catch {
      // batch failed — skip, will retry next run
    }
  }

  return { curated };
}
