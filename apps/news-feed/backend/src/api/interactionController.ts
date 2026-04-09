import type { Request, Response } from 'express';
import { recordInteraction } from '../personalization/interactionTracker';

export async function postInteraction(req: Request, res: Response): Promise<void> {
  const articleId = req.params.id;
  const { type, value } = req.body as { type?: unknown; value?: number };

  if (typeof type !== 'string' || !type) {
    res.status(400).json({ error: 'type is required' });
    return;
  }

  try {
    await recordInteraction({ articleId, type, value });
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
}
