# App C — System Design Q&A: Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/system-design-qa/frontend` — question library, session pages (structured/graded/interview), result page, and update the Canvas hub/sidebar to add the new app tile.

**Architecture:** Vite + React + Tailwind on port 5175. Proxies `/api` to `http://localhost:3002`. Dark slate theme matching the Canvas app. No auth — single user.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, React Router, axios

**Reference:** Follow `apps/news-feed/frontend/` for package.json, tsconfig, vite.config.ts, tailwind setup. Follow `apps/canvas/frontend/src/` dark slate theme (bg-slate-950, indigo accents).

**Prerequisite:** Backend plan complete (`apps/system-design-qa/backend` running on port 3002).

---

### Task 14: Frontend scaffold

**Files:**
- Create: `apps/system-design-qa/frontend/package.json`
- Create: `apps/system-design-qa/frontend/tsconfig.json`
- Create: `apps/system-design-qa/frontend/vite.config.ts`
- Create: `apps/system-design-qa/frontend/index.html`
- Create: `apps/system-design-qa/frontend/postcss.config.js`
- Create: `apps/system-design-qa/frontend/tailwind.config.js`
- Create: `apps/system-design-qa/frontend/src/main.tsx`
- Create: `apps/system-design-qa/frontend/src/index.css`
- Create: `apps/system-design-qa/frontend/src/types.ts`
- Create: `apps/system-design-qa/frontend/src/api.ts`
- Create: `apps/system-design-qa/frontend/src/App.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "scramble-stack-system-design-qa-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.2",
    "vite": "^5.1.4"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:3002',
    },
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>System Design Q&A</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create postcss.config.js and tailwind.config.js**

```javascript
// postcss.config.js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 6: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create src/types.ts**

```typescript
export interface Question {
  id: string;
  title: string;
  company: string | null;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  hints: string[];
  isAiGenerated: boolean;
  createdAt: string;
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
}

export type SessionMode = 'structured' | 'interview' | 'graded';
export type SessionStatus = 'in_progress' | 'submitted' | 'scored';

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  messages: InterviewMessage[];
}

export interface ScoreBreakdown {
  scalability: number;
  data_model: number;
  component_design: number;
  reliability: number;
  tradeoffs: number;
}

export interface SessionResult {
  score: number;
  breakdown: ScoreBreakdown;
  strengths: string;
  gaps: string;
  modelAnswer: string;
  mode: SessionMode;
}
```

- [ ] **Step 8: Create src/api.ts**

```typescript
import axios from 'axios';
import type { Question, QuestionsResponse, Session, SessionResult } from './types';

const http = axios.create({ baseURL: '/api' });

export async function fetchQuestions(params: {
  company?: string;
  genre?: string;
  difficulty?: string;
  q?: string;
}): Promise<QuestionsResponse> {
  const { data } = await http.get<QuestionsResponse>('/questions', { params });
  return data;
}

export async function fetchQuestion(id: string): Promise<Question> {
  const { data } = await http.get<Question>(`/questions/${id}`);
  return data;
}

export async function generateQuestion(params: {
  company?: string;
  genre: string;
  difficulty: string;
}): Promise<{ id: string }> {
  const { data } = await http.post<{ id: string }>('/questions/generate', params);
  return data;
}

export async function createSession(params: {
  questionId: string;
  mode: string;
}): Promise<Session & { messages: import('./types').InterviewMessage[] }> {
  const { data } = await http.post('/sessions', params);
  return data;
}

export async function sendMessage(sessionId: string, content: string): Promise<{
  content: string;
  readyToSubmit: boolean;
  messages: import('./types').InterviewMessage[];
}> {
  const { data } = await http.post(`/sessions/${sessionId}/message`, { content });
  return data;
}

export async function submitSession(sessionId: string, params: {
  textAnswer: string;
  canvasDiagramId?: string;
}): Promise<{ ok: boolean; score: number | null }> {
  const { data } = await http.post(`/sessions/${sessionId}/submit`, params);
  return data;
}

export async function fetchResult(sessionId: string): Promise<SessionResult> {
  const { data } = await http.get<SessionResult>(`/sessions/${sessionId}/result`);
  return data;
}
```

