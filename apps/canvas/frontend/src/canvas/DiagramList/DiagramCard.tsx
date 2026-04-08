import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DiagramMeta } from '../../services/canvasApi';

interface DiagramCardProps {
  diagram: DiagramMeta;
  onDelete: (id: string) => void;
}

export default function DiagramCard({ diagram, onDelete }: DiagramCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(diagram.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="relative group bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl overflow-hidden cursor-pointer transition-colors"
      onClick={() => navigate(`/canvas/${diagram.id}`)}
    >
      <div className="h-36 bg-slate-900 flex items-center justify-center">
        {diagram.thumbnail ? (
          <img src={diagram.thumbnail} alt={diagram.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-20">🎨</span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-100 truncate">{diagram.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{new Date(diagram.updatedAt).toLocaleDateString()}</p>
      </div>

      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 text-xs rounded-md bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white transition-all"
        title={confirmDelete ? 'Click again to confirm' : 'Delete diagram'}
      >
        {confirmDelete ? 'Sure?' : '🗑'}
      </button>
    </div>
  );
}
