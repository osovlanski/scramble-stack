import { prisma } from '../db';

const VALID_TYPES = ['thumb_up', 'thumb_down', 'skip', 'not_for_me', 'view', 'dwell', 'click_from_digest'] as const;
type InteractionType = typeof VALID_TYPES[number];

interface InteractionInput {
  articleId: string;
  type: InteractionType;
  value?: number;
}

export async function recordInteraction(input: InteractionInput): Promise<void> {
  if (!VALID_TYPES.includes(input.type)) {
    throw new Error(`Invalid interaction type: ${input.type}`);
  }

  await prisma.articleInteraction.create({
    data: {
      articleId: input.articleId,
      type: input.type,
      value: input.value ?? null,
    },
  });
}
