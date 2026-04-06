import { describe, it, expect } from 'vitest';
import { exportService } from '../exportService';
import type { DiagramFull } from '@shared/types';

const mockDiagram: DiagramFull = {
  id: 'diag-1',
  name: 'Test Diagram',
  description: 'A test',
  nodes: [{ id: 'n1', type: 'microservice', position: { x: 100, y: 100 }, data: { label: 'Service', nodeType: 'microservice' } }],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'HTTP' }],
  createdAt: '2026-04-05T00:00:00.000Z',
  updatedAt: '2026-04-05T00:00:00.000Z',
};

describe('exportService.toJson', () => {
  it('returns nodes, edges, and meta', () => {
    const result = exportService.toJson(mockDiagram);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
    expect(result.meta.id).toBe('diag-1');
    expect(result.meta.name).toBe('Test Diagram');
  });

  it('does not include thumbnail in export', () => {
    const result = exportService.toJson({ ...mockDiagram, thumbnail: 'data:image/png;base64,...' });
    expect(result.meta).not.toHaveProperty('thumbnail');
  });
});
