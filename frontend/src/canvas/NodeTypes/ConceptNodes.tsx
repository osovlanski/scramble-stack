import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'rate-limiter': '🚦',
  'api-gateway': '🚪',
  'service-mesh': '🕸️',
};

function makeConceptNode(type: string, defaultColor: string) {
  return function ConceptNode({ data, selected }: NodeProps) {
    return <BaseNode data={data as DiagramNodeData} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const RateLimiterNode = makeConceptNode('rate-limiter', '#f59e0b');
export const ApiGatewayNode = makeConceptNode('api-gateway', '#8b5cf6');
export const ServiceMeshNode = makeConceptNode('service-mesh', '#10b981');
