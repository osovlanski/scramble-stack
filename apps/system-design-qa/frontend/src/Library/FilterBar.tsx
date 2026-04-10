const GENRES = ['all', 'distributed-systems', 'storage', 'messaging', 'search', 'feed', 'payments', 'notifications', 'cdn', 'rate-limiting'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

interface Props {
  genre: string;
  difficulty: string;
  company: string;
  onGenreChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
}

export default function FilterBar({ genre, difficulty, company, onGenreChange, onDifficultyChange, onCompanyChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search company..."
        value={company}
        onChange={e => onCompanyChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
      />
      <div className="flex flex-wrap gap-1.5">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => onGenreChange(g)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              genre === g
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {DIFFICULTIES.map(d => (
          <button
            key={d}
            onClick={() => onDifficultyChange(d)}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
              difficulty === d
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
