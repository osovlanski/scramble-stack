import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

export function CustomNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as DiagramNodeData;
  const icon = nodeData.color ? '🔷' : '⬜';
  return <BaseNode data={nodeData} selected={selected} icon={icon} color={nodeData.color ?? '#6366f1'} />;
}
