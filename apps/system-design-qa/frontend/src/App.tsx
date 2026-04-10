import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import LibraryPage from './Library/LibraryPage';
import QuestionPage from './Question/QuestionPage';
import SessionPage from './Session/SessionPage';
import ResultPage from './Result/ResultPage';

const HUB_URL = import.meta.env.VITE_HUB_URL ?? 'http://localhost:5173';

function AppTopNav() {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-2 px-4 h-10 bg-slate-900 border-b border-slate-800/60 shrink-0">
      <a
        href={HUB_URL}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm"
        title="Back to ScrambleStack hub"
      >
        <Cpu size={13} className="text-indigo-400" />
        <span className="font-medium">ScrambleStack</span>
      </a>
      <span className="text-slate-700">/</span>
      <span className="text-slate-300 text-sm">System Design Q&amp;A</span>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <AppTopNav />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/questions/:id" element={<QuestionPage />} />
            <Route path="/sessions/:id" element={<SessionPage />} />
            <Route path="/sessions/:id/result" element={<ResultPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
