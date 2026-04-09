import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../db', () => ({
  prisma: {
    articleInteraction: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { recordInteraction } from './interactionTracker';
import { prisma } from '../db';

describe('recordInteraction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('records an explicit thumb_up interaction', async () => {
    await recordInteraction({ articleId: 'art-1', type: 'thumb_up' });
    expect(prisma.articleInteraction.create).toHaveBeenCalledWith({
      data: { articleId: 'art-1', type: 'thumb_up', value: null },
    });
  });

  it('records a dwell interaction with ms value', async () => {
    await recordInteraction({ articleId: 'art-2', type: 'dwell', value: 45000 });
    expect(prisma.articleInteraction.create).toHaveBeenCalledWith({
      data: { articleId: 'art-2', type: 'dwell', value: 45000 },
    });
  });

  it('throws on invalid interaction type', async () => {
    await expect(recordInteraction({ articleId: 'art-3', type: 'invalid' }))
      .rejects.toThrow('Invalid interaction type: invalid');
  });
});
