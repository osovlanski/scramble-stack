import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../services/canvasApi', () => ({
  canvasApi: { streamGenerate: vi.fn() },
}));

import { useAIGenerator } from '../useAIGenerator';
import { canvasApi } from '../../../services/canvasApi';

const mockStreamGenerate = vi.mocked(canvasApi.streamGenerate);

beforeEach(() => vi.clearAllMocks());

describe('useAIGenerator', () => {
  it('starts with idle state', () => {
    const { result } = renderHook(() => useAIGenerator());
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.streamedNodes).toHaveLength(0);
  });

  it('appends nodes as they stream in', async () => {
    const node = { id: 'n1', type: 'microservice', position: { x: 0, y: 0 }, data: { label: 'Service', nodeType: 'microservice' } };

    mockStreamGenerate.mockImplementation(async (_prompt: string, onNode: (n: unknown) => void, _onEdge: unknown, _onMeta: unknown, onDone: () => void) => {
      onNode(node);
      onDone();
    });

    const { result } = renderHook(() => useAIGenerator());
    await act(async () => {
      await result.current.generate('design a simple app');
    });

    expect(result.current.streamedNodes).toHaveLength(1);
    expect(result.current.isGenerating).toBe(false);
  });

  it('sets error on stream failure', async () => {
    mockStreamGenerate.mockImplementation(async (_p: string, _n: unknown, _e: unknown, _m: unknown, _d: unknown, onError: (msg: string) => void) => {
      onError('Generation failed. Please try again.');
    });

    const { result } = renderHook(() => useAIGenerator());
    await act(async () => {
      await result.current.generate('bad prompt');
    });

    expect(result.current.error).toBe('Generation failed. Please try again.');
    expect(result.current.isGenerating).toBe(false);
  });

  it('cancel stops the stream and retains partial nodes', async () => {
    const node = { id: 'n1', type: 'microservice', position: { x: 0, y: 0 }, data: { label: 'A', nodeType: 'microservice' } };

    mockStreamGenerate.mockImplementation(async (_p: string, onNode: (n: unknown) => void) => {
      onNode(node);
      await new Promise(() => {}); // hang forever
    });

    const { result } = renderHook(() => useAIGenerator());

    act(() => { result.current.generate('test').catch(() => {}); });

    await act(async () => {
      result.current.cancel();
      await new Promise(r => setTimeout(r, 50));
    });

    expect(result.current.streamedNodes).toHaveLength(1);
    expect(result.current.isGenerating).toBe(false);
  });
});
