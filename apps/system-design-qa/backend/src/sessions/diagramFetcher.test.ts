// src/sessions/diagramFetcher.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');

import { fetchDiagram, DiagramExport } from './diagramFetcher';
import axios from 'axios';

describe('fetchDiagram', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns diagram export on success', async () => {
    const mockData: DiagramExport = {
      name: 'Twitter Design',
      nodes: [{ id: 'n1', type: 'service', data: { label: 'Tweet Service' } }],
      edges: [{ source: 'n1', target: 'n2' }],
    };
    vi.mocked(axios.get).mockResolvedValue({ data: mockData });
    const result = await fetchDiagram('diag-1');
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/diagrams/diag-1/export'),
      expect.any(Object)
    );
  });

  it('returns null when diagram not found', async () => {
    vi.mocked(axios.get).mockRejectedValue({ response: { status: 404 } });
    const result = await fetchDiagram('missing');
    expect(result).toBeNull();
  });
});
