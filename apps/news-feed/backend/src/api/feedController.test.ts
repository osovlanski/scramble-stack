import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../db', () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(42),
    },
    digest: { findUnique: vi.fn() },
  },
}));

vi.mock('../digest/digestService', () => ({
  generateDigest: vi.fn().mockResolvedValue({ articleCount: 10, briefing: 'Today...' }),
  getDigest: vi.fn(),
}));

vi.mock('../sources/ingestor', () => ({ runIngestion: vi.fn().mockResolvedValue({ fetched: 5 }) }));
vi.mock('../curator/curatorService', () => ({ runCuration: vi.fn().mockResolvedValue({ curated: 3 }) }));

import { getFeed, getTodayDigest, triggerRefresh } from './feedController';
import { prisma } from '../db';
import { getDigest, generateDigest } from '../digest/digestService';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

const mockDigestArticles = [
  { id: 'a1', title: 'Test', themes: '["infra"]', signal: 'real', action: 'adopt', sourceId: 'geektime', personalScore: 1.2 },
];

describe('getFeed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns paginated articles', async () => {
    const articles = [{ id: 'a1', title: 'Test', themes: '["infra"]', signal: 'real', action: 'adopt', sourceId: 'geektime', personalScore: 1.2, publishedAt: new Date(), summary: 'S', insight: 'I', curatedAt: new Date() }];
    vi.mocked(prisma.article.findMany).mockResolvedValue(articles as any);

    const req = { query: { page: '1', theme: '' } } as unknown as Request;
    const res = mockRes();
    await getFeed(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ articles: expect.any(Array), total: 42 })
    );
  });

  it('defaults to page 1 for non-numeric page param', async () => {
    vi.mocked(prisma.article.findMany).mockResolvedValue([]);
    const req = { query: { page: 'abc' } } as unknown as Request;
    const res = mockRes();
    await getFeed(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });
});

describe('getTodayDigest', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns existing digest without regenerating', async () => {
    vi.mocked(getDigest).mockResolvedValue({
      id: 'd1', date: '2026-04-09', briefingText: 'Existing briefing', articleIds: '["a1"]', createdAt: new Date(),
    } as any);
    vi.mocked(prisma.article.findMany).mockResolvedValue(mockDigestArticles as any);

    const req = { query: { date: '2026-04-09' } } as unknown as Request;
    const res = mockRes();
    await getTodayDigest(req, res);

    expect(generateDigest).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ briefingText: 'Existing briefing' }));
  });

  it('generates digest when not found then returns it', async () => {
    vi.mocked(getDigest)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'd2', date: '2026-04-09', briefingText: 'New briefing', articleIds: '["a1"]', createdAt: new Date() } as any);
    vi.mocked(prisma.article.findMany).mockResolvedValue(mockDigestArticles as any);

    const req = { query: { date: '2026-04-09' } } as unknown as Request;
    const res = mockRes();
    await getTodayDigest(req, res);

    expect(generateDigest).toHaveBeenCalledWith('2026-04-09');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ briefingText: 'New briefing' }));
  });
});

describe('triggerRefresh', () => {
  it('returns fetched and curated counts', async () => {
    const req = {} as Request;
    const res = mockRes();
    await triggerRefresh(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true, fetched: 5, curated: 3 });
  });
});
