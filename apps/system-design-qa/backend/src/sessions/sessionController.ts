// src/sessions/sessionController.ts
import type { Request, Response } from 'express';
import { prisma } from '../db';
import { getOpeningQuestion, continueInterview, type InterviewMessage } from './interviewService';
import { scoreSubmission } from './scoringService';
import { fetchDiagram, diagramToText } from './diagramFetcher';

export async function createSession(req: Request, res: Response): Promise<void> {
  const { questionId, mode } = req.body as { questionId: string; mode: string };

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  const session = await prisma.session.create({
    data: { questionId, mode, status: 'in_progress', messages: '[]' },
  });

  if (mode === 'interview') {
    try {
      const openingQuestion = await getOpeningQuestion(question);
      const messages: InterviewMessage[] = [{ role: 'assistant', content: openingQuestion }];
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: { messages: JSON.stringify(messages) },
      });
      res.json({ id: updated.id, messages });
    } catch (err) {
      console.error('[sessionController] failed to get opening question:', err);
      await prisma.session.update({ where: { id: session.id }, data: { status: 'error' } });
      res.status(500).json({ error: 'Failed to start interview session' });
    }
    return;
  }

  res.json({ id: session.id, messages: [] });
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'in_progress') { res.status(400).json({ error: 'Session is not in progress' }); return; }
  if (session.mode !== 'interview') { res.status(400).json({ error: 'Only interview sessions accept messages' }); return; }

  const { content } = req.body as { content: string };
  const messages: InterviewMessage[] = JSON.parse(session.messages || '[]');
  messages.push({ role: 'user', content });

  const { content: reply, readyToSubmit } = await continueInterview(session.question, messages);
  messages.push({ role: 'assistant', content: reply });

  await prisma.session.update({
    where: { id: session.id },
    data: { messages: JSON.stringify(messages) },
  });

  res.json({ content: reply, readyToSubmit, messages });
}

export async function submitSession(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'in_progress') { res.status(400).json({ error: 'Session already submitted' }); return; }

  const { textAnswer, canvasDiagramId } = req.body as { textAnswer: string; canvasDiagramId?: string };

  let diagramText: string | undefined;
  if (canvasDiagramId) {
    const diagram = await fetchDiagram(canvasDiagramId);
    if (diagram) diagramText = diagramToText(diagram);
  }

  const messages: InterviewMessage[] = JSON.parse(session.messages || '[]');
  const interviewTranscript = session.mode === 'interview'
    ? messages.map(m => `${m.role}: ${m.content}`).join('\n')
    : undefined;

  await prisma.session.update({
    where: { id: session.id },
    data: { status: 'submitted', textAnswer, canvasDiagramId },
  });

  try {
    const result = await scoreSubmission({
      question: session.question,
      textAnswer,
      diagramText,
      interviewTranscript,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'scored',
        score: result.score,
        feedback: JSON.stringify({
          breakdown: result.breakdown,
          strengths: result.strengths,
          gaps: result.gaps,
        }),
      },
    });

    res.json({ ok: true, score: result.score });
  } catch (err) {
    console.error('[sessionController] scoring failed:', err);
    res.json({ ok: true, score: null, message: 'Scoring in progress, check result shortly' });
  }
}

export async function getResult(req: Request, res: Response): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
    include: { question: true },
  });

  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (session.status !== 'scored') { res.status(404).json({ error: 'Result not ready yet' }); return; }

  const feedback = JSON.parse(session.feedback || '{}');

  res.json({
    score: session.score,
    breakdown: feedback.breakdown,
    strengths: feedback.strengths,
    gaps: feedback.gaps,
    modelAnswer: session.question.modelAnswer,
    mode: session.mode,
  });
}
