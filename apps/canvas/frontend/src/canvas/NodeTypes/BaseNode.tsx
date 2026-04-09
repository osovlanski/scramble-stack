import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

interface BaseNodeProps {
  data: DiagramNodeData;
  selected: boolean;
  icon: React.ReactNode;
  color?: string;
}

const handleStyle = {
  width: 10,
  height: 10,
  background: '#6366f1',
  border: '2px solid #1e293b',
  opacity: 0,
  transition: 'opacity 0.15s',
};

export default function BaseNode({ data, selected, icon, color }: BaseNodeProps) {
  const borderColor = color ?? data.color ?? '#6366f1';

  return (
    <div
      className={`group relative flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-800 border-2 min-w-[100px] cursor-grab ${
        selected ? 'shadow-lg shadow-indigo-500/30' : ''
      }`}
      style={{ borderColor }}
    >
      <NodeResizer minWidth={80} minHeight={60} isVisible={selected} color={borderColor} />

      <Handle type="target" position={Position.Top}
        style={{ ...handleStyle, top: -5 }}
        className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Bottom}
        style={{ ...handleStyle, bottom: -5 }}
        className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="target" position={Position.Left}
        style={{ ...handleStyle, left: -5 }}
        className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Right}
        style={{ ...handleStyle, right: -5 }}
        className="!opacity-0 group-hover:!opacity-100" />

      <div className="text-2xl">{icon}</div>

      <span
        className="text-xs text-slate-200 text-center font-medium max-w-[120px] truncate"
        title={data.label}
      >
        {data.label}
      </span>

      {data.technology && (
        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
          {data.technology}
        </span>
      )}

      {data.notes && (
        <span
          className="absolute bottom-1 right-1.5 text-indigo-400 text-[10px] leading-none"
          title="Has notes"
        >
          📝
        </span>
      )}
    </div>
  );
}
