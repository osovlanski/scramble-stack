import { prisma } from '../db';
import { SEED_QUESTIONS } from './questions.seed';

export async function seedQuestionsIfEmpty(): Promise<void> {
  const count = await prisma.question.count();
  if (count > 0) return;

  await prisma.question.createMany({
    data: SEED_QUESTIONS.map(q => ({
      title: q.title,
      company: q.company,
      genre: q.genre,
      difficulty: q.difficulty,
      description: q.description,
      hints: JSON.stringify(q.hints),
      modelAnswer: q.modelAnswer,
      isAiGenerated: false,
    })),
  });

  console.log(`[seeder] seeded ${SEED_QUESTIONS.length} questions`);
}
