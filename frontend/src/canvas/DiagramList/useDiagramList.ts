import { useState, useEffect, useCallback } from 'react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramMeta } from '../../services/canvasApi';

interface UseDiagramListReturn {
  diagrams: DiagramMeta[];
  loading: boolean;
  error: string | null;
  createDiagram: (name: string) => Promise<string>;
  deleteDiagram: (id: string) => Promise<void>;
  refresh: () => void;
}

export function useDiagramList(): UseDiagramListReturn {
  const [diagrams, setDiagrams] = useState<DiagramMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await canvasApi.listDiagrams();
      setDiagrams(result);
    } catch {
      setError('Could not load diagrams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createDiagram = async (name: string): Promise<string> => {
    const diagram = await canvasApi.createDiagram(name);
    await load();
    return diagram.id;
  };

  const deleteDiagram = async (id: string): Promise<void> => {
    await canvasApi.deleteDiagram(id);
    setDiagrams(prev => prev.filter(d => d.id !== id));
  };

  return { diagrams, loading, error, createDiagram, deleteDiagram, refresh: load };
}
