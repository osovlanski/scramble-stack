import { useNavigate } from 'react-router-dom';
import type { Question } from '../types';

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function QuestionCard({ question }: { question: Question }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/questions/${question.id}`)}
      className="group w-full text-left p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/40 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
          {question.title}
        </h3>
        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[question.difficulty]}`}>
          {question.difficulty}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {question.company && (
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            {question.company}
          </span>
        )}
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {question.genre}
        </span>
        {question.isAiGenerated && (
          <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            AI generated
          </span>
        )}
      </div>
    </button>
  );
}
