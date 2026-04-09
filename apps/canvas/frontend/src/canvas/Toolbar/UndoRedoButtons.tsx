export default function UndoRedoButtons() {
  const handleUndo = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
  const handleRedo = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }));

  return (
    <div className="flex gap-1">
      <button onClick={handleUndo} className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded" title="Undo (Ctrl+Z)">↩</button>
      <button onClick={handleRedo} className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded" title="Redo (Ctrl+Y)">↪</button>
    </div>
  );
}
