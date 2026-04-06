import type { DiagramFull, DiagramNodeRaw, DiagramEdgeRaw } from '@shared/types';

interface JsonExport {
  meta: { id: string; name: string; description?: string; createdAt: string; updatedAt: string };
  nodes: DiagramNodeRaw[];
  edges: DiagramEdgeRaw[];
}

export const exportService = {
  toJson(diagram: DiagramFull): JsonExport {
    return {
      meta: {
        id: diagram.id,
        name: diagram.name,
        description: diagram.description,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
      },
      nodes: diagram.nodes,
      edges: diagram.edges,
    };
  },
};
