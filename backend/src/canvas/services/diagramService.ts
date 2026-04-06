import { getPrisma } from '../../core/databaseService';
import logger from '../../core/logger';
import type { Prisma } from '@prisma/client';
import type { DiagramNodeRaw, DiagramEdgeRaw, DiagramMeta, DiagramFull, DiagramVersionMeta, SaveDiagramPayload } from '@shared/types';

type JsonArray = Prisma.InputJsonValue[];

const MAX_VERSIONS = 20;
const VERSION_EVERY_N_SAVES = 10;

export const diagramService = {
  async list(userId: string): Promise<DiagramMeta[]> {
    const prisma = getPrisma()!;
    const diagrams = await prisma.diagram.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        nodes: false,
        edges: false,
        viewport: false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return diagrams.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description ?? undefined,
      thumbnail: d.thumbnail ?? undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  },

  async get(id: string, userId: string): Promise<DiagramFull | null> {
    const prisma = getPrisma()!;
    const diagram = await prisma.diagram.findFirst({ where: { id, userId } });
    if (!diagram) return null;

    return {
      id: diagram.id,
      name: diagram.name,
      description: diagram.description ?? undefined,
      thumbnail: diagram.thumbnail ?? undefined,
      nodes: diagram.nodes as unknown as DiagramNodeRaw[],
      edges: diagram.edges as unknown as DiagramEdgeRaw[],
      viewport: diagram.viewport as unknown as { x: number; y: number; zoom: number } | undefined,
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    };
  },

  async create(userId: string, name: string): Promise<DiagramFull> {
    const prisma = getPrisma()!;
    const diagram = await prisma.diagram.create({
      data: { userId, name, nodes: [], edges: [] },
    });

    return {
      id: diagram.id,
      name: diagram.name,
      nodes: [],
      edges: [],
      createdAt: diagram.createdAt.toISOString(),
      updatedAt: diagram.updatedAt.toISOString(),
    };
  },

  async save(id: string, payload: SaveDiagramPayload): Promise<void> {
    const prisma = getPrisma()!;

    const updated = await prisma.diagram.update({
      where: { id },
      data: {
        name: payload.name,
        nodes: payload.nodes as unknown as JsonArray,
        edges: payload.edges as unknown as JsonArray,
        viewport: payload.viewport as unknown ?? undefined,
        thumbnail: payload.thumbnail ?? undefined,
        saveCount: { increment: 1 },
      },
      select: { saveCount: true },
    });

    if (updated.saveCount % VERSION_EVERY_N_SAVES === 0) {
      const versionCount = await prisma.diagramVersion.count({ where: { diagramId: id } });

      await prisma.diagramVersion.create({
        data: {
          diagramId: id,
          version: versionCount + 1,
          nodes: payload.nodes as unknown as JsonArray,
          edges: payload.edges as unknown as JsonArray,
        },
      });

      if (versionCount + 1 > MAX_VERSIONS) {
        const oldest = await prisma.diagramVersion.findMany({
          where: { diagramId: id },
          orderBy: { version: 'asc' },
          take: 1,
          select: { id: true },
        });
        await prisma.diagramVersion.deleteMany({
          where: { id: { in: oldest.map(v => v.id) } },
        });
      }
    }

    logger.canvas(`Diagram saved`, { id });
  },

  async delete(id: string, userId: string): Promise<void> {
    const prisma = getPrisma()!;
    await prisma.diagram.delete({ where: { id, userId } });
  },

  async listVersions(diagramId: string): Promise<DiagramVersionMeta[]> {
    const prisma = getPrisma()!;
    const versions = await prisma.diagramVersion.findMany({
      where: { diagramId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, createdAt: true },
    });

    return versions.map(v => ({
      id: v.id,
      version: v.version,
      createdAt: v.createdAt.toISOString(),
    }));
  },

  async restore(diagramId: string, version: number): Promise<void> {
    const prisma = getPrisma()!;
    const snapshot = await prisma.diagramVersion.findFirst({
      where: { diagramId, version },
    });

    if (!snapshot) throw new Error(`Version ${version} not found`);

    await prisma.diagram.update({
      where: { id: diagramId },
      data: { nodes: snapshot.nodes as unknown as JsonArray, edges: snapshot.edges as unknown as JsonArray },
    });
  },
};
