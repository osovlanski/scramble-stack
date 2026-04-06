import type { NodeProps } from '@xyflow/react';
import { NodeResizer } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

function CloudGroupNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 min-w-[200px] min-h-[150px] bg-slate-900/50 ${
        selected ? 'border-blue-400' : 'border-slate-600'
      }`}
    >
      <NodeResizer minWidth={150} minHeight={100} isVisible={selected} color="#3b82f6" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {(data as DiagramNodeData).label}
      </span>
    </div>
  );
}

export const CloudRegionNode = CloudGroupNode;
export const AvailabilityZoneNode = CloudGroupNode;
