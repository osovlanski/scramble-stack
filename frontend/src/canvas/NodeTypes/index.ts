import { LoadBalancerNode, CdnNode, DnsNode, FirewallNode, VpnNode } from './InfrastructureNodes';
import { MicroserviceNode, ServerNode, ServerlessNode, ContainerNode } from './ComputeNodes';
import { SqlDbNode, NoSqlDbNode, CacheNode, MessageQueueNode, DataWarehouseNode, ObjectStorageNode } from './DataNodes';
import { ClientWebNode, ClientMobileNode, ThirdPartyApiNode, TelegramBotNode } from './ExternalNodes';
import { CloudRegionNode, AvailabilityZoneNode } from './CloudNodes';
import { RateLimiterNode, ApiGatewayNode, ServiceMeshNode } from './ConceptNodes';
import { CustomNodeComponent } from './CustomNode';

export const NODE_TYPES = {
  'load-balancer': LoadBalancerNode,
  'cdn': CdnNode,
  'dns': DnsNode,
  'firewall': FirewallNode,
  'vpn': VpnNode,
  'microservice': MicroserviceNode,
  'server': ServerNode,
  'serverless': ServerlessNode,
  'container': ContainerNode,
  'sql-db': SqlDbNode,
  'nosql-db': NoSqlDbNode,
  'cache': CacheNode,
  'message-queue': MessageQueueNode,
  'data-warehouse': DataWarehouseNode,
  'object-storage': ObjectStorageNode,
  'client-web': ClientWebNode,
  'client-mobile': ClientMobileNode,
  'third-party-api': ThirdPartyApiNode,
  'telegram-bot': TelegramBotNode,
  'cloud-region': CloudRegionNode,
  'availability-zone': AvailabilityZoneNode,
  'rate-limiter': RateLimiterNode,
  'api-gateway': ApiGatewayNode,
  'service-mesh': ServiceMeshNode,
  'custom': CustomNodeComponent,
} as const;

export const PALETTE_CATEGORIES = [
  {
    name: 'Infrastructure',
    nodes: [
      { type: 'load-balancer', label: 'Load Balancer' },
      { type: 'cdn', label: 'CDN' },
      { type: 'dns', label: 'DNS' },
      { type: 'firewall', label: 'Firewall' },
      { type: 'vpn', label: 'VPN' },
    ],
  },
  {
    name: 'Compute',
    nodes: [
      { type: 'microservice', label: 'Microservice' },
      { type: 'server', label: 'Server' },
      { type: 'serverless', label: 'Serverless' },
      { type: 'container', label: 'Container' },
    ],
  },
  {
    name: 'Data',
    nodes: [
      { type: 'sql-db', label: 'SQL DB' },
      { type: 'nosql-db', label: 'NoSQL DB' },
      { type: 'cache', label: 'Cache' },
      { type: 'message-queue', label: 'Message Queue' },
      { type: 'data-warehouse', label: 'Data Warehouse' },
      { type: 'object-storage', label: 'Object Storage' },
    ],
  },
  {
    name: 'External',
    nodes: [
      { type: 'client-web', label: 'Web Client' },
      { type: 'client-mobile', label: 'Mobile Client' },
      { type: 'third-party-api', label: 'Third-party API' },
      { type: 'telegram-bot', label: 'Telegram Bot' },
    ],
  },
  {
    name: 'Cloud',
    nodes: [
      { type: 'cloud-region', label: 'Cloud Region' },
      { type: 'availability-zone', label: 'Availability Zone' },
    ],
  },
  {
    name: 'Concepts',
    nodes: [
      { type: 'rate-limiter', label: 'Rate Limiter' },
      { type: 'api-gateway', label: 'API Gateway' },
      { type: 'service-mesh', label: 'Service Mesh' },
    ],
  },
] as const;
