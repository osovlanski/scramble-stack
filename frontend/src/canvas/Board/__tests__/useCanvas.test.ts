import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.useFakeTimers();

vi.mock('../../../services/canvasApi', () => ({
  canvasApi: {
    saveDiagram: vi.fn().mockResolvedValue(undefined),
    getDiagram: vi.fn().mockResolvedValue({
      id: 'diag-1', name: 'Test', nodes: [], edges: [], createdAt: '', updatedAt: '',
    }),
  },
}));

vi.mock('@xyflow/react', () => ({
  useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useReactFlow: vi.fn(() => ({ getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })) })),
}));

import { useCanvas } from '../useCanvas';
import { canvasApi } from '../../../services/canvasApi';

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllTimers());

describe('useCanvas', () => {
  it('initialises with idle save status', () => {
    const { result } = renderHook(() => useCanvas('diag-1'));
    expect(result.current.saveStatus).toBe('idle');
  });

  it('calls saveDiagram after triggerSave is called', async () => {
    const { result } = renderHook(() => useCanvas('diag-1'));

    act(() => {
      result.current.triggerSave();
      vi.runAllTimers();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(canvasApi.saveDiagram).toHaveBeenCalledWith('diag-1', expect.any(Object));
  });
});
