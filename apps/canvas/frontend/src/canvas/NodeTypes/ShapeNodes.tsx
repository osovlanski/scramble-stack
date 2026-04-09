import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

const handleStyle = {
  width: 10,
  height: 10,
  background: '#6366f1',
  border: '2px solid #1e293b',
};

export function TextNode({ data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  return (
    <div className="group relative min-w-[80px]">
      <NodeResizer minWidth={60} minHeight={30} isVisible={selected} color="#6366f1" />
      <Handle type="target" position={Position.Top} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="target" position={Position.Left} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Right} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <div
        className={`px-2 py-1 text-sm text-slate-100 font-medium select-none ${
          selected ? 'outline outline-1 outline-indigo-500 rounded' : ''
        }`}
      >
        {nodeData.label}
      </div>
    </div>
  );
}

export function StickyNoteNode({ data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  return (
    <div className="group relative">
      <NodeResizer minWidth={120} minHeight={80} isVisible={selected} color="#eab308" />
      <Handle type="target" position={Position.Top} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="target" position={Position.Left} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Right} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <div
        className={`min-w-[120px] min-h-[80px] p-3 rounded-sm text-sm text-yellow-900 font-medium select-none border-b-4 ${
          selected ? 'border-yellow-600' : 'border-yellow-400'
        }`}
        style={{ background: '#fef08a' }}
      >
        {nodeData.label}
      </div>
    </div>
  );
}

export function RectangleNode({ data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  const borderColor = nodeData.color ?? '#6366f1';
  return (
    <div className="group relative">
      <NodeResizer minWidth={100} minHeight={60} isVisible={selected} color={borderColor} />
      <Handle type="target" position={Position.Top} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="target" position={Position.Left} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Right} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <div
        className="min-w-[100px] min-h-[60px] rounded-md flex items-center justify-center bg-slate-800/60 border-2 select-none text-sm text-slate-200 font-medium"
        style={{ borderColor }}
      >
        {nodeData.label}
      </div>
    </div>
  );
}

export function EllipseNode({ data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  const borderColor = nodeData.color ?? '#6366f1';
  return (
    <div className="group relative">
      <NodeResizer minWidth={100} minHeight={60} isVisible={selected} color={borderColor} />
      <Handle type="target" position={Position.Top} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="target" position={Position.Left} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <Handle type="source" position={Position.Right} style={handleStyle} className="!opacity-0 group-hover:!opacity-100" />
      <div
        className="min-w-[100px] min-h-[60px] rounded-full flex items-center justify-center bg-slate-800/60 border-2 select-none text-sm text-slate-200 font-medium"
        style={{ borderColor }}
      >
        {nodeData.label}
      </div>
    </div>
  );
}
