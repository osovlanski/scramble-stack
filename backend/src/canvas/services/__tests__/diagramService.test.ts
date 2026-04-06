import { describe, it, expect, vi, beforeEach } from 'vitest';

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
}));

import { diagramService } from '../diagramService';

const mockNodes = [{ id: 'n1', type: 'microservice', position: { x: 100, y: 100 }, data: { label: 'Service', nodeType: 'microservice' } }];
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
  it('updates diagram and creates version every 10 saves', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(9); // 9 existing versions → 10th save triggers snapshot
    mockPrisma.diagramVersion.create.mockResolvedValue({});

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    // Should create a version on the 10th save
    expect(mockPrisma.diagramVersion.create).toHaveBeenCalled();
  });

  it('does not create version before 10 saves', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(3);

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.create).not.toHaveBeenCalled();
  });

  it('prunes versions beyond 20', async () => {
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);
    mockPrisma.diagramVersion.count.mockResolvedValue(19); // triggers version creation
    mockPrisma.diagramVersion.create.mockResolvedValue({ id: 'v-new', version: 21 });
    mockPrisma.diagramVersion.findMany.mockResolvedValue([{ id: 'old-v', version: 1 }]); // oldest to prune

    await diagramService.save('diag-1', { nodes: mockNodes, edges: mockEdges, viewport: null, thumbnail: null, name: 'Test' });

    expect(mockPrisma.diagramVersion.deleteMany).toHaveBeenCalled();
  });
});

describe('diagramService.restore', () => {
  it('replaces diagram nodes and edges with version snapshot', async () => {
    const version = { id: 'v1', nodes: mockNodes, edges: mockEdges };
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(version);
    mockPrisma.diagram.update.mockResolvedValue(mockDiagram);

    await diagramService.restore('diag-1', 5);

    expect(mockPrisma.diagram.update).toHaveBeenCalledWith({
      where: { id: 'diag-1' },
      data: { nodes: mockNodes, edges: mockEdges },
    });
  });

  it('throws if version not found', async () => {
    mockPrisma.diagramVersion.findFirst.mockResolvedValue(null);
    await expect(diagramService.restore('diag-1', 99)).rejects.toThrow('Version 99 not found');
  });
});
