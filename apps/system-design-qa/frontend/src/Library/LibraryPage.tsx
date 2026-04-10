import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit } from 'lucide-react';
import { fetchQuestions, generateQuestion } from '../api';
import type { Question } from '../types';
import QuestionCard from './QuestionCard';
import FilterBar from './FilterBar';

const GENRES = ['distributed-systems', 'storage', 'messaging', 'search', 'feed', 'payments', 'notifications', 'cdn', 'rate-limiting'];

export default function LibraryPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [genre, setGenre] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genGenre, setGenGenre] = useState('distributed-systems');
  const [genDifficulty, setGenDifficulty] = useState('medium');
  const [genCompany, setGenCompany] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (genre !== 'all') params.genre = genre;
      if (difficulty !== 'all') params.difficulty = difficulty;
      if (company.trim()) params.company = company.trim();
      const data = await fetchQuestions(params);
      setQuestions(data.questions);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [genre, difficulty, company]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { id } = await generateQuestion({
        genre: genGenre,
        difficulty: genDifficulty,
        company: genCompany.trim() || undefined,
      });
      await load();
      window.location.href = `/questions/${id}`;
    } catch {
      alert('Failed to generate question. Check API key.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">System Design Q&A</h1>
            <p className="text-xs text-slate-500">{total} questions</p>
          </div>
        </div>

        <FilterBar
          genre={genre}
          difficulty={difficulty}
          company={company}
          onGenreChange={setGenre}
          onDifficultyChange={setDifficulty}
          onCompanyChange={setCompany}
        />

        {loading ? (
          <div className="text-slate-500 text-sm py-16 text-center">Loading...</div>
        ) : (
          <div className="grid gap-3">
            {questions.map(q => <QuestionCard key={q.id} question={q} />)}
            {questions.length === 0 && (
              <div className="text-slate-500 text-sm py-16 text-center">No questions found.</div>
            )}
          </div>
        )}

        <div className="mt-10 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Generate a question with AI</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={genGenre}
              onChange={e => setGenGenre(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={genDifficulty}
              onChange={e => setGenDifficulty(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="text"
              placeholder="Company (optional)"
              value={genCompany}
              onChange={e => setGenCompany(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
