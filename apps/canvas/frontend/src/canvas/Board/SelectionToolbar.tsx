import { useReactFlow } from '@xyflow/react';

interface SelectionToolbarProps {
  selectedNodeId: string | null;
}

export default function SelectionToolbar({ selectedNodeId }: SelectionToolbarProps) {
  const { deleteElements } = useReactFlow();

  if (!selectedNodeId) return null;

  const deleteSelected = () => {
    deleteElements({ nodes: [{ id: selectedNodeId }] });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 z-10">
      <button onClick={deleteSelected} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-slate-700">
        Delete
      </button>
    </div>
  );
}
