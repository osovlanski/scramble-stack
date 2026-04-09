import { Router } from 'express';
import { getFeed, getTodayDigest, triggerRefresh } from './feedController';

export const feedRouter = Router();

feedRouter.get('/feed', getFeed);
feedRouter.get('/digest', getTodayDigest);
feedRouter.post('/sources/refresh', triggerRefresh);
// POST /articles/:id/interact added in Task 19
