import type {
  DiagramMeta, DiagramFull, DiagramVersionMeta,
  CustomNodeTypeData, ApiResponse,
  GenerateDiagramResponse,
} from '@shared/types';

export type { DiagramMeta, DiagramFull, DiagramVersionMeta, CustomNodeTypeData };

const BASE = '/api/canvas';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });
  const json = await res.json() as ApiResponse<T>;
  if (!json.success) throw new Error(json.message ?? 'Request failed');
  return json.data as T;
}

export interface SavePayload {
  name: string;
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number } | null;
  thumbnail: string | null;
}

export const canvasApi = {
  listDiagrams: () => request<DiagramMeta[]>('/diagrams'),
  createDiagram: (name: string) => request<DiagramFull>('/diagrams', { method: 'POST', body: JSON.stringify({ name }) }),
  getDiagram: (id: string) => request<DiagramFull>(`/diagrams/${id}`),
  saveDiagram: (id: string, payload: SavePayload) =>
    request<void>(`/diagrams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteDiagram: (id: string) => request<void>(`/diagrams/${id}`, { method: 'DELETE' }),

  listVersions: (id: string) => request<DiagramVersionMeta[]>(`/diagrams/${id}/versions`),
  restoreVersion: (id: string, ver: number) => request<DiagramFull>(`/diagrams/${id}/versions/${ver}`),

  exportDiagram: (id: string) => request<GenerateDiagramResponse>(`/diagrams/${id}/export`),

  listCustomNodeTypes: () => request<CustomNodeTypeData[]>('/node-types/custom'),
  createCustomNodeType: (data: Omit<CustomNodeTypeData, 'id'>) =>
    request<CustomNodeTypeData>('/node-types/custom', { method: 'POST', body: JSON.stringify(data) }),
  deleteCustomNodeType: (id: string) => request<void>(`/node-types/custom/${id}`, { method: 'DELETE' }),

  streamGenerate: async (
    prompt: string,
    onNode: (node: unknown) => void,
    onEdge: (edge: unknown) => void,
    onMeta: (meta: { name: string; description: string }) => void,
    onDone: () => void,
    onError: (message: string) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const response = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ prompt }),
      signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('event: ')) {
          const event = line.slice(7).trim();
          const dataLine = lines[i + 1];
          if (dataLine?.startsWith('data: ')) {
            const data = JSON.parse(dataLine.slice(6));
            if (event === 'node') onNode(data);
            else if (event === 'edge') onEdge(data);
            else if (event === 'meta') onMeta(data);
            else if (event === 'done') onDone();
            else if (event === 'error') onError(data.message);
          }
        }
      }
    }
  },
};
