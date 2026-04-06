import { useReactFlow } from '@xyflow/react';

export default function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
      <button onClick={() => zoomIn()} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-lg flex items-center justify-center" title="Zoom in">+</button>
      <button onClick={() => zoomOut()} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-lg flex items-center justify-center" title="Zoom out">−</button>
      <button onClick={() => fitView({ padding: 0.1 })} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs flex items-center justify-center" title="Fit view">⊡</button>
    </div>
  );
}
