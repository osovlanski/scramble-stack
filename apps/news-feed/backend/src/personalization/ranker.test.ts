import { describe, it, expect } from 'vitest';
import { computePersonalScore, DEFAULT_PROFILE } from './ranker';
import type { UserPreferenceProfile } from '../sources/types';

describe('computePersonalScore', () => {
  const profile: UserPreferenceProfile = {
    ...DEFAULT_PROFILE,
    themeWeights: { ...DEFAULT_PROFILE.themeWeights, infra: 1.5 },
    signalWeights: { ...DEFAULT_PROFILE.signalWeights, real: 1.4 },
    actionWeights: { ...DEFAULT_PROFILE.actionWeights, adopt: 1.3 },
    sourceWeights: { geektime: 1.2 },
    summary: 'prefers infra',
    updatedAt: new Date().toISOString(),
  };

  it('multiplies theme × signal × action × source weights', () => {
    const score = computePersonalScore({
      themes: ['infra'],
      signal: 'real',
      action: 'adopt',
      sourceId: 'geektime',
    }, profile);
    // 1.0 × 1.5 × 1.4 × 1.3 × 1.2 = 3.276
    expect(score).toBeCloseTo(3.276, 2);
  });

  it('falls back to 1.0 for unknown source', () => {
    const score = computePersonalScore({
      themes: ['infra'],
      signal: 'real',
      action: null,
      sourceId: 'unknown-source',
    }, profile);
    const sourceWeight = 1.0;
    expect(score).toBeCloseTo(1.0 * 1.5 * 1.4 * DEFAULT_PROFILE.actionWeights['null'] * sourceWeight, 2);
  });

  it('returns 1.0 for all defaults', () => {
    const score = computePersonalScore({
      themes: ['infra'],
      signal: 'real',
      action: 'watch',
      sourceId: 'new-source',
    }, DEFAULT_PROFILE);
    expect(score).toBe(1.0);
  });
});
