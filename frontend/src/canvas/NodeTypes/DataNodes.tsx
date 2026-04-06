import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { DiagramNodeData } from '@shared/types';

const ICONS: Record<string, string> = {
  'sql-db': '🗄️',
  'nosql-db': '📋',
  cache: '⚡',
  'message-queue': '📬',
  'data-warehouse': '🏪',
  'object-storage': '🪣',
};

function makeDataNode(type: string, defaultColor: string) {
  return function DataNode({ data, selected }: NodeProps) {
    return <BaseNode data={data as DiagramNodeData} selected={selected} icon={ICONS[type]} color={defaultColor} />;
  };
}

export const SqlDbNode = makeDataNode('sql-db', '#3b82f6');
export const NoSqlDbNode = makeDataNode('nosql-db', '#10b981');
export const CacheNode = makeDataNode('cache', '#f59e0b');
export const MessageQueueNode = makeDataNode('message-queue', '#8b5cf6');
export const DataWarehouseNode = makeDataNode('data-warehouse', '#06b6d4');
export const ObjectStorageNode = makeDataNode('object-storage', '#64748b');
