// src/sessions/scoringService.ts
import { claudeChat } from '../claude';
import type { Question } from '@prisma/client';

export interface ScoreResult {
  score: number;
  breakdown: {
    scalability: number;
    data_model: number;
    component_design: number;
    reliability: number;
    tradeoffs: number;
  };
  strengths: string;
  gaps: string;
}

const SCORING_SYSTEM = `You are an expert system design interviewer. Score the candidate's answer.
Return ONLY valid JSON (no markdown) in this exact shape:
{
  "breakdown": {
    "scalability": <0-20>,
    "data_model": <0-20>,
    "component_design": <0-20>,
    "reliability": <0-20>,
    "tradeoffs": <0-20>
  },
  "strengths": "<what the candidate covered well>",
  "gaps": "<what was missing or incorrect>"
}

Scoring rubric:
- scalability (0-20): load handling, horizontal scaling, bottleneck identification
- data_model (0-20): schema design, storage choices, indexing strategy
- component_design (0-20): service decomposition, API design, separation of concerns
- reliability (0-20): fault tolerance, retries, failure mode handling
- tradeoffs (0-20): explicit CAP theorem, consistency/latency tradeoffs discussed`;

export async function scoreSubmission(params: {
  question: Question;
  textAnswer: string;
  diagramText?: string;
  interviewTranscript?: string;
}): Promise<ScoreResult> {
  const { question, textAnswer, diagramText, interviewTranscript } = params;

  const parts = [
    `Question: ${question.title}`,
    `Description: ${question.description}`,
    `Model Answer (for reference): ${question.modelAnswer}`,
    '---',
    `Candidate's Answer:\n${textAnswer}`,
  ];

  if (diagramText) parts.push(`\nCandidate's Architecture Diagram:\n${diagramText}`);
  if (interviewTranscript) parts.push(`\nInterview Transcript:\n${interviewTranscript}`);

  const raw = await claudeChat({
    system: SCORING_SYSTEM,
    userMessage: parts.join('\n'),
    maxTokens: 1024,
  });

  let parsed: { breakdown: ScoreResult['breakdown']; strengths: string; gaps: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse score from Claude response');
  }

  const { breakdown, strengths, gaps } = parsed;
  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return { score, breakdown, strengths, gaps };
}
