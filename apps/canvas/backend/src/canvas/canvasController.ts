import { Response } from 'express';
import type { DiagramNodeRaw, DiagramEdgeRaw } from '@shared/types';
import { AuthRequest } from '../middleware/authMiddleware';
import { diagramService } from './services/diagramService';
import { aiGeneratorService } from './services/aiGeneratorService';
import { exportService } from './services/exportService';
import { getPrisma } from '../core/databaseService';
import logger from '../core/logger';

export const canvasController = {
  async listDiagrams(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagrams = await diagramService.list(req.userId);
      res.json({ success: true, data: diagrams });
    } catch (error) {
      logger.fail('Failed to list diagrams', { error });
      res.status(500).json({ success: false, message: 'Failed to list diagrams' });
    }
  },

  async createDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name = 'Untitled Diagram' } = req.body as { name?: string };
      const diagram = await diagramService.create(req.userId, name);
      res.status(201).json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to create diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to create diagram' });
    }
  },

  async getDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagram = await diagramService.get(req.params.id as string, req.userId);
      if (!diagram) {
        res.status(404).json({ success: false, message: 'Diagram not found' });
        return;
      }
      res.json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to get diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to get diagram' });
    }
  },

  async saveDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, nodes, edges, viewport, thumbnail } = req.body as { name: string; nodes: DiagramNodeRaw[]; edges: DiagramEdgeRaw[]; viewport: unknown; thumbnail: string | null };
      await diagramService.save(req.params.id as string, req.userId, { name, nodes, edges, viewport: viewport as any, thumbnail });
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to save diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to save diagram' });
    }
  },

  async deleteDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      await diagramService.delete(req.params.id as string, req.userId);
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to delete diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to delete diagram' });
    }
  },

  async listVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const versions = await diagramService.listVersions(req.params.id as string, req.userId);
      res.json({ success: true, data: versions });
    } catch (error) {
      logger.fail('Failed to list versions', { error });
      res.status(500).json({ success: false, message: 'Failed to list versions' });
    }
  },

  async restoreVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const version = parseInt(req.params.ver as string, 10);
      await diagramService.restore(req.params.id as string, version, req.userId);
      const diagram = await diagramService.get(req.params.id as string, req.userId);
      res.json({ success: true, data: diagram });
    } catch (error) {
      logger.fail('Failed to restore version', { error });
      res.status(500).json({ success: false, message: 'Failed to restore version' });
    }
  },

  async generateDiagram(req: AuthRequest, res: Response): Promise<void> {
    const { prompt } = req.body as { prompt: string };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown): void => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const diagram = await aiGeneratorService.generate(prompt);

      sendEvent('meta', { name: diagram.name, description: diagram.description });

      for (const node of diagram.nodes) {
        await new Promise<void>(resolve => setTimeout(resolve, 80));
        sendEvent('node', node);
      }

      for (const edge of diagram.edges) {
        sendEvent('edge', edge);
      }

      sendEvent('done', {});
      res.end();
    } catch (error) {
      logger.fail('Diagram generation failed', { error });
      sendEvent('error', { message: 'Generation failed. Please try again.' });
      res.end();
    }
  },

  async exportDiagram(req: AuthRequest, res: Response): Promise<void> {
    try {
      const diagram = await diagramService.get(req.params.id as string, req.userId);
      if (!diagram) {
        res.status(404).json({ success: false, message: 'Diagram not found' });
        return;
      }
      const exported = exportService.toJson(diagram);
      res.json({ success: true, data: exported });
    } catch (error) {
      logger.fail('Failed to export diagram', { error });
      res.status(500).json({ success: false, message: 'Failed to export diagram' });
    }
  },

  async getPublicExport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      const record = await prisma.diagram.findUnique({ where: { id: req.params.id as string } });
      if (!record) {
        res.status(404).json({ error: 'Diagram not found' });
        return;
      }
      const nodes = record.nodes ?? [];
      const edges = record.edges ?? [];
      res.json({ name: record.name, nodes, edges });
    } catch (error) {
      logger.fail('Failed to export diagram', { error });
      res.status(500).json({ error: 'Failed to export diagram' });
    }
  },

  async listCustomNodeTypes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      const types = await prisma.customNodeType.findMany({ where: { userId: req.userId } });
      res.json({ success: true, data: types });
    } catch (error) {
      logger.fail('Failed to list custom node types', { error });
      res.status(500).json({ success: false, message: 'Failed to list custom node types' });
    }
  },

  async createCustomNodeType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      const { name, iconSvg, color, description } = req.body as { name: string; iconSvg?: string; color?: string; description?: string };
      const nodeType = await prisma.customNodeType.create({
        data: { userId: req.userId, name, iconSvg, color: color ?? '#6366f1', description },
      });
      res.status(201).json({ success: true, data: nodeType });
    } catch (error) {
      logger.fail('Failed to create custom node type', { error });
      res.status(500).json({ success: false, message: 'Failed to create custom node type' });
    }
  },

  async deleteCustomNodeType(req: AuthRequest, res: Response): Promise<void> {
    try {
      const prisma = getPrisma()!;
      await prisma.customNodeType.delete({ where: { id: req.params.id as string, userId: req.userId } });
      res.json({ success: true });
    } catch (error) {
      logger.fail('Failed to delete custom node type', { error });
      res.status(500).json({ success: false, message: 'Failed to delete custom node type' });
    }
  },
};
