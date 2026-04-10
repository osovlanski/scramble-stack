import { prisma } from '../db';
import { SEED_QUESTIONS } from './questions.seed';

export async function seedQuestionsIfEmpty(): Promise<void> {
  const count = await prisma.question.count();
  if (count > 0) return;

  for (const q of SEED_QUESTIONS) {
    await prisma.question.create({
      data: {
        title: q.title,
        company: q.company,
        genre: q.genre,
        difficulty: q.difficulty,
        description: q.description,
        hints: JSON.stringify(q.hints),
        modelAnswer: q.modelAnswer,
        isAiGenerated: false,
      },
    });
  }

  console.log(`[seeder] seeded ${SEED_QUESTIONS.length} questions`);
}
