import { LoadBalancerNode, CdnNode, DnsNode, FirewallNode, VpnNode } from './InfrastructureNodes';
import { MicroserviceNode, ServerNode, ServerlessNode, ContainerNode } from './ComputeNodes';
import { SqlDbNode, NoSqlDbNode, CacheNode, MessageQueueNode, DataWarehouseNode, ObjectStorageNode } from './DataNodes';
import { ClientWebNode, ClientMobileNode, ThirdPartyApiNode, TelegramBotNode } from './ExternalNodes';
import { CloudRegionNode, AvailabilityZoneNode } from './CloudNodes';
import { RateLimiterNode, ApiGatewayNode, ServiceMeshNode } from './ConceptNodes';
import { TextNode, StickyNoteNode, RectangleNode, EllipseNode } from './ShapeNodes';
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
  'text': TextNode,
  'sticky-note': StickyNoteNode,
  'rectangle': RectangleNode,
  'ellipse': EllipseNode,
  'custom': CustomNodeComponent,
} as const;

export const PALETTE_CATEGORIES = [
  {
    name: 'Shapes & Text',
    nodes: [
      { type: 'text', label: 'Text', icon: '𝐓' },
      { type: 'sticky-note', label: 'Sticky Note', icon: '📝' },
      { type: 'rectangle', label: 'Rectangle', icon: '▭' },
      { type: 'ellipse', label: 'Ellipse', icon: '⬭' },
    ],
  },
  {
    name: 'Infrastructure',
    nodes: [
      { type: 'load-balancer', label: 'Load Balancer', icon: '⚖️' },
      { type: 'cdn', label: 'CDN', icon: '🌐' },
      { type: 'dns', label: 'DNS', icon: '📡' },
      { type: 'firewall', label: 'Firewall', icon: '🔥' },
      { type: 'vpn', label: 'VPN', icon: '🔒' },
    ],
  },
  {
    name: 'Compute',
    nodes: [
      { type: 'microservice', label: 'Microservice', icon: '⚙️' },
      { type: 'server', label: 'Server', icon: '🖥️' },
      { type: 'serverless', label: 'Serverless', icon: '⚡' },
      { type: 'container', label: 'Container', icon: '📦' },
    ],
  },
  {
    name: 'Data',
    nodes: [
      { type: 'sql-db', label: 'SQL DB', icon: '🗄️' },
      { type: 'nosql-db', label: 'NoSQL DB', icon: '📋' },
      { type: 'cache', label: 'Cache', icon: '⚡' },
      { type: 'message-queue', label: 'Message Queue', icon: '📬' },
      { type: 'data-warehouse', label: 'Data Warehouse', icon: '🏪' },
      { type: 'object-storage', label: 'Object Storage', icon: '🪣' },
    ],
  },
  {
    name: 'External',
    nodes: [
      { type: 'client-web', label: 'Web Client', icon: '🌍' },
      { type: 'client-mobile', label: 'Mobile Client', icon: '📱' },
      { type: 'third-party-api', label: 'Third-party API', icon: '🔌' },
      { type: 'telegram-bot', label: 'Telegram Bot', icon: '🤖' },
    ],
  },
  {
    name: 'Cloud',
    nodes: [
      { type: 'cloud-region', label: 'Cloud Region', icon: '☁️' },
      { type: 'availability-zone', label: 'Availability Zone', icon: '🏢' },
    ],
  },
  {
    name: 'Concepts',
    nodes: [
      { type: 'rate-limiter', label: 'Rate Limiter', icon: '🚦' },
      { type: 'api-gateway', label: 'API Gateway', icon: '🚪' },
      { type: 'service-mesh', label: 'Service Mesh', icon: '🕸️' },
    ],
  },
] as const;
