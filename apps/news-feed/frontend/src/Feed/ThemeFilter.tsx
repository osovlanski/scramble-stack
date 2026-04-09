import type { Theme } from '../types';

const ALL_THEMES: Theme[] = ['infra', 'ai-ml', 'security', 'frontend', 'data', 'cloud', 'culture', 'tooling'];

interface Props {
  active: Theme | null;
  onChange: (theme: Theme | null) => void;
}

export function ThemeFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-800">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          active === null ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        All
      </button>
      {ALL_THEMES.map((theme) => (
        <button
          key={theme}
          onClick={() => onChange(theme === active ? null : theme)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            active === theme ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {theme}
        </button>
      ))}
    </div>
  );
}
