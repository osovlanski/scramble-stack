export type NodeType =
  | 'load-balancer' | 'cdn' | 'dns' | 'firewall' | 'vpn'
  | 'microservice' | 'server' | 'serverless' | 'container'
  | 'sql-db' | 'nosql-db' | 'cache' | 'message-queue'
  | 'data-warehouse' | 'object-storage'
  | 'client-web' | 'client-mobile' | 'third-party-api' | 'telegram-bot'
  | 'cloud-region' | 'availability-zone'
  | 'rate-limiter' | 'api-gateway' | 'service-mesh'
  | 'custom';

export interface DiagramNodeData {
  label: string;
  nodeType: NodeType;
  description?: string;
  technology?: string;
  color?: string;
  customNodeTypeId?: string;
}

export interface DiagramNodeRaw {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: DiagramNodeData;
}

export interface DiagramEdgeRaw {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface DiagramMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagramFull extends DiagramMeta {
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface GenerateDiagramRequest {
  prompt: string;
}

export interface GenerateDiagramResponse {
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  name: string;
  description: string;
}

export interface DiagramVersionMeta {
  id: string;
  version: number;
  createdAt: string;
}

export interface CustomNodeTypeData {
  id: string;
  name: string;
  iconSvg?: string;
  color: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SaveDiagramPayload {
  name: string;
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
  viewport: { x: number; y: number; zoom: number } | null;
  thumbnail: string | null;
}
