import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { submitSession } from '../api';

const TIMEOUT_MINUTES = 45;

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function GradedEditor({ sessionId, onSubmitted }: Props) {
  const [answer, setAnswer] = useState('');
  const [diagramId, setDiagramId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_MINUTES * 60);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerColor = secondsLeft < 300 ? 'text-red-400' : secondsLeft < 900 ? 'text-amber-400' : 'text-emerald-400';

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
      <div className={`flex items-center gap-2 text-sm font-mono ${timerColor}`}>
        <Clock size={14} />
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} remaining
        {secondsLeft === 0 && <span className="text-red-400 ml-2">Time's up!</span>}
      </div>
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Describe your system design here — components, data model, scalability approach, tradeoffs..."
        className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 min-h-[300px]"
      />
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Canvas diagram ID (optional)"
          value={diagramId}
          onChange={e => setDiagramId(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
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
