import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const JUDGE_MODEL = 'claude-sonnet-4-6';

const judgeSchema = z.object({
  score: z.number().min(0).max(10),
  reasoning: z.string(),
  pass: z.boolean(),
});

export type JudgeVerdict = z.infer<typeof judgeSchema>;

export async function judgeWithClaude(params: {
  apiKey: string;
  rubric: string;
  artifact: string;
  passThreshold?: number;
}): Promise<JudgeVerdict> {
  const { apiKey, rubric, artifact, passThreshold = 6 } = params;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    system:
      'You are an impartial evaluator. Respond with a single JSON object matching the schema provided. ' +
      'Do not include any text outside the JSON.',
    messages: [
      {
        role: 'user',
        content:
          `Evaluate the ARTIFACT against the RUBRIC. Score 0–10 (10 = excellent, 0 = unusable). ` +
          `Set pass=true only if score >= ${passThreshold}. ` +
          `Respond with JSON: {"score": number, "reasoning": string, "pass": boolean}.\n\n` +
          `RUBRIC:\n${rubric}\n\nARTIFACT:\n${artifact}`,
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Judge returned no text block');
  }

  const trimmed = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(trimmed);
  return judgeSchema.parse(parsed);
}
