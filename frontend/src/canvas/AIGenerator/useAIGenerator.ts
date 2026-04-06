import { useState, useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramNodeData } from '@shared/types';

interface UseAIGeneratorReturn {
  isGenerating: boolean;
  streamedNodes: Node<DiagramNodeData>[];
  streamedEdges: Edge[];
  generatedMeta: { name: string; description: string } | null;
  error: string | null;
  generate: (prompt: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useAIGenerator(): UseAIGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedNodes, setStreamedNodes] = useState<Node<DiagramNodeData>[]>([]);
  const [streamedEdges, setStreamedEdges] = useState<Edge[]>([]);
  const [generatedMeta, setGeneratedMeta] = useState<{ name: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const generate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setStreamedNodes([]);
    setStreamedEdges([]);
    setGeneratedMeta(null);
    cancelledRef.current = false;

    abortRef.current = new AbortController();

    try {
      await canvasApi.streamGenerate(
        prompt,
        node => {
          if (!cancelledRef.current) {
            setStreamedNodes(prev => [...prev, node as Node<DiagramNodeData>]);
          }
        },
        edge => {
          if (!cancelledRef.current) {
            setStreamedEdges(prev => [...prev, edge as Edge]);
          }
        },
        meta => setGeneratedMeta(meta),
        () => setIsGenerating(false),
        message => {
          setError(message);
          setIsGenerating(false);
        },
        abortRef.current.signal
      );
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      }
      setIsGenerating(false);
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setStreamedNodes([]);
    setStreamedEdges([]);
    setGeneratedMeta(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return { isGenerating, streamedNodes, streamedEdges, generatedMeta, error, generate, cancel, reset };
}
