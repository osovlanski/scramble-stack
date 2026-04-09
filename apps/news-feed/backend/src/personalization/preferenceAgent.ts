import { prisma } from '../db';
import { claudeChat } from '../claude';
import { computePersonalScore } from './ranker';
import type { Signal, Action, UserPreferenceProfile } from '../sources/types';

const MIN_INTERACTIONS = 10;

const PREFERENCE_SYSTEM = `You are analyzing a user's news reading behavior to build a preference profile.
You will receive a list of interactions (thumb_up, thumb_down, skip, not_for_me, view, dwell, click_from_digest)
along with article metadata.

Rules for weights:
- thumb_up / high dwell (>30s) / click_from_digest = strong positive signal (+30–50%)
- thumb_down / not_for_me = strong negative signal (-30–50%)
- skip = mild negative (-10–20%)
- view with low dwell (<5s) = mild negative
- Default weight is 1.0 — only adjust based on clear patterns

Respond ONLY with a JSON object matching this shape (no markdown):
{
  "themeWeights": { "infra": 1.0, "ai-ml": 1.0, "security": 1.0, "frontend": 1.0, "data": 1.0, "cloud": 1.0, "culture": 1.0, "tooling": 1.0 },
  "signalWeights": { "real": 1.0, "hype": 1.0, "noise": 1.0 },
  "actionWeights": { "adopt": 1.0, "watch": 1.0, "avoid": 1.0, "null": 1.0 },
  "sourceWeights": { "source-id": 1.0 },
  "summary": "Plain English description of patterns observed.",
  "updatedAt": "ISO timestamp"
}`;

export async function runPreferenceAgent(): Promise<{ updated: boolean }> {
  const interactions = await prisma.articleInteraction.findMany({
    take: 200,
    orderBy: { recordedAt: 'desc' },
    include: {
      article: {
        select: { themes: true, signal: true, action: true, sourceId: true },
      },
    },
  });

  if (interactions.length < MIN_INTERACTIONS) {
    return { updated: false };
  }

  try {
    const userMessage = `Interactions to analyze:\n${JSON.stringify(
      interactions.map((i) => ({
        type: i.type,
        value: i.value,
        themes: i.article?.themes ? JSON.parse(i.article.themes) : [],
        signal: i.article?.signal,
        action: i.article?.action,
        source: i.article?.sourceId,
      })),
      null,
      2
    )}`;

    const raw = await claudeChat({ system: PREFERENCE_SYSTEM, userMessage, maxTokens: 1500 });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const profile: UserPreferenceProfile = JSON.parse(cleaned);

    await prisma.userPreferenceProfile.upsert({
      where: { id: 1 },
      update: { profileJson: JSON.stringify(profile), updatedAt: new Date() },
      create: { id: 1, profileJson: JSON.stringify(profile) },
    });

    // Re-score all curated articles with new weights
    const articles = await prisma.article.findMany({
      where: { curatedAt: { not: null } },
      select: { id: true, themes: true, signal: true, action: true, sourceId: true },
    });

    for (const article of articles) {
      if (!article.themes || !article.signal) continue;
      const score = computePersonalScore(
        {
          themes: JSON.parse(article.themes),
          signal: article.signal as Signal,
          action: article.action as Action | null,
          sourceId: article.sourceId,
        },
        profile
      );
      await prisma.article.update({ where: { id: article.id }, data: { personalScore: score } });
    }

    return { updated: true };
  } catch (error) {
    console.error('[preferenceAgent] failed:', error);
    return { updated: false };
  }
}
