import { useState } from 'react';
import { Link } from 'lucide-react';
import { submitSession } from '../api';

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function StructuredEditor({ sessionId, onSubmitted }: Props) {
  const [answer, setAnswer] = useState('');
  const [diagramId, setDiagramId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await submitSession(sessionId, {
        textAnswer: answer,
        canvasDiagramId: diagramId.trim() || undefined,
      });
      onSubmitted();
    } catch {
      alert('Submission failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Describe your system design here — components, data model, scalability approach, tradeoffs..."
        className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 min-h-[300px]"
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Link size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Canvas diagram ID (optional)"
            value={diagramId}
            onChange={e => setDiagramId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          {submitting ? 'Scoring...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
