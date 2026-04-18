import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../personalization/interactionTracker', () => ({
  recordInteraction: vi.fn().mockResolvedValue(undefined),
}));

import { postInteraction } from './interactionController';
import { recordInteraction } from '../personalization/interactionTracker';

const mockRes = () => {
  const res = {} as Response;
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
};

describe('postInteraction', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('records a valid interaction', async () => {
    const req = { params: { id: 'art-1' }, body: { type: 'thumb_up' } } as unknown as Request;
    const res = mockRes();
    await postInteraction(req, res);
    expect(recordInteraction).toHaveBeenCalledWith({ articleId: 'art-1', type: 'thumb_up', value: undefined });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('returns 400 for missing interaction type', async () => {
    const req = { params: { id: 'art-1' }, body: {} } as unknown as Request;
    const res = mockRes();
    await postInteraction(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 with error message when recordInteraction throws', async () => {
    vi.mocked(recordInteraction).mockRejectedValueOnce(new Error('Invalid interaction type: bad'));
    const req = { params: { id: 'art-1' }, body: { type: 'bad' } } as unknown as Request;
    const res = mockRes();
    await postInteraction(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid interaction type: bad' });
  });
});
