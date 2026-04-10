import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { fetchResult } from '../api';
import type { SessionResult, ScoreBreakdown } from '../types';

const DIMENSION_LABELS: Record<keyof ScoreBreakdown, string> = {
  scalability: 'Scalability',
  data_model: 'Data Model',
  component_design: 'Component Design',
  reliability: 'Reliability',
  tradeoffs: 'Tradeoffs',
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${
      score >= 80 ? 'border-emerald-500/40' : score >= 60 ? 'border-amber-500/40' : 'border-red-500/40'
    } bg-slate-900`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-slate-500">/ 100</span>
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 20) * 100;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}/20</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let attempts = 0;
    const poll = async () => {
      try {
        const data = await fetchResult(id);
        setResult(data);
        setLoading(false);
      } catch {
        attempts++;
        if (attempts < 10) setTimeout(poll, 2000);
        else setLoading(false);
      }
    };
    poll();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-sm mb-2">Scoring your answer...</div>
          <div className="text-slate-600 text-xs">This takes 10–20 seconds</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Result not available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </button>

        <div className="flex items-center gap-8 mb-8">
          <ScoreRing score={result.score} />
          <div>
            <h1 className="text-lg font-bold text-slate-100 mb-1">Your Score</h1>
            <p className="text-xs text-slate-500 capitalize">{result.mode} mode</p>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Breakdown</h2>
          {(Object.keys(result.breakdown) as (keyof ScoreBreakdown)[]).map(dim => (
            <DimensionBar key={dim} label={DIMENSION_LABELS[dim]} value={result.breakdown[dim]} />
          ))}
        </div>

        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-3">
          <h3 className="text-xs font-semibold text-emerald-400 mb-2">What you covered well</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{result.strengths}</p>
        </div>

        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
          <h3 className="text-xs font-semibold text-red-400 mb-2">What was missing</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{result.gaps}</p>
        </div>

        <button
          onClick={() => setModelAnswerOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors mb-2"
        >
          Reveal model answer
          <ChevronDown size={15} className={`transition-transform ${modelAnswerOpen ? 'rotate-180' : ''}`} />
        </button>
        {modelAnswerOpen && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl mb-6">
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{result.modelAnswer}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
        >
          Try another question
        </button>
      </div>
    </div>
  );
}
