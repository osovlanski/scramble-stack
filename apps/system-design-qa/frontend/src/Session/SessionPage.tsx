import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Session } from '../types';
import StructuredEditor from './StructuredEditor';
import GradedEditor from './GradedEditor';
import InterviewChat from './InterviewChat';

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
