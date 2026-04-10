// src/api/routes.ts
import { Router } from 'express';
import { getQuestions, getQuestion } from '../questions/questionController';
import { postGenerateQuestion } from '../questions/generateController';
import { createSession, sendMessage, submitSession, getResult } from '../sessions/sessionController';

const router = Router();

router.get('/questions', getQuestions);
router.get('/questions/:id', getQuestion);
router.post('/questions/generate', postGenerateQuestion);

router.post('/sessions', createSession);
router.post('/sessions/:id/message', sendMessage);
router.post('/sessions/:id/submit', submitSession);
router.get('/sessions/:id/result', getResult);

export default router;
