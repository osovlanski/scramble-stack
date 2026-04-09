import type { Theme, Signal, Action, UserPreferenceProfile } from '../sources/types';

export const DEFAULT_PROFILE: UserPreferenceProfile = {
  themeWeights: {
    infra: 1.0, 'ai-ml': 1.0, security: 1.0, frontend: 1.0,
    data: 1.0, cloud: 1.0, culture: 1.0, tooling: 1.0,
  },
  signalWeights: { real: 1.0, hype: 1.0, noise: 1.0 },
  actionWeights: { adopt: 1.0, watch: 1.0, avoid: 1.0, null: 1.0 },
  sourceWeights: {},
  summary: 'No preferences learned yet.',
  updatedAt: new Date().toISOString(),
};

interface ArticleAttributes {
  themes: Theme[];
  signal: Signal;
  action: Action | null;
  sourceId: string;
}

export function computePersonalScore(
  article: ArticleAttributes,
  profile: UserPreferenceProfile
): number {
  const primaryTheme = article.themes[0];
  const themeWeight = primaryTheme ? (profile.themeWeights[primaryTheme] ?? 1.0) : 1.0;
  const signalWeight = profile.signalWeights[article.signal] ?? 1.0;
  const actionKey = article.action ?? 'null';
  const actionWeight = profile.actionWeights[actionKey as Action | 'null'] ?? 1.0;
  const sourceWeight = profile.sourceWeights[article.sourceId] ?? 1.0;

  return themeWeight * signalWeight * actionWeight * sourceWeight;
}
