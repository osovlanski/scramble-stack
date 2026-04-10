import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchFeed } from '../api';
import { ArticleCard } from './ArticleCard';
import { ThemeFilter } from './ThemeFilter';
import type { Article, Theme } from '../types';

export function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeed({ page, theme: activeTheme ?? undefined });
      setArticles(data.articles);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, activeTheme]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  function handleThemeChange(theme: Theme | null) {
    setActiveTheme(theme);
    setPage(1);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <a
            href={import.meta.env.VITE_HUB_URL ?? 'http://localhost:5173'}
            className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors"
            title="Back to ScrambleStack hub"
          >
            ← ScrambleStack
          </a>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400 text-sm">News Feed</span>
          <div className="ml-auto flex gap-2">
            <Link to="/news/digest" className="text-xs text-indigo-400 hover:underline">Daily Digest →</Link>
          </div>
        </div>
        <ThemeFilter active={activeTheme} onChange={handleThemeChange} />
      </div>

      <div className="flex flex-col gap-3 p-4">
        {loading && <div className="text-slate-500 text-sm text-center py-8">Loading...</div>}
        {!loading && articles.length === 0 && (
          <div className="text-slate-500 text-sm text-center py-8">
            No articles yet. Feed refreshes every 30 minutes.
          </div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-3 pb-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs text-slate-400 disabled:opacity-30 hover:text-slate-200"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="text-xs text-slate-400 disabled:opacity-30 hover:text-slate-200"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
