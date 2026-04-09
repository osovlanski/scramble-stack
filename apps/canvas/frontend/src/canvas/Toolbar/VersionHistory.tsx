import { useState, useEffect } from 'react';
import { canvasApi } from '../../services/canvasApi';
import type { DiagramVersionMeta } from '@shared/types';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramNodeData } from '@shared/types';

interface VersionHistoryProps {
  diagramId: string;
  onRestore: (nodes: Node<DiagramNodeData>[], edges: Edge[]) => void;
  onClose: () => void;
}

export default function VersionHistory({ diagramId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DiagramVersionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    canvasApi.listVersions(diagramId)
      .then(setVersions)
      .catch(() => setError('Failed to load versions'))
      .finally(() => setLoading(false));
  }, [diagramId]);

  const restore = async (version: number) => {
    setRestoring(version);
    setError(null);
    try {
      const diagram = await canvasApi.restoreVersion(diagramId, version);
      onRestore(diagram.nodes as Node<DiagramNodeData>[], diagram.edges as Edge[]);
      onClose();
    } catch {
      setError(`Failed to restore version ${version}`);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-96 max-h-[70vh] flex flex-col border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100">Version History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">✕</button>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading versions...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && versions.length === 0 && (
          <p className="text-sm text-slate-400">No saved versions yet. Versions are created automatically every 10 saves.</p>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto">
          {versions.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div>
                <span className="text-sm font-medium text-slate-200">Version {v.version}</span>
                <p className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => restore(v.version)}
                disabled={restoring === v.version}
                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:opacity-50"
              >
                {restoring === v.version ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
