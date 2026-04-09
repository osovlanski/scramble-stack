import { prisma } from '../db';

export const VALID_TYPES = ['thumb_up', 'thumb_down', 'skip', 'not_for_me', 'view', 'dwell', 'click_from_digest'] as const;
export type InteractionType = typeof VALID_TYPES[number];

interface InteractionInput {
  articleId: string;
  type: string;
  value?: number;
}

export async function recordInteraction(input: InteractionInput): Promise<void> {
  if (!(VALID_TYPES as readonly string[]).includes(input.type)) {
    throw new Error(`Invalid interaction type: ${input.type}`);
  }

  const type = input.type as InteractionType;

  await prisma.articleInteraction.create({
    data: {
      articleId: input.articleId,
      type,
      value: input.value ?? null,
    },
  });
}
