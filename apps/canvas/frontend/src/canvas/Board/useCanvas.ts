import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramNodeData } from '@shared/types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseCanvasReturn {
  nodes: Node<DiagramNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<DiagramNodeData>>;
  onEdgesChange: OnEdgesChange;
  setNodes: (nodes: Node<DiagramNodeData>[] | ((prev: Node<DiagramNodeData>[]) => Node<DiagramNodeData>[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  saveStatus: SaveStatus;
  diagramName: string;
  setDiagramName: (name: string) => void;
  triggerSave: () => void;
}

const DEBOUNCE_MS = 1500;

export function useCanvas(diagramId: string): UseCanvasReturn {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DiagramNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [diagramName, setDiagramName] = useState('Untitled Diagram');
  const { getViewport } = useReactFlow();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    canvasApi.getDiagram(diagramId).then(diagram => {
      setNodes(diagram.nodes as Node<DiagramNodeData>[]);
      setEdges(diagram.edges as Edge[]);
      setDiagramName(diagram.name);
    });
  }, [diagramId]);

  const performSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      let thumbnail: string | null = null;
      const canvasEl = document.querySelector('.react-flow') as HTMLElement | null;
      if (canvasEl) {
        try {
          thumbnail = await toPng(canvasEl, { quality: 0.6, width: 400, height: 250 });
        } catch {
          // thumbnail generation is best-effort
        }
      }

      await canvasApi.saveDiagram(diagramId, {
        name: diagramName,
        nodes,
        edges,
        viewport: getViewport(),
        thumbnail,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [diagramId, diagramName, nodes, edges, getViewport]);

  const triggerSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(performSave, DEBOUNCE_MS);
  }, [performSave]);

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    triggerSave();
  }, [nodes, edges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    saveStatus,
    diagramName,
    setDiagramName,
    triggerSave,
  };
}
