import { useState, useRef } from 'react';
import { recordInteraction } from '../api';
import type { Article } from '../types';

const SYSTEM_DESIGN_URL = import.meta.env.VITE_SYSTEM_DESIGN_URL as string | undefined;

const SIGNAL_COLORS: Record<string, string> = {
  real: 'border-indigo-500',
  hype: 'border-amber-500',
  noise: 'border-red-500',
};

const ACTION_BADGES: Record<string, string> = {
  adopt: 'bg-emerald-900 text-emerald-400',
  watch: 'bg-amber-900 text-amber-400',
  avoid: 'bg-red-900 text-red-400',
};

interface Props {
  article: Article;
}

export function ArticleCard({ article }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const openedAt = useRef<number | null>(null);

  const isNoise = article.signal === 'noise';

  function handleOpen() {
    setExpanded((prev) => {
      if (!prev) {
        openedAt.current = Date.now();
        recordInteraction(article.id, 'view').catch(() => {});
      } else if (openedAt.current) {
        const dwell = Date.now() - openedAt.current;
        recordInteraction(article.id, 'dwell', dwell).catch(() => {});
        openedAt.current = null;
      }
      return !prev;
    });
  }

  function handleVote(type: 'thumb_up' | 'thumb_down') {
    const next = type === 'thumb_up' ? 'up' : 'down';
    if (voted === next) return;
    setVoted(next);
    recordInteraction(article.id, type).catch(() => {});
  }

  function handleSkip(e: React.MouseEvent) {
    e.stopPropagation();
    recordInteraction(article.id, 'skip').catch(() => {});
  }

  return (
    <div
      className={`group relative bg-slate-800 rounded-lg p-3 border-l-4 ${SIGNAL_COLORS[article.signal]} transition-opacity ${isNoise ? 'opacity-50 hover:opacity-80' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{article.themes[0]}</span>
        {article.action && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_BADGES[article.action]}`}>{article.action}</span>
        )}
        {article.signal === 'noise' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-500">noise</span>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {article.sourceId} · {new Date(article.publishedAt).toLocaleDateString()}
        </span>
      </div>

      <button onClick={handleOpen} className="w-full text-left">
        <h3 className="text-sm font-semibold text-slate-100 mb-1">{article.title}</h3>
        {expanded && (
          <>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">{article.summary}</p>
            {article.insight && (
              <p className="text-xs text-amber-400 italic">{article.insight}</p>
            )}
            <div className="flex flex-wrap gap-3 items-center mt-2">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Read full article →
              </a>
              {SYSTEM_DESIGN_URL && (
                <a
                  href={`${SYSTEM_DESIGN_URL.replace(/\/$/, '')}/?prompt=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-400 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    recordInteraction(article.id, 'practice_qa').catch(() => {});
                  }}
                >
                  Practice this in Q&amp;A →
                </a>
              )}
            </div>
          </>
        )}
        {!expanded && (
          <p className="text-xs text-slate-400 line-clamp-2">{article.summary}</p>
        )}
      </button>

      <div className="absolute right-2 top-2 hidden group-hover:flex gap-1">
        <button
          onClick={() => handleVote('thumb_up')}
          className={`text-sm px-1.5 py-0.5 rounded ${voted === 'up' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          title="Helpful"
        >↑</button>
        <button
          onClick={() => handleVote('thumb_down')}
          className={`text-sm px-1.5 py-0.5 rounded ${voted === 'down' ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
          title="Not helpful"
        >↓</button>
        <button
          onClick={handleSkip}
          className="text-sm px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-300"
          title="Skip"
        >✕</button>
      </div>
    </div>
  );
}
