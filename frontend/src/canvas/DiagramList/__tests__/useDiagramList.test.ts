import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../services/canvasApi', () => ({
  canvasApi: {
    listDiagrams: vi.fn(),
    createDiagram: vi.fn(),
    deleteDiagram: vi.fn(),
  },
}));

import { useDiagramList } from '../useDiagramList';
import { canvasApi } from '../../../services/canvasApi';

const mockApi = {
  listDiagrams: vi.mocked(canvasApi.listDiagrams),
  createDiagram: vi.mocked(canvasApi.createDiagram),
  deleteDiagram: vi.mocked(canvasApi.deleteDiagram),
};

const mockDiagrams = [
  { id: '1', name: 'System A', createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: '2', name: 'System B', createdAt: '2026-04-02T00:00:00Z', updatedAt: '2026-04-02T00:00:00Z' },
];

beforeEach(() => vi.clearAllMocks());

describe('useDiagramList', () => {
  it('loads diagrams on mount', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    const { result } = renderHook(() => useDiagramList());

    await act(async () => await new Promise(r => setTimeout(r, 50)));

    expect(result.current.diagrams).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it('creates a new diagram and refreshes list', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    mockApi.createDiagram.mockResolvedValue({ id: '3', name: 'New Diagram', nodes: [], edges: [], createdAt: '2026-04-03T00:00:00Z', updatedAt: '2026-04-03T00:00:00Z' });

    const { result } = renderHook(() => useDiagramList());
    await act(async () => {
      await result.current.createDiagram('New Diagram');
    });

    expect(mockApi.createDiagram).toHaveBeenCalledWith('New Diagram');
    expect(mockApi.listDiagrams).toHaveBeenCalledTimes(2);
  });

  it('deletes a diagram and removes it from state', async () => {
    mockApi.listDiagrams.mockResolvedValue(mockDiagrams);
    mockApi.deleteDiagram.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDiagramList());
    await act(async () => await new Promise(r => setTimeout(r, 50)));

    await act(async () => {
      await result.current.deleteDiagram('1');
    });

    expect(result.current.diagrams.find(d => d.id === '1')).toBeUndefined();
  });
});
