import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDigest } from '../api';
import { DigestArticleRow } from './DigestArticleRow';
import type { DigestResponse } from '../types';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function prevDate(isoDate: string): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function nextDate(isoDate: string): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const todayStr = () => new Date().toISOString().split('T')[0];

export function DigestPage() {
  const [date, setDate] = useState(todayStr());
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDigest(date)
      .then(setDigest)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="font-semibold text-slate-100">Morning Brief</span>
          {digest && (
            <span className="text-slate-500 text-sm">
              {formatDate(date)} · {digest.articleCount} articles
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setDate(prevDate(date))}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
            >
              ← Yesterday
            </button>
            {date < todayStr() && (
              <button
                onClick={() => setDate(nextDate(date))}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
              >
                Tomorrow →
              </button>
            )}
            <Link to="/news" className="text-xs text-indigo-400 hover:underline ml-1">Live Feed</Link>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading && <div className="text-slate-500 text-sm text-center py-8">Loading digest...</div>}

        {!loading && digest && (
          <>
            <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
              <div className="text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wide">
                Architect's Take
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{digest.briefingText}</p>
            </div>

            <div className="flex flex-col gap-2">
              {digest.articles.map((article, index) => (
                <DigestArticleRow key={article.id} article={article} index={index} />
              ))}
            </div>
          </>
        )}

        {!loading && !digest && (
          <div className="text-slate-500 text-sm text-center py-8">
            No digest for this date yet.
          </div>
        )}
      </div>
    </div>
  );
}
