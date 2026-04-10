import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  client = new Anthropic({ apiKey });
  return client;
}

export async function claudeChat(params: {
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 2048,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  });
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}

export async function claudeConverse(params: {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  });
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}
