import { useState } from 'react';
import PaletteItem from './PaletteItem';
import type { NodeType } from '@shared/types';

interface PaletteCategoryProps {
  name: string;
  nodes: ReadonlyArray<{ type: string; label: string }>;
}

export default function PaletteCategory({ name, nodes }: PaletteCategoryProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
        onClick={() => setOpen(prev => !prev)}
      >
        {name}
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1">
          {nodes.map(node => (
            <PaletteItem key={node.type} type={node.type as NodeType} label={node.label} />
          ))}
        </div>
      )}
    </div>
  );
}
