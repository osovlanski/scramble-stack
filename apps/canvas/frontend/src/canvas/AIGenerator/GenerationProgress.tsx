interface GenerationProgressProps {
  nodeCount: number;
  isGenerating: boolean;
}

export default function GenerationProgress({ nodeCount, isGenerating }: GenerationProgressProps) {
  if (!isGenerating && nodeCount === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
      {isGenerating && <span className="animate-spin">⟳</span>}
      <span>
        {isGenerating
          ? `Placing nodes... (${nodeCount} placed)`
          : `Generation complete — ${nodeCount} nodes`}
      </span>
    </div>
  );
}
