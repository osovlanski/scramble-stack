import { useCallback, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type OnConnect,
  addEdge,
  MarkerType,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_TYPES } from '../NodeTypes';
import { useCanvas } from './useCanvas';
import CanvasControls from './CanvasControls';
import SelectionToolbar from './SelectionToolbar';
import Palette from '../Palette/Palette';
import Toolbar, { type DrawMode } from '../Toolbar/Toolbar';
import AIGeneratorPanel from '../AIGenerator/AIGeneratorPanel';
import CustomNodeManager from '../Palette/CustomNodeManager';
import type { DiagramNodeData, NodeType } from '@shared/types';

function CanvasBoardInner() {
  const { id } = useParams<{ id: string }>();
  const {
    nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges,
    saveStatus, diagramName, setDiagramName, triggerSave,
  } = useCanvas(id!);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [showCustomManager, setShowCustomManager] = useState(false);

  const [drawMode, setDrawMode] = useState<DrawMode>('select');

  type Stroke = { id: string; path: string; color: string };
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const isDrawing = useRef(false);

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
  };

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow-type') as NodeType;
      const label = e.dataTransfer.getData('application/reactflow-label');
      if (!type) return;

      const bounds = e.currentTarget.getBoundingClientRect();
      const position = { x: e.clientX - bounds.left - 50, y: e.clientY - bounds.top - 30 };

      const newNode: Node<DiagramNodeData> = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label, nodeType: type },
      };

      setNodes(nds => [...nds, newNode]);
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleDrawStart = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (drawMode === 'eraser') {
        const clickedX = x;
        const clickedY = y;
        setStrokes(prev =>
          prev.filter(stroke => {
            const match = stroke.path.match(/M\s*([\d.]+)\s+([\d.]+)/);
            if (!match) return true;
            const startX = parseFloat(match[1]);
            const startY = parseFloat(match[2]);
            const distance = Math.hypot(startX - clickedX, startY - clickedY);
            return distance > 20;
          })
        );
        return;
      }

      isDrawing.current = true;
      setCurrentPath(`M ${x} ${y}`);
    },
    [drawMode]
  );

  const handleDrawMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing.current || drawMode !== 'pen') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
    },
    [drawMode]
  );

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing.current || drawMode !== 'pen') return;
    isDrawing.current = false;
    setCurrentPath(prev => {
      if (prev) {
        setStrokes(existing => [
          ...existing,
          { id: Date.now().toString(), path: prev, color: '#a5b4fc' },
        ]);
      }
      return '';
    });
  }, [drawMode]);

  return (
    <div className="flex h-full w-full bg-slate-900">
      <Palette onAddCustom={() => setShowCustomManager(true)} />

      <div className="flex-1 flex flex-col">
        <Toolbar
          diagramName={diagramName}
          onNameChange={setDiagramName}
          saveStatus={saveStatus}
          onSave={triggerSave}
          onToggleAI={() => setShowAI(prev => !prev)}
          diagramId={id!}
          drawMode={drawMode}
          setDrawMode={setDrawMode}
        />

        <div
          className="flex-1 relative"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            selectionOnDrag
            multiSelectionKeyCode="Meta"
            deleteKeyCode="Backspace"
            fitView
            nodesDraggable={drawMode === 'select'}
            panOnDrag={drawMode === 'select'}
            zoomOnScroll={drawMode === 'select'}
            elementsSelectable={drawMode === 'select'}
          >
            <Background color="#1e293b" gap={24} />
            <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.5)" />
            <CanvasControls />
            <SelectionToolbar selectedNodeId={selectedNodeId} />
          </ReactFlow>

          {drawMode !== 'select' && (
            <svg
              className="absolute inset-0 w-full h-full"
              style={{
                zIndex: 10,
                cursor: drawMode === 'pen' ? 'crosshair' : 'cell',
                pointerEvents: 'all',
              }}
              onMouseDown={handleDrawStart}
              onMouseMove={handleDrawMove}
              onMouseUp={handleDrawEnd}
              onMouseLeave={handleDrawEnd}
            >
              {strokes.map(s => (
                <path
                  key={s.id}
                  d={s.path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath && (
                <path
                  d={currentPath}
                  fill="none"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          )}
        </div>
      </div>

      {showAI && (
        <AIGeneratorPanel
          onClose={() => setShowAI(false)}
          onNodesGenerated={(newNodes, newEdges, name) => {
            setNodes(newNodes);
            setEdges(newEdges);
            setDiagramName(name);
          }}
        />
      )}

      {showCustomManager && (
        <CustomNodeManager
          onClose={() => setShowCustomManager(false)}
          onCreated={() => setShowCustomManager(false)}
        />
      )}
    </div>
  );
}

export default function CanvasBoard() {
  return (
    <ReactFlowProvider>
      <CanvasBoardInner />
    </ReactFlowProvider>
  );
}
