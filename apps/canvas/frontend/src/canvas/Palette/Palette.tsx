import PaletteCategory from './PaletteCategory';
import { PALETTE_CATEGORIES } from '../NodeTypes';

interface PaletteProps {
  onAddCustom: () => void;
}

export default function Palette({ onAddCustom }: PaletteProps) {
  return (
    <div className="w-56 h-full bg-slate-900 border-r border-slate-700 overflow-y-auto p-3 flex flex-col gap-1">
      <h2 className="text-sm font-bold text-slate-200 mb-3">Components</h2>

      {PALETTE_CATEGORIES.map(category => (
        <PaletteCategory key={category.name} name={category.name} nodes={category.nodes} />
      ))}

      <div className="mt-4 border-t border-slate-700 pt-3">
        <button
          onClick={onAddCustom}
          className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-800 rounded-md"
        >
          + Add Custom Node
        </button>
      </div>
    </div>
  );
}
