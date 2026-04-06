import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  MiniMap,
  ReactFlowProvider,
  type Node,
  type OnConnect,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_TYPES } from '../NodeTypes';
import { useCanvas } from './useCanvas';
import CanvasControls from './CanvasControls';
import SelectionToolbar from './SelectionToolbar';
import Palette from '../Palette/Palette';
import Toolbar from '../Toolbar/Toolbar';
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

  const onConnect: OnConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
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

  return (
    <div className="flex h-screen w-screen bg-slate-900">
      <Palette onAddCustom={() => setShowCustomManager(true)} />

      <div className="flex-1 flex flex-col">
        <Toolbar
          diagramName={diagramName}
          onNameChange={setDiagramName}
          saveStatus={saveStatus}
          onSave={triggerSave}
          onToggleAI={() => setShowAI(prev => !prev)}
          diagramId={id!}
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
            fitView
          >
            <Background color="#1e293b" gap={24} />
            <MiniMap nodeColor="#6366f1" maskColor="rgba(0,0,0,0.5)" />
            <CanvasControls />
            <SelectionToolbar selectedNodeId={selectedNodeId} />
          </ReactFlow>
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
