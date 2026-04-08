import type { NodeType } from '@shared/types';

interface PaletteItemProps {
  type: NodeType;
  label: string;
  icon?: string;
}

export default function PaletteItem({ type, label, icon }: PaletteItemProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.setData('application/reactflow-label', label);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700/60 hover:bg-slate-600 cursor-grab text-sm text-slate-200 select-none transition-colors"
    >
      <span className="text-base w-5 text-center flex-shrink-0">{icon ?? '▪'}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
