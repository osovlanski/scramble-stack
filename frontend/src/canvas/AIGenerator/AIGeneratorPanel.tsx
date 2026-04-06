import { useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';
import { useAIGenerator } from './useAIGenerator';
import GenerationProgress from './GenerationProgress';

interface AIGeneratorPanelProps {
  onClose: () => void;
  onNodesGenerated: (nodes: Node<DiagramNodeData>[], edges: Edge[], name: string) => void;
}

const EXAMPLE_PROMPTS = [
  'Design a ride-sharing app like Uber',
  'Design a social media feed service',
  'Design a URL shortener with high availability',
  'Design a video streaming service like Netflix',
];

export default function AIGeneratorPanel({ onClose, onNodesGenerated }: AIGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, streamedNodes, streamedEdges, generatedMeta, error, generate, cancel } = useAIGenerator();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    await generate(prompt.trim());
  };

  const handleApply = () => {
    if (streamedNodes.length === 0) return;
    onNodesGenerated(streamedNodes, streamedEdges, generatedMeta?.name ?? 'Generated Diagram');
    onClose();
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-700 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-100">✨ AI Generate</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-100 resize-none h-24 placeholder-slate-500"
          placeholder="Describe the system you want to design..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={isGenerating}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
        />

        <div className="flex gap-2">
          {isGenerating ? (
            <button onClick={cancel} className="flex-1 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg">Cancel</button>
          ) : (
            <button onClick={handleGenerate} disabled={!prompt.trim()} className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40">
              Generate ⌘↵
            </button>
          )}
        </div>

        <GenerationProgress nodeCount={streamedNodes.length} isGenerating={isGenerating} />

        {error && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
      </div>

      {streamedNodes.length > 0 && !isGenerating && (
        <div className="flex flex-col gap-2">
          {generatedMeta && (
            <div className="text-xs text-slate-400 bg-slate-800 rounded-lg p-3">
              <p className="font-semibold text-slate-300">{generatedMeta.name}</p>
              <p className="mt-1">{generatedMeta.description}</p>
            </div>
          )}
          <button onClick={handleApply} className="w-full py-2 text-sm bg-green-700 hover:bg-green-600 text-white rounded-lg">
            Apply to Canvas ({streamedNodes.length} nodes)
          </button>
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xs text-slate-500 mb-2">Examples:</p>
        <div className="flex flex-col gap-1">
          {EXAMPLE_PROMPTS.map(p => (
            <button key={p} onClick={() => setPrompt(p)} className="text-left text-xs text-slate-400 hover:text-indigo-300 py-1">
              → {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
