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
    <div className="min-h-screen bg-slate-950 p-8">
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
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-lg">No diagrams yet</p>
            <p className="text-sm mt-1">Create your first system design diagram above</p>
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
