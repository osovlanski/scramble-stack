import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SaveStatus } from '../Board/useCanvas';
import UndoRedoButtons from './UndoRedoButtons';
import ExportMenu from './ExportMenu';
import VersionHistory from './VersionHistory';

interface ToolbarProps {
  diagramName: string;
  onNameChange: (name: string) => void;
  saveStatus: SaveStatus;
  onSave: () => void;
  onToggleAI: () => void;
  diagramId: string;
}

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save failed — retry',
};

const SAVE_STATUS_COLORS: Record<SaveStatus, string> = {
  idle: 'text-slate-500',
  saving: 'text-slate-400',
  saved: 'text-green-400',
  error: 'text-red-400',
};

export default function Toolbar({
  diagramName, onNameChange, saveStatus, onSave, onToggleAI, diagramId,
}: ToolbarProps) {
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border-b border-slate-700 h-12">
        <button onClick={() => navigate('/canvas')} className="text-slate-400 hover:text-slate-200 text-sm" title="Back to diagrams">←</button>

        {editingName ? (
          <input
            autoFocus
            className="bg-slate-700 border border-slate-500 rounded px-2 py-0.5 text-sm text-slate-100 w-48"
            value={diagramName}
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
          />
        ) : (
          <span
            className="text-sm font-semibold text-slate-100 cursor-pointer hover:text-indigo-300"
            onDoubleClick={() => setEditingName(true)}
            title="Double-click to rename"
          >
            {diagramName}
          </span>
        )}

        <span className={`text-xs ${SAVE_STATUS_COLORS[saveStatus]}`}>
          {SAVE_STATUS_LABELS[saveStatus]}
          {saveStatus === 'error' && (
            <button onClick={onSave} className="ml-1 underline">retry</button>
          )}
        </span>

        <div className="flex-1" />

        <UndoRedoButtons />

        <button onClick={() => setShowVersions(true)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md">
          History
        </button>

        <button onClick={onToggleAI} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md">
          ✨ AI Generate
        </button>

        <ExportMenu diagramId={diagramId} diagramName={diagramName} />
      </div>

      {showVersions && (
        <VersionHistory
          diagramId={diagramId}
          onRestore={() => { window.location.reload(); }}
          onClose={() => setShowVersions(false)}
        />
      )}
    </>
  );
}
