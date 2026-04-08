import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  microservice: '⚙️',
  server: '🖥️',
  serverless: '⚡',
  container: '📦',
};

function makeComputeNode(type: string, defaultColor: string) {
  return function ComputeNode({ data, selected }: NodeProps) {
    return <BaseNode data={data as DiagramNodeData} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const MicroserviceNode = makeComputeNode('microservice', '#6366f1');
export const ServerNode = makeComputeNode('server', '#64748b');
export const ServerlessNode = makeComputeNode('serverless', '#f59e0b');
export const ContainerNode = makeComputeNode('container', '#06b6d4');
