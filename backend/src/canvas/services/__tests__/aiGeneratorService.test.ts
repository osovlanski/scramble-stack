import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GenerateDiagramResponse } from '@shared/types';

const mockGenerateDiagram = vi.hoisted(() => vi.fn());

vi.mock('../../../core/claudeService', () => ({
  default: { generateDiagram: mockGenerateDiagram },
}));

import { aiGeneratorService } from '../aiGeneratorService';

const validResponse: GenerateDiagramResponse = {
  name: 'Ride Sharing App',
  description: 'Basic ride sharing architecture',
  nodes: [
    { id: 'n1', type: 'client-mobile', position: { x: 100, y: 50 }, data: { label: 'Mobile App', nodeType: 'client-mobile' } },
    { id: 'n2', type: 'api-gateway', position: { x: 100, y: 220 }, data: { label: 'API Gateway', nodeType: 'api-gateway', technology: 'Kong' } },
  ],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'HTTPS' }],
};

beforeEach(() => vi.clearAllMocks());

describe('aiGeneratorService.generate', () => {
  it('returns valid diagram from Claude response', async () => {
    mockGenerateDiagram.mockResolvedValue(validResponse);
    const result = await aiGeneratorService.generate('design a ride sharing app');
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.name).toBe('Ride Sharing App');
  });

  it('falls back to custom node type for unknown types', async () => {
    mockGenerateDiagram.mockResolvedValue({
      ...validResponse,
      nodes: [
        { id: 'n1', type: 'unknown-type', position: { x: 0, y: 0 }, data: { label: 'X', nodeType: 'unknown-type' } },
      ],
    });
    const result = await aiGeneratorService.generate('test prompt');
    expect(result.nodes[0].type).toBe('custom');
    expect(result.nodes[0].data.nodeType).toBe('custom');
  });

  it('throws with clear message when Claude returns malformed JSON', async () => {
    mockGenerateDiagram.mockRejectedValue(new Error('Claude returned invalid JSON'));
    await expect(aiGeneratorService.generate('bad prompt')).rejects.toThrow('Claude returned invalid JSON');
  });
});
