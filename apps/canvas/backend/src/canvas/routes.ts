import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { canvasController } from './canvasController';
import { aiLimiter } from '../core/rateLimiters';
import { getPrisma } from '../core/databaseService';

const router = Router();

// Public — DB connectivity probe, useful for dev/infra debugging
router.get('/health/db', async (_req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    res.status(503).json({ ok: false, error: 'Prisma not initialized — check DATABASE_URL' });
    return;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Public endpoint for server-to-server diagram export (no auth required)
router.get('/diagrams/:id/export', (req, res) =>
  canvasController.getPublicExport(req as any, res)
);

router.use(authMiddleware as any);

router.get('/diagrams', (req, res) => canvasController.listDiagrams(req as any, res));
router.post('/diagrams', (req, res) => canvasController.createDiagram(req as any, res));
router.get('/diagrams/:id', (req, res) => canvasController.getDiagram(req as any, res));
router.put('/diagrams/:id', (req, res) => canvasController.saveDiagram(req as any, res));
router.delete('/diagrams/:id', (req, res) => canvasController.deleteDiagram(req as any, res));

router.get('/diagrams/:id/versions', (req, res) => canvasController.listVersions(req as any, res));
router.post('/diagrams/:id/versions/:ver/restore', (req, res) => canvasController.restoreVersion(req as any, res));

router.post('/generate', aiLimiter, (req, res) => canvasController.generateDiagram(req as any, res));
router.post('/diagrams/:id/export', (req, res) => canvasController.exportDiagram(req as any, res));

router.get('/node-types/custom', (req, res) => canvasController.listCustomNodeTypes(req as any, res));
router.post('/node-types/custom', (req, res) => canvasController.createCustomNodeType(req as any, res));
router.delete('/node-types/custom/:id', (req, res) => canvasController.deleteCustomNodeType(req as any, res));

export default router;
