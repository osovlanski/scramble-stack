import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  prisma: {
    article: { findMany: vi.fn() },
    digest: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('../claude', () => ({
  claudeChat: vi.fn().mockResolvedValue('Today in tech: Kubernetes and LLMs dominate.'),
}));

import { generateDigest, getDigest } from './digestService';
import { prisma } from '../db';
import { claudeChat } from '../claude';

describe('generateDigest', () => {
  beforeEach(() => vi.clearAllMocks());

  const mockArticles = Array.from({ length: 12 }, (_, i) => ({
    id: `art-${i}`,
    title: `Article ${i}`,
    summary: `Summary ${i}`,
    themes: '["infra"]',
    signal: 'real',
    action: 'adopt',
    sourceId: 'geektime',
    personalScore: 1.0 - i * 0.05,
  }));

  it('picks top 10 articles by personalScore and generates briefing', async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue(mockArticles as any);
    const result = await generateDigest('2026-04-08');
    expect(result.articleCount).toBe(10);
    expect(result.briefing).toBe('Today in tech: Kubernetes and LLMs dominate.');
  });

  it('returns existing digest without regenerating (idempotent)', async () => {
    vi.mocked(prisma.digest.findUnique).mockResolvedValue({
      id: 'd1', date: '2026-04-08', briefingText: 'Existing briefing', articleIds: '["art-0","art-1"]', createdAt: new Date(),
    } as any);
    const result = await generateDigest('2026-04-08');
    expect(result.briefing).toBe('Existing briefing');
    expect(result.articleCount).toBe(2);
    expect(claudeChat).not.toHaveBeenCalled();
    expect(prisma.digest.create).not.toHaveBeenCalled();
  });

  it('getDigest returns stored digest', async () => {
    vi.mocked(prisma.digest.findUnique).mockResolvedValue({
      id: 'd1', date: '2026-04-08', briefingText: 'Existing briefing', articleIds: '[]', createdAt: new Date(),
    } as any);
    const result = await getDigest('2026-04-08');
    expect(result?.briefingText).toBe('Existing briefing');
  });
});
