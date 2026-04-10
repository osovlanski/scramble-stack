// src/sessions/interviewService.ts
import { claudeConverse } from '../claude';
import type { Question } from '@prisma/client';

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

const INTERVIEW_SYSTEM = `You are a system design interviewer conducting a technical interview.
Ask ONE focused clarifying question at a time about scale, constraints, or requirements.
After the candidate has answered 3 questions, respond with:
"Great, I have enough context. Go ahead and design the system — walk me through your architecture."
Keep responses concise (1-3 sentences).`;

export async function getOpeningQuestion(question: Question): Promise<string> {
  return claudeConverse({
    system: INTERVIEW_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `The candidate is answering this question: "${question.title}"\n\n${question.description}\n\nAsk your first clarifying question.`,
      },
    ],
  });
}

export async function continueInterview(
  question: Question,
  messages: InterviewMessage[]
): Promise<{ content: string; readyToSubmit: boolean }> {
  const userTurnCount = messages.filter(m => m.role === 'user').length;
  const isLastClarification = userTurnCount >= 3;

  const prompt = isLastClarification
    ? 'The candidate has answered enough questions. Tell them to go ahead and design the system now.'
    : 'Continue the interview with another clarifying question.';

  const conversationHistory = [
    {
      role: 'user' as const,
      content: `Question: "${question.title}"\n\n${question.description}\n\nBegin the interview.`,
    },
    ...messages,
    { role: 'user' as const, content: prompt },
  ];

  const content = await claudeConverse({
    system: INTERVIEW_SYSTEM,
    messages: conversationHistory,
  });

  return { content, readyToSubmit: isLastClarification };
}
