import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

interface SelectionToolbarProps {
  selectedNodeId: string | null;
}

export default function SelectionToolbar({ selectedNodeId }: SelectionToolbarProps) {
  const { deleteElements, getNode, setNodes } = useReactFlow();
  const [notesValue, setNotesValue] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!selectedNodeId) {
      setNotesValue('');
      return;
    }
    const node = getNode(selectedNodeId);
    const nodeData = node?.data as DiagramNodeData | undefined;
    setNotesValue(nodeData?.notes ?? '');
  }, [selectedNodeId, getNode]);

  const handleNotesChange = (value: string) => {
    setNotesValue(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (!selectedNodeId) return;
      setNodes(nodes =>
        nodes.map(node => {
          if (node.id !== selectedNodeId) return node;
          return { ...node, data: { ...node.data, notes: value } };
        })
      );
    }, 300);
  };

  if (!selectedNodeId) return null;

  const deleteSelected = () => {
    deleteElements({ nodes: [{ id: selectedNodeId }] });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-10" style={{ minWidth: 280 }}>
      <div className="flex gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
        <button
          onClick={deleteSelected}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-slate-700"
        >
          Delete
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
        <textarea
          className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-xs rounded p-2 resize-none focus:outline-none focus:border-indigo-500"
          rows={3}
          placeholder="Add notes, tradeoffs, flow description..."
          value={notesValue}
          onChange={e => handleNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}
