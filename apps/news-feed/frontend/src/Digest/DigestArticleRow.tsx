import { recordInteraction } from '../api';
import type { DigestArticle } from '../types';

const ACTION_COLORS: Record<string, string> = {
  adopt: 'text-emerald-400',
  watch: 'text-amber-400',
  avoid: 'text-red-400',
};

const INDEX_COLORS: Record<string, string> = {
  adopt: 'text-emerald-400',
  watch: 'text-amber-400',
  avoid: 'text-slate-400',
};

interface Props {
  article: DigestArticle;
  index: number;
}

export function DigestArticleRow({ article, index }: Props) {
  const colorKey = article.action ?? 'avoid';

  function handleClick() {
    recordInteraction(article.id, 'click_from_digest').catch(() => {});
  }

  return (
    <div
      className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-750 cursor-pointer"
      onClick={handleClick}
    >
      <span className={`text-base mt-0.5 font-semibold ${INDEX_COLORS[colorKey]}`}>
        {index + 1}
      </span>
      <div>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(article.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-slate-100 hover:text-indigo-300"
        >
          {article.title}
        </a>
        <div className="flex items-center gap-2 mt-0.5">
          {article.action && (
            <span className={`text-xs ${ACTION_COLORS[colorKey]}`}>{article.action}</span>
          )}
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-500">{article.themes[0]}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-500">{article.sourceId}</span>
        </div>
      </div>
    </div>
  );
}
