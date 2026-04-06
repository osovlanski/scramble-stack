import claudeService from '../../core/claudeService';
import logger from '../../core/logger';
import type { GenerateDiagramResponse, NodeType } from '@shared/types';

const VALID_NODE_TYPES: NodeType[] = [
  'load-balancer', 'cdn', 'dns', 'firewall', 'vpn',
  'microservice', 'server', 'serverless', 'container',
  'sql-db', 'nosql-db', 'cache', 'message-queue', 'data-warehouse', 'object-storage',
  'client-web', 'client-mobile', 'third-party-api', 'telegram-bot',
  'cloud-region', 'availability-zone',
  'rate-limiter', 'api-gateway', 'service-mesh',
  'custom',
];

function sanitizeNodeType(type: string): NodeType {
  return VALID_NODE_TYPES.includes(type as NodeType) ? (type as NodeType) : 'custom';
}

export const aiGeneratorService = {
  async generate(prompt: string): Promise<GenerateDiagramResponse> {
    logger.canvas(`Generating diagram`, { prompt: prompt.slice(0, 80) });

    const result = await claudeService.generateDiagram(prompt);

    const sanitized: GenerateDiagramResponse = {
      ...result,
      nodes: result.nodes.map(node => ({
        ...node,
        type: sanitizeNodeType(node.type),
        data: { ...node.data, nodeType: sanitizeNodeType(node.data.nodeType) },
      })),
    };

    logger.canvas(`Diagram generated`, { nodeCount: sanitized.nodes.length, edgeCount: sanitized.edges.length });
    return sanitized;
  },
};
