import { useNavigate, useLocation } from 'react-router-dom';
import { Cpu, LayoutGrid, Newspaper, Home, BrainCircuit } from 'lucide-react';

const NEWS_FEED_URL = import.meta.env.VITE_NEWS_FEED_URL as string | undefined;
const SYSTEM_DESIGN_URL = import.meta.env.VITE_SYSTEM_DESIGN_URL as string | undefined;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  matchPath?: string;
  disabled?: boolean;
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      key: 'canvas',
      icon: <LayoutGrid size={18} strokeWidth={1.5} />,
      label: 'Canvas',
      action: () => navigate('/canvas'),
      matchPath: '/canvas',
    },
    {
      key: 'news-feed',
      icon: <Newspaper size={18} strokeWidth={1.5} />,
      label: NEWS_FEED_URL ? 'News Feed' : 'News Feed (coming soon)',
      action: () => {
        if (NEWS_FEED_URL) window.open(NEWS_FEED_URL, '_blank', 'noopener,noreferrer');
      },
      disabled: !NEWS_FEED_URL,
    },
    {
      key: 'system-design-qa',
      icon: <BrainCircuit size={18} strokeWidth={1.5} />,
      label: SYSTEM_DESIGN_URL ? 'System Design Q&A' : 'System Design Q&A (coming soon)',
      action: () => {
        if (SYSTEM_DESIGN_URL) window.open(SYSTEM_DESIGN_URL, '_blank', 'noopener,noreferrer');
      },
      disabled: !SYSTEM_DESIGN_URL,
    },
  ];

  const isActive = (item: NavItem) =>
    item.matchPath ? location.pathname.startsWith(item.matchPath) : false;

  return (
    <aside className="flex flex-col items-center w-12 h-full bg-slate-900 border-r border-slate-800/60 py-3 shrink-0 z-20">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        title="ScrambleStack home"
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors duration-150 mb-4"
      >
        <Cpu size={14} className="text-white" />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-slate-800 mb-4" />

      {/* App nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <div key={item.key} className="relative group">
              <button
                onClick={item.disabled ? undefined : item.action}
                disabled={item.disabled}
                title={item.label}
                className={[
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
                  active
                    ? 'bg-indigo-600 text-white'
                    : item.disabled
                      ? 'text-slate-700 cursor-default'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800',
                ].join(' ')}
              >
                {item.icon}
              </button>

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Home at bottom */}
      <div className="relative group mt-auto">
        <button
          onClick={() => navigate('/')}
          title="Home"
          className={[
            'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
            location.pathname === '/'
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800',
          ].join(' ')}
        >
          <Home size={16} strokeWidth={1.5} />
        </button>
        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
          Home
        </span>
      </div>
    </aside>
  );
}
