import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'client-web': '🖥️',
  'client-mobile': '📱',
  'third-party-api': '🔌',
  'telegram-bot': '🤖',
};

function makeExternalNode(type: string, defaultColor: string) {
  return function ExternalNode({ data, selected }: NodeProps) {
    return <BaseNode data={data as DiagramNodeData} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const ClientWebNode = makeExternalNode('client-web', '#94a3b8');
export const ClientMobileNode = makeExternalNode('client-mobile', '#94a3b8');
export const ThirdPartyApiNode = makeExternalNode('third-party-api', '#f97316');
export const TelegramBotNode = makeExternalNode('telegram-bot', '#0ea5e9');
