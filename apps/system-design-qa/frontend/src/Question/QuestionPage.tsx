import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, ChevronDown } from 'lucide-react';
import { fetchQuestion, createSession } from '../api';
import type { Question, SessionMode } from '../types';

const MODE_DESCRIPTIONS: Record<SessionMode, { label: string; description: string }> = {
  structured: {
    label: 'Structured Answer',
    description: 'Write your answer freely. No time limit. Optionally attach a Canvas diagram.',
  },
  interview: {
    label: 'Mock Interview',
    description: 'Claude asks 3 clarifying questions before you design. Simulates a real interview.',
  },
  graded: {
    label: 'Graded (45 min)',
    description: 'Timed challenge. Same as structured but with a countdown.',
  },
};

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [mode, setMode] = useState<SessionMode>('structured');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchQuestion(id).then(setQuestion);
  }, [id]);

  async function handleStart() {
    if (!question) return;
    setStarting(true);
    try {
      const session = await createSession({ questionId: question.id, mode });
      navigate(`/sessions/${session.id}?mode=${mode}`, {
        state: { messages: session.messages ?? [] },
      });
    } catch {
      alert('Failed to start session.');
      setStarting(false);
    }
  }

  if (!question) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  const DIFFICULTY_COLORS = {
    easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {question.company && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{question.company}</span>
            )}
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{question.genre}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-3">{question.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{question.description}</p>
        </div>

        <button
          onClick={() => setHintsOpen(v => !v)}
          className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 mb-6 transition-colors"
        >
          <Lightbulb size={13} />
          {hintsOpen ? 'Hide hints' : 'Show hints'}
          <ChevronDown size={13} className={`transition-transform ${hintsOpen ? 'rotate-180' : ''}`} />
        </button>
        {hintsOpen && (
          <ul className="mb-6 space-y-2">
            {question.hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-amber-500 mt-0.5">•</span> {hint}
              </li>
            ))}
          </ul>
        )}

        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium text-slate-400 mb-3">Choose a session mode</p>
          {(Object.keys(MODE_DESCRIPTIONS) as SessionMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                mode === m
                  ? 'bg-indigo-600/10 border-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-medium text-slate-200 mb-0.5">{MODE_DESCRIPTIONS[m].label}</div>
              <div className="text-xs text-slate-500">{MODE_DESCRIPTIONS[m].description}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors"
        >
          {starting ? 'Starting...' : 'Start Session'}
        </button>
      </div>
    </div>
  );
}
