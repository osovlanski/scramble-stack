// src/sessions/diagramFetcher.ts
import axios from 'axios';

export interface DiagramExport {
  name: string;
  nodes: { id: string; type: string; data: Record<string, unknown> }[];
  edges: { source: string; target: string; label?: string }[];
}

export async function fetchDiagram(diagramId: string): Promise<DiagramExport | null> {
  const baseUrl = process.env.CANVAS_BACKEND_URL ?? 'http://localhost:3000';
  try {
    const { data } = await axios.get<DiagramExport>(
      `${baseUrl}/api/diagrams/${diagramId}/export`,
      { timeout: 5000 }
    );
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.error('[diagramFetcher] failed to fetch diagram:', err?.message);
    return null;
  }
}

export function diagramToText(diagram: DiagramExport): string {
  const nodeList = diagram.nodes
    .map(n => `- ${n.type} node: "${(n.data.label as string) || n.id}"`)
    .join('\n');
  const edgeList = diagram.edges
    .map(e => `- ${e.source} → ${e.target}${e.label ? ` (${e.label})` : ''}`)
    .join('\n');
  return `Diagram: "${diagram.name}"\nComponents:\n${nodeList}\nConnections:\n${edgeList}`;
}
