import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Newspaper, ArrowRight, Cpu } from 'lucide-react';

const NEWS_FEED_URL = import.meta.env.VITE_NEWS_FEED_URL as string | undefined;

interface AppDefinition {
  key: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  status: 'available' | 'coming-soon';
  action: () => void;
  accentClass: string;
  iconBgClass: string;
}

export default function HubPage() {
  const navigate = useNavigate();

  const apps: AppDefinition[] = [
    {
      key: 'canvas',
      icon: <LayoutGrid size={28} strokeWidth={1.5} />,
      name: 'Canvas',
      description: 'System design diagrams, HLD components, AI generation',
      status: 'available',
      action: () => navigate('/canvas'),
      accentClass: 'border-indigo-500/40 hover:border-indigo-400/70',
      iconBgClass: 'bg-indigo-500/10 text-indigo-400',
    },
    {
      key: 'news-feed',
      icon: <Newspaper size={28} strokeWidth={1.5} />,
      name: 'News Feed',
      description: 'Curated tech news, daily digest, AI signal filtering',
      status: NEWS_FEED_URL ? 'available' : 'coming-soon',
      action: () => {
        if (NEWS_FEED_URL) {
          window.open(NEWS_FEED_URL, '_blank', 'noopener,noreferrer');
        }
      },
      accentClass: NEWS_FEED_URL
        ? 'border-cyan-500/40 hover:border-cyan-400/70'
        : 'border-slate-700/60 opacity-60',
      iconBgClass: 'bg-cyan-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-8 py-5 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600">
          <Cpu size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100 tracking-wide">ScrambleStack</span>
        <span className="text-xs text-slate-600 ml-auto font-mono">platform</span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Headline */}
        <div className="text-center mb-14 max-w-lg">
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight leading-none mb-3">
            Your tools,<br />
            <span className="text-indigo-400">one place.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Internal platform for engineering workflows — diagrams, signals, and insights.
          </p>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {apps.map((app) => (
            <AppTile key={app.key} app={app} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-slate-700 font-mono">
        scramblestack · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function AppTile({ app }: { app: AppDefinition }) {
  const isAvailable = app.status === 'available';

  return (
    <button
      onClick={isAvailable ? app.action : undefined}
      disabled={!isAvailable}
      aria-label={`Open ${app.name}`}
      className={[
        'group relative flex flex-col text-left p-6 rounded-xl',
        'bg-slate-900 border transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        isAvailable ? 'cursor-pointer' : 'cursor-default',
        app.accentClass,
      ].join(' ')}
    >
      {/* Status badge — top right */}
      <StatusBadge status={app.status} />

      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${app.iconBgClass}`}>
        {app.icon}
      </div>

      {/* Text */}
      <h2 className="text-base font-semibold text-slate-100 mb-1.5">{app.name}</h2>
      <p className="text-xs text-slate-400 leading-relaxed flex-1">{app.description}</p>

      {/* CTA */}
      {isAvailable && (
        <div className="flex items-center gap-1.5 mt-5 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors duration-150">
          Open
          <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </div>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: AppDefinition['status'] }) {
  if (status === 'available') {
    return (
      <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Available
      </span>
    );
  }

  return (
    <span className="absolute top-4 right-4 text-[10px] font-medium text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
      Coming soon
    </span>
  );
}
