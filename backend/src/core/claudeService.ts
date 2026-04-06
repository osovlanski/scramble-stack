import Anthropic from '@anthropic-ai/sdk';
import https from 'https';
import logger from './logger';
import type { GenerateDiagramResponse, NodeType } from '@shared/types';

const VALID_NODE_TYPES: NodeType[] = [
  'load-balancer', 'cdn', 'dns', 'firewall', 'vpn',
  'microservice', 'server', 'serverless', 'container',
  'sql-db', 'nosql-db', 'cache', 'message-queue', 'data-warehouse', 'object-storage',
  'client-web', 'client-mobile', 'third-party-api', 'telegram-bot',
  'cloud-region', 'availability-zone',
  'rate-limiter', 'api-gateway', 'service-mesh',
  'custom',
];

class ClaudeService {
  private client: Anthropic | null = null;

  private initializeClient(): void {
    if (this.client) return;

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    this.client = new Anthropic({
      apiKey,
      httpAgent: process.env.NODE_ENV !== 'production'
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }

  async generateText(prompt: string, maxTokens = 4096): Promise<string> {
    this.initializeClient();
    const message = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = message.content.find(b => b.type === 'text');
    return block?.type === 'text' ? block.text : '';
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { maxTokens?: number; system?: string }
  ): Promise<{ content: string }> {
    this.initializeClient();
    const response = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens ?? 1500,
      system: options?.system,
      messages,
    });
    const block = response.content.find(b => b.type === 'text');
    return { content: block?.type === 'text' ? block.text : '' };
  }

  async analyzeImage(
    base64Image: string,
    prompt: string,
    mimeType: string = 'image/jpeg',
    maxTokens = 2000
  ): Promise<string> {
    this.initializeClient();

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType}`);
    }

    const message = await this.client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const block = message.content.find(b => b.type === 'text');
    return block?.type === 'text' ? block.text : '';
  }

  async generateDiagram(prompt: string): Promise<GenerateDiagramResponse> {
    const systemPrompt = `You are a system design expert. Generate a system architecture diagram.

Return ONLY valid JSON (no markdown, no backticks):
{
  "name": "Short diagram name (3-5 words)",
  "description": "One sentence description",
  "nodes": [
    {
      "id": "node_1",
      "type": "api-gateway",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "API Gateway",
        "nodeType": "api-gateway",
        "technology": "Kong",
        "description": "Routes incoming requests"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "HTTP",
      "animated": false
    }
  ]
}

Valid nodeType values: ${VALID_NODE_TYPES.join(', ')}

Layout rules:
- Clients at y=50, gateways/LBs at y=220, services at y=400, databases at y=580
- Start x at 100, use 250px horizontal spacing between nodes at the same y level
- Center nodes by layer: if 3 services, center them around x=400`;

    const { content: response } = await this.chat(
      [{ role: 'user', content: `Design prompt: ${prompt}` }],
      { system: systemPrompt, maxTokens: 4000 }
    );

    const clean = response.replace(/```json|```/g, '').trim();
    let result: GenerateDiagramResponse;

    try {
      result = JSON.parse(clean) as GenerateDiagramResponse;
    } catch {
      logger.fail('Failed to parse Claude diagram response', { raw: clean.slice(0, 200) });
      throw new Error('Claude returned invalid JSON for diagram generation');
    }

    result.nodes = result.nodes.map(node => ({
      ...node,
      type: VALID_NODE_TYPES.includes(node.type as NodeType) ? node.type : 'custom',
      data: {
        ...node.data,
        nodeType: VALID_NODE_TYPES.includes(node.data.nodeType as NodeType)
          ? node.data.nodeType
          : 'custom',
      },
    }));

    return result;
  }
}

export default new ClaudeService();
