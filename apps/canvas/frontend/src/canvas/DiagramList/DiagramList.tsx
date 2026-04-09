import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagramList } from './useDiagramList';
import DiagramCard from './DiagramCard';

export default function DiagramList() {
  const navigate = useNavigate();
  const { diagrams, loading, error, createDiagram, deleteDiagram } = useDiagramList();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createDiagram(newName.trim());
      navigate(`/canvas/${id}`);
    } finally {
      setCreating(false);
      setNewName('');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">ScrambleStack</h1>
            <p className="text-sm text-slate-400 mt-1">System Design Canvas</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 w-48 placeholder-slate-500"
              placeholder="New diagram name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40"
            >
              {creating ? 'Creating...' : '+ New Diagram'}
            </button>
          </div>
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading diagrams...</p>}

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400">
            {error} — <button onClick={() => window.location.reload()} className="underline">Retry</button>
          </div>
        )}

        {!loading && !error && diagrams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M17.5 14v6M14.5 17h6" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">No diagrams yet</h2>
            <p className="text-slate-400 text-sm max-w-xs mb-8">
              Design your first system architecture — drag nodes onto the canvas, connect them, or let AI generate a diagram from a prompt.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setCreating(true);
                  try {
                    const id = await createDiagram('Untitled Diagram');
                    navigate(`/canvas/${id}`);
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className="px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-40"
              >
                {creating ? 'Creating...' : '+ New Diagram'}
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-8">
              Or type a name in the field above and press Enter
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {diagrams.map(diagram => (
            <DiagramCard key={diagram.id} diagram={diagram} onDelete={deleteDiagram} />
          ))}
        </div>
      </div>
    </div>
  );
}
