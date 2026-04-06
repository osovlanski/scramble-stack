import { useState } from 'react';
import { canvasApi } from '../../services/canvasApi';

interface CustomNodeManagerProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CustomNodeManager({ onClose, onCreated }: CustomNodeManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await canvasApi.createCustomNodeType({ name: name.trim(), color, description: description.trim() || undefined });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 border border-slate-600">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Create Custom Node Type</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name *</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kafka Cluster"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Color</label>
            <input
              type="color"
              className="w-12 h-8 rounded cursor-pointer"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
