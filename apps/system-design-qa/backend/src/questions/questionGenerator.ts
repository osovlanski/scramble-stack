import { claudeChat } from '../claude';
import { prisma } from '../db';

const SYSTEM = `You are a system design interviewer. Generate a system design interview question as JSON with these exact fields:
{
  "title": "Design X",
  "description": "2-3 sentence scenario with scale requirements",
  "hints": ["hint1", "hint2", "hint3", "hint4"],
  "modelAnswer": "A thorough model answer covering components, data model, scalability, and tradeoffs"
}
Return only valid JSON, no markdown.`;

export async function generateQuestion(params: {
  company?: string;
  genre: string;
  difficulty: string;
  topic?: string;
}): Promise<{ id: string }> {
  const context = [
    params.company ? `Company: ${params.company}` : '',
    `Genre: ${params.genre}`,
    `Difficulty: ${params.difficulty}`,
    params.topic ? `Topic inspiration: ${params.topic}` : '',
  ].filter(Boolean).join(', ');

  const raw = await claudeChat({
    system: SYSTEM,
    userMessage: `Generate a system design question. ${context}`,
    maxTokens: 2048,
  });

  let parsed: { title: string; description: string; hints: string[]; modelAnswer: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse question from Claude response');
  }

  if (!parsed.title || !parsed.description || !Array.isArray(parsed.hints) || !parsed.modelAnswer) {
    throw new Error('Claude response missing required fields');
  }

  const question = await prisma.question.create({
    data: {
      title: parsed.title,
      company: params.company ?? null,
      genre: params.genre,
      difficulty: params.difficulty,
      description: parsed.description,
      hints: JSON.stringify(parsed.hints),
      modelAnswer: parsed.modelAnswer,
      isAiGenerated: true,
    },
  });

  return { id: question.id };
}
