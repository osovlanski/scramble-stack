import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NodeType } from '@shared/types';

const mockPrisma = {
  diagram: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  diagramVersion: {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('../../../core/databaseService', () => ({
  getPrisma: () => mockPrisma,
  requirePrisma: () => mockPrisma,
}));

import { diagramService } from '../diagramService';

const mockNodes = [{ id: 'n1', type: 'microservice' as NodeType, position: { x: 100, y: 100 }, data: { label: 'Service', nodeType: 'microservice' as NodeType } }];
const mockEdges = [{ id: 'e1', source: 'n1', target: 'n2' }];
const mockDiagram = { id: 'diag-1', userId: 'user-1', name: 'Test', nodes: mockNodes, edges: mockEdges, viewport: null, description: null, thumbnail: null, createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('diagramService.list', () => {
  it('returns meta-only diagrams for user', async () => {
    mockPrisma.diagram.findMany.mockResolvedValue([mockDiagram]);
    const result = await diagramService.list('user-1');
    expect(mockPrisma.diagram.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: expect.objectContaining({ nodes: false, edges: false }),
      orderBy: { updatedAt: 'desc' },
    });
    expect(result).toHaveLength(1);
  });
});

describe('diagramService.save', () => {
  it('creates version snapshot on every 10th save', async () => {
    mockPrisma.diagram.update.mockResolvedValue({ saveCount: 10 }); // 10th save triggers snapshot
    mockPrisma.diagramVersion.count.mockResolvedValue(0);
    mockPrisma.diagramVersion.create.mockResolvedValue({});

    await diagramService.save('diag-1', 'user-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.create).toHaveBeenCalled();
  });

  it('does not create version on non-10th saves', async () => {
    mockPrisma.diagram.update.mockResolvedValue({ saveCount: 3 }); // not a 10th save

    await diagramService.save('diag-1', 'user-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.create).not.toHaveBeenCalled();
  });

  it('prunes oldest version when exceeding 20', async () => {
    mockPrisma.diagram.update.mockResolvedValue({ saveCount: 10 }); // 10th save
    mockPrisma.diagramVersion.count.mockResolvedValue(20); // already at max — new one will exceed
    mockPrisma.diagramVersion.create.mockResolvedValue({});
    mockPrisma.diagramVersion.findMany.mockResolvedValue([{ id: 'old-v' }]);

    await diagramService.save('diag-1', 'user-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-v'] } },
    });
  });
});

describe('diagramService.restore', () => {
  it('replaces diagram nodes and edges with version snapshot', async () => {
    const version = { id: 'v1', nodes: mockNodes, edges: mockEdges };
    mockPrisma.diagram.findFirst.mockResolvedValue(mockDiagram); // ownership check
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(version);
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);

    await diagramService.restore('diag-1', 5, 'user-1');

    expect(mockPrisma.diagram.update).toHaveBeenCalledWith({
      where: { id: 'diag-1' },
      data: { nodes: mockNodes, edges: mockEdges },
    });
  });

  it('throws if version not found', async () => {
    mockPrisma.diagram.findFirst.mockResolvedValue(mockDiagram); // ownership check passes
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(null);
    await expect(diagramService.restore('diag-1', 99, 'user-1')).rejects.toThrow('Version 99 not found');
  });

  it('throws if diagram does not belong to user', async () => {
    mockPrisma.diagram.findFirst.mockResolvedValue(null); // ownership check fails
    await expect(diagramService.restore('diag-1', 5, 'other-user')).rejects.toThrow('Diagram not found');
  });
});
