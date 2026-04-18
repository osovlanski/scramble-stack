import { useEffect, useState } from 'react';
import { LayoutGrid, Newspaper, BrainCircuit } from 'lucide-react';

const CANVAS_API_ROOT = (import.meta.env.VITE_CANVAS_API_URL ?? '/api').replace(/\/$/, '');
const NEWS_FEED_API = import.meta.env.VITE_NEWS_FEED_API_URL?.replace(/\/$/, '');
const QA_API = import.meta.env.VITE_SYSTEM_DESIGN_QA_API_URL?.replace(/\/$/, '');

interface CanvasStats {
  diagrams: number;
  lastUpdated: string | null;
}

interface NewsFeedStats {
  totalArticles: number;
  curatedArticles: number;
  lastCuratedAt: string | null;
}

interface QaStats {
  totalQuestions: number;
  totalSessions: number;
  completedSessions: number;
  recentAvgScore: number | null;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal, credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function StatCard({
  icon,
  label,
  primary,
  secondary,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-100 leading-tight">{primary}</span>
        {secondary ? (
          <span className="text-[11px] text-slate-500 leading-tight">{secondary}</span>
        ) : null}
      </div>
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function StatsStrip() {
  const [canvas, setCanvas] = useState<CanvasStats | null>(null);
  const [news, setNews] = useState<NewsFeedStats | null>(null);
  const [qa, setQa] = useState<QaStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<CanvasStats>(`${CANVAS_API_ROOT}/stats`, controller.signal).then(setCanvas);
    if (NEWS_FEED_API) {
      fetchJson<NewsFeedStats>(`${NEWS_FEED_API}/stats`, controller.signal).then(setNews);
    }
    if (QA_API) {
      fetchJson<QaStats>(`${QA_API}/stats`, controller.signal).then(setQa);
    }
    return () => controller.abort();
  }, []);

  return (
    <div
      aria-label="Platform activity"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mb-8"
    >
      <StatCard
        icon={<LayoutGrid size={16} strokeWidth={1.75} />}
        label="Diagrams"
        primary={canvas ? `${canvas.diagrams}` : '—'}
        secondary={canvas ? `Updated ${formatRelative(canvas.lastUpdated)}` : 'Loading…'}
        accent="bg-indigo-500/10 text-indigo-400"
      />
      <StatCard
        icon={<Newspaper size={16} strokeWidth={1.75} />}
        label="Curated articles"
        primary={news ? `${news.curatedArticles} / ${news.totalArticles}` : '—'}
        secondary={
          news
            ? `Last curated ${formatRelative(news.lastCuratedAt)}`
            : NEWS_FEED_API
              ? 'Loading…'
              : 'Backend not configured'
        }
        accent="bg-cyan-500/10 text-cyan-400"
      />
      <StatCard
        icon={<BrainCircuit size={16} strokeWidth={1.75} />}
        label="Practice sessions"
        primary={qa ? `${qa.completedSessions} / ${qa.totalSessions}` : '—'}
        secondary={
          qa
            ? qa.recentAvgScore !== null
              ? `Recent avg score ${qa.recentAvgScore}`
              : `${qa.totalQuestions} questions`
            : QA_API
              ? 'Loading…'
              : 'Backend not configured'
        }
        accent="bg-violet-500/10 text-violet-400"
      />
    </div>
  );
}