- [ ] **Step 9: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 10: Create src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LibraryPage from './Library/LibraryPage';
import QuestionPage from './Question/QuestionPage';
import SessionPage from './Session/SessionPage';
import ResultPage from './Result/ResultPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/questions/:id" element={<QuestionPage />} />
        <Route path="/sessions/:id" element={<SessionPage />} />
        <Route path="/sessions/:id/result" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 11: Install dependencies and verify lint**

```bash
npm install --workspace=apps/system-design-qa/frontend
npm run lint --workspace=apps/system-design-qa/frontend
```

Expected: no errors (App imports don't exist yet — add `// @ts-ignore` temporarily or stub the page files first).

Actually: create stub files for each page so the lint passes:

```bash
mkdir -p apps/system-design-qa/frontend/src/{Library,Question,Session,Result}
```

Create a one-line stub for each:
- `src/Library/LibraryPage.tsx` → `export default function LibraryPage() { return <div/>; }`
- `src/Question/QuestionPage.tsx` → `export default function QuestionPage() { return <div/>; }`
- `src/Session/SessionPage.tsx` → `export default function SessionPage() { return <div/>; }`
- `src/Result/ResultPage.tsx` → `export default function ResultPage() { return <div/>; }`

- [ ] **Step 12: Commit**

```bash
git add apps/system-design-qa/frontend/
git commit -m "feat(system-design-qa): scaffold frontend — Vite + React + Tailwind"
```

---

### Task 15: Library page

**Files:**
- Replace stub: `apps/system-design-qa/frontend/src/Library/LibraryPage.tsx`
- Create: `apps/system-design-qa/frontend/src/Library/QuestionCard.tsx`
- Create: `apps/system-design-qa/frontend/src/Library/FilterBar.tsx`

- [ ] **Step 1: Create FilterBar.tsx**

```tsx
// src/Library/FilterBar.tsx
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
```

- [ ] **Step 2: Create QuestionCard.tsx**

```tsx
// src/Library/QuestionCard.tsx
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
```

- [ ] **Step 3: Replace LibraryPage.tsx stub**

```tsx
// src/Library/LibraryPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { BrainCircuit } from 'lucide-react';
import { fetchQuestions, generateQuestion } from '../api';
import type { Question } from '../types';
import QuestionCard from './QuestionCard';
import FilterBar from './FilterBar';

const GENRES = ['distributed-systems', 'storage', 'messaging', 'search', 'feed', 'payments', 'notifications', 'cdn', 'rate-limiting'];

export default function LibraryPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [genre, setGenre] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genGenre, setGenGenre] = useState('distributed-systems');
  const [genDifficulty, setGenDifficulty] = useState('medium');
  const [genCompany, setGenCompany] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (genre !== 'all') params.genre = genre;
      if (difficulty !== 'all') params.difficulty = difficulty;
      if (company.trim()) params.company = company.trim();
      const data = await fetchQuestions(params);
      setQuestions(data.questions);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [genre, difficulty, company]);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { id } = await generateQuestion({
        genre: genGenre,
        difficulty: genDifficulty,
        company: genCompany.trim() || undefined,
      });
      // Reload and navigate to the new question
      await load();
      window.location.href = `/questions/${id}`;
    } catch {
      alert('Failed to generate question. Check API key.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">System Design Q&A</h1>
            <p className="text-xs text-slate-500">{total} questions</p>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          genre={genre}
          difficulty={difficulty}
          company={company}
          onGenreChange={setGenre}
          onDifficultyChange={setDifficulty}
          onCompanyChange={setCompany}
        />

        {/* Questions */}
        {loading ? (
          <div className="text-slate-500 text-sm py-16 text-center">Loading...</div>
        ) : (
          <div className="grid gap-3">
            {questions.map(q => <QuestionCard key={q.id} question={q} />)}
            {questions.length === 0 && (
              <div className="text-slate-500 text-sm py-16 text-center">No questions found.</div>
            )}
          </div>
        )}

        {/* AI Generator */}
        <div className="mt-10 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Generate a question with AI</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <select
              value={genGenre}
              onChange={e => setGenGenre(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={genDifficulty}
              onChange={e => setGenDifficulty(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="text"
              placeholder="Company (optional)"
              value={genCompany}
              onChange={e => setGenCompany(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify lint**

```bash
npm run lint --workspace=apps/system-design-qa/frontend
```

- [ ] **Step 5: Commit**

```bash
git add apps/system-design-qa/frontend/src/Library/
git commit -m "feat(system-design-qa): add question library page"
```

---

### Task 16: Question detail page

**Files:**
- Replace stub: `apps/system-design-qa/frontend/src/Question/QuestionPage.tsx`

- [ ] **Step 1: Replace stub**

```tsx
// src/Question/QuestionPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lightbulb, ChevronDown } from 'lucide-react';
import { fetchQuestion, createSession } from '../api';
import type { Question, SessionMode } from '../types';

const MODE_DESCRIPTIONS: Record<SessionMode, { label: string; description: string }> = {
  structured: {
    label: 'Structured Answer',
    description: 'Write your answer freely. No time limit. Optionally attach a Canvas diagram.',
  },
  interview: {
    label: 'Mock Interview',
    description: 'Claude asks 3 clarifying questions before you design. Simulates a real interview.',
  },
  graded: {
    label: 'Graded (45 min)',
    description: 'Timed challenge. Same as structured but with a countdown.',
  },
};

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [mode, setMode] = useState<SessionMode>('structured');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchQuestion(id).then(setQuestion);
  }, [id]);

  async function handleStart() {
    if (!question) return;
    setStarting(true);
    try {
      const session = await createSession({ questionId: question.id, mode });
      navigate(`/sessions/${session.id}`);
    } catch {
      alert('Failed to start session.');
      setStarting(false);
    }
  }

  if (!question) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  }

  const DIFFICULTY_COLORS = {
    easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </button>

        {/* Question header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {question.company && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{question.company}</span>
            )}
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{question.genre}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-3">{question.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{question.description}</p>
        </div>

        {/* Hints toggle */}
        <button
          onClick={() => setHintsOpen(v => !v)}
          className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 mb-6 transition-colors"
        >
          <Lightbulb size={13} />
          {hintsOpen ? 'Hide hints' : 'Show hints'}
          <ChevronDown size={13} className={`transition-transform ${hintsOpen ? 'rotate-180' : ''}`} />
        </button>
        {hintsOpen && (
          <ul className="mb-6 space-y-2">
            {question.hints.map((hint, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-amber-500 mt-0.5">•</span> {hint}
              </li>
            ))}
          </ul>
        )}

        {/* Mode selector */}
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium text-slate-400 mb-3">Choose a session mode</p>
          {(Object.keys(MODE_DESCRIPTIONS) as SessionMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                mode === m
                  ? 'bg-indigo-600/10 border-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-medium text-slate-200 mb-0.5">{MODE_DESCRIPTIONS[m].label}</div>
              <div className="text-xs text-slate-500">{MODE_DESCRIPTIONS[m].description}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors"
        >
          {starting ? 'Starting...' : 'Start Session'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint, commit**

```bash
npm run lint --workspace=apps/system-design-qa/frontend
git add apps/system-design-qa/frontend/src/Question/
git commit -m "feat(system-design-qa): add question detail page"
```

---

### Task 17: Session page — structured + graded modes

**Files:**
- Replace stub: `apps/system-design-qa/frontend/src/Session/SessionPage.tsx`
- Create: `apps/system-design-qa/frontend/src/Session/StructuredEditor.tsx`
- Create: `apps/system-design-qa/frontend/src/Session/GradedEditor.tsx`
- Create: `apps/system-design-qa/frontend/src/Session/InterviewChat.tsx` (stub only — Task 18)

- [ ] **Step 1: Create StructuredEditor.tsx**

```tsx
// src/Session/StructuredEditor.tsx
import { useState } from 'react';
import { Link } from 'lucide-react';
import { submitSession } from '../api';

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function StructuredEditor({ sessionId, onSubmitted }: Props) {
  const [answer, setAnswer] = useState('');
  const [diagramId, setDiagramId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await submitSession(sessionId, {
        textAnswer: answer,
        canvasDiagramId: diagramId.trim() || undefined,
      });
      onSubmitted();
    } catch {
      alert('Submission failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Describe your system design here — components, data model, scalability approach, tradeoffs..."
        className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 min-h-[300px]"
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Link size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Canvas diagram ID (optional)"
            value={diagramId}
            onChange={e => setDiagramId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          {submitting ? 'Scoring...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create GradedEditor.tsx**

```tsx
// src/Session/GradedEditor.tsx
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { submitSession } from '../api';

const TIMEOUT_MINUTES = 45;

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function GradedEditor({ sessionId, onSubmitted }: Props) {
  const [answer, setAnswer] = useState('');
  const [diagramId, setDiagramId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_MINUTES * 60);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerColor = secondsLeft < 300 ? 'text-red-400' : secondsLeft < 900 ? 'text-amber-400' : 'text-emerald-400';

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await submitSession(sessionId, {
        textAnswer: answer,
        canvasDiagramId: diagramId.trim() || undefined,
      });
      onSubmitted();
    } catch {
      alert('Submission failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`flex items-center gap-2 text-sm font-mono ${timerColor}`}>
        <Clock size={14} />
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} remaining
        {secondsLeft === 0 && <span className="text-red-400 ml-2">Time's up!</span>}
      </div>

      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Describe your system design here — components, data model, scalability approach, tradeoffs..."
        className="flex-1 w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 min-h-[300px]"
      />

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Canvas diagram ID (optional)"
          value={diagramId}
          onChange={e => setDiagramId(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          {submitting ? 'Scoring...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace SessionPage.tsx stub**

```tsx
// src/Session/SessionPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Session } from '../types';
import StructuredEditor from './StructuredEditor';
import GradedEditor from './GradedEditor';
import InterviewChat from './InterviewChat';

// Minimal session load — we get mode from create response stored in location state,
// or we can re-fetch from the API. For simplicity, store session in state via navigation.
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Session mode passed from QuestionPage via URL search params
  const mode = new URLSearchParams(window.location.search).get('mode') as Session['mode'] | null;

  function handleSubmitted() {
    navigate(`/sessions/${id}/result`);
  }

  if (!id) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </button>

        <div className="flex flex-col gap-4">
          {mode === 'interview' ? (
            <InterviewChat sessionId={id} onSubmitted={handleSubmitted} />
          ) : mode === 'graded' ? (
            <GradedEditor sessionId={id} onSubmitted={handleSubmitted} />
          ) : (
            <StructuredEditor sessionId={id} onSubmitted={handleSubmitted} />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Important:** Update `QuestionPage.tsx` to pass `?mode=X` when navigating to the session:

In `QuestionPage.tsx`, change the navigate call:
```typescript
navigate(`/sessions/${session.id}?mode=${mode}`);
```

- [ ] **Step 4: Verify lint, commit**

```bash
npm run lint --workspace=apps/system-design-qa/frontend
git add apps/system-design-qa/frontend/src/Session/
git commit -m "feat(system-design-qa): add session page for structured and graded modes"
```

---

### Task 18: Interview chat

**Files:**
- Replace stub: `apps/system-design-qa/frontend/src/Session/InterviewChat.tsx`

- [ ] **Step 1: Replace InterviewChat stub**

```tsx
// src/Session/InterviewChat.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'lucide-react';
import { sendMessage, submitSession } from '../api';
import type { InterviewMessage } from '../types';

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function InterviewChat({ sessionId, onSubmitted }: Props) {
  // Initial messages loaded from navigation state (set by QuestionPage after createSession)
  const [messages, setMessages] = useState<InterviewMessage[]>(() => {
    const state = window.history.state?.usr as { messages?: InterviewMessage[] } | undefined;
    return state?.messages ?? [];
  });
  const [input, setInput] = useState('');
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [answer, setAnswer] = useState('');
  const [diagramId, setDiagramId] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    const userMsg: InterviewMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    try {
      const result = await sendMessage(sessionId, userMsg.content);
      setMessages(result.messages);
      if (result.readyToSubmit) setReadyToSubmit(true);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await submitSession(sessionId, {
        textAnswer: answer,
        canvasDiagramId: diagramId.trim() || undefined,
      });
      onSubmitted();
    } catch {
      alert('Submission failed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Chat messages */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-500 px-3 py-2 rounded-xl text-sm">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input or design submission */}
      {!readyToSubmit ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Answer the interviewer's question..."
            className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl">
          <p className="text-xs text-indigo-400 font-medium">Ready to submit your design</p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Describe your system design..."
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 min-h-[180px]"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Link size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Canvas diagram ID (optional)"
                value={diagramId}
                onChange={e => setDiagramId(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !answer.trim()}
              className="px-6 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {submitting ? 'Scoring...' : 'Submit Design'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Also update `QuestionPage.tsx` to pass initial messages in navigation state (for interview mode):

```typescript
// In handleStart(), after createSession():
navigate(`/sessions/${session.id}?mode=${mode}`, {
  state: { messages: session.messages ?? [] },
});
```

- [ ] **Step 2: Verify lint, commit**

```bash
npm run lint --workspace=apps/system-design-qa/frontend
git add apps/system-design-qa/frontend/src/Session/InterviewChat.tsx apps/system-design-qa/frontend/src/Question/QuestionPage.tsx
git commit -m "feat(system-design-qa): add interview chat mode"
```

---

### Task 19: Result page

**Files:**
- Replace stub: `apps/system-design-qa/frontend/src/Result/ResultPage.tsx`

- [ ] **Step 1: Replace ResultPage stub**

```tsx
// src/Result/ResultPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { fetchResult } from '../api';
import type { SessionResult, ScoreBreakdown } from '../types';

const DIMENSION_LABELS: Record<keyof ScoreBreakdown, string> = {
  scalability: 'Scalability',
  data_model: 'Data Model',
  component_design: 'Component Design',
  reliability: 'Reliability',
  tradeoffs: 'Tradeoffs',
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${
      score >= 80 ? 'border-emerald-500/40' : score >= 60 ? 'border-amber-500/40' : 'border-red-500/40'
    } bg-slate-900`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-slate-500">/ 100</span>
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 20) * 100;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}/20</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [modelAnswerOpen, setModelAnswerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let attempts = 0;
    const poll = async () => {
      try {
        const data = await fetchResult(id);
        setResult(data);
        setLoading(false);
      } catch {
        attempts++;
        if (attempts < 10) setTimeout(poll, 2000);
        else setLoading(false);
      }
    };
    poll();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-sm mb-2">Scoring your answer...</div>
          <div className="text-slate-600 text-xs">This takes 10–20 seconds</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Result not available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to library
        </button>

        {/* Score */}
        <div className="flex items-center gap-8 mb-8">
          <ScoreRing score={result.score} />
          <div>
            <h1 className="text-lg font-bold text-slate-100 mb-1">Your Score</h1>
            <p className="text-xs text-slate-500 capitalize">{result.mode} mode</p>
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Breakdown</h2>
          {(Object.keys(result.breakdown) as (keyof ScoreBreakdown)[]).map(dim => (
            <DimensionBar key={dim} label={DIMENSION_LABELS[dim]} value={result.breakdown[dim]} />
          ))}
        </div>

        {/* Strengths */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mb-3">
          <h3 className="text-xs font-semibold text-emerald-400 mb-2">What you covered well</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{result.strengths}</p>
        </div>

        {/* Gaps */}
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
          <h3 className="text-xs font-semibold text-red-400 mb-2">What was missing</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{result.gaps}</p>
        </div>

        {/* Model answer toggle */}
        <button
          onClick={() => setModelAnswerOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors mb-2"
        >
          Reveal model answer
          <ChevronDown size={15} className={`transition-transform ${modelAnswerOpen ? 'rotate-180' : ''}`} />
        </button>
        {modelAnswerOpen && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl mb-6">
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{result.modelAnswer}</p>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
        >
          Try another question
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify lint, commit**

```bash
npm run lint --workspace=apps/system-design-qa/frontend
git add apps/system-design-qa/frontend/src/Result/
git commit -m "feat(system-design-qa): add result page with score ring and model answer"
```

---

### Task 20: Hub + sidebar updates

**Files:**
- Modify: `apps/canvas/frontend/src/HubPage.tsx`
- Modify: `apps/canvas/frontend/src/AppSidebar.tsx`

- [ ] **Step 1: Update HubPage.tsx**

Add `VITE_SYSTEM_DESIGN_URL` env var and a new app tile. In `HubPage.tsx`:

```tsx
const SYSTEM_DESIGN_URL = import.meta.env.VITE_SYSTEM_DESIGN_URL as string | undefined;
```

Add to the `apps` array after `news-feed`:

```tsx
{
  key: 'system-design-qa',
  icon: <BrainCircuit size={28} strokeWidth={1.5} />,
  name: 'System Design Q&A',
  description: 'Practice system design interviews — question library, mock interviews, AI scoring',
  status: SYSTEM_DESIGN_URL ? 'available' : 'coming-soon',
  action: () => {
    if (SYSTEM_DESIGN_URL) window.open(SYSTEM_DESIGN_URL, '_blank', 'noopener,noreferrer');
  },
  accentClass: SYSTEM_DESIGN_URL
    ? 'border-violet-500/40 hover:border-violet-400/70'
    : 'border-slate-700/60 opacity-60',
  iconBgClass: 'bg-violet-500/10 text-violet-400',
},
```

Add `BrainCircuit` to the lucide-react import at the top of `HubPage.tsx`.

- [ ] **Step 2: Update AppSidebar.tsx**

Add `VITE_SYSTEM_DESIGN_URL` env var and a new nav item:

```tsx
const SYSTEM_DESIGN_URL = import.meta.env.VITE_SYSTEM_DESIGN_URL as string | undefined;
```

Add to the `navItems` array after `news-feed`:

```tsx
{
  key: 'system-design-qa',
  icon: <BrainCircuit size={18} strokeWidth={1.5} />,
  label: SYSTEM_DESIGN_URL ? 'System Design Q&A' : 'System Design Q&A (coming soon)',
  action: () => {
    if (SYSTEM_DESIGN_URL) window.open(SYSTEM_DESIGN_URL, '_blank', 'noopener,noreferrer');
  },
  disabled: !SYSTEM_DESIGN_URL,
},
```

Add `BrainCircuit` to the lucide-react import at the top of `AppSidebar.tsx`.

- [ ] **Step 3: Verify lint**

```bash
npm run lint --workspace=apps/canvas/frontend
```

- [ ] **Step 4: Commit**

```bash
git add apps/canvas/frontend/src/HubPage.tsx apps/canvas/frontend/src/AppSidebar.tsx
git commit -m "feat(canvas): add System Design Q&A tile to hub and sidebar"
```
