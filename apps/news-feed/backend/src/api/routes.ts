import { Router } from 'express';
import { getFeed, getTodayDigest, triggerRefresh } from './feedController';
import { postInteraction } from './interactionController';

export const feedRouter = Router();

feedRouter.get('/feed', getFeed);
feedRouter.get('/digest', getTodayDigest);
feedRouter.post('/sources/refresh', triggerRefresh);
feedRouter.post('/articles/:id/interact', postInteraction);
