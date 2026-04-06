import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'load-balancer': '⚖️',
  cdn: '🌐',
  dns: '📡',
  firewall: '🔥',
  vpn: '🔒',
};

function makeInfraNode(type: string, defaultColor: string) {
  return function InfraNode({ data, selected }: NodeProps) {
    return <BaseNode data={data as DiagramNodeData} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const LoadBalancerNode = makeInfraNode('load-balancer', '#f59e0b');
export const CdnNode = makeInfraNode('cdn', '#06b6d4');
export const DnsNode = makeInfraNode('dns', '#8b5cf6');
export const FirewallNode = makeInfraNode('firewall', '#ef4444');
export const VpnNode = makeInfraNode('vpn', '#10b981');
