import { useState, useEffect, useRef } from 'react';
import { Link } from 'lucide-react';
import { sendMessage, submitSession } from '../api';
import type { InterviewMessage } from '../types';

interface Props {
  sessionId: string;
  onSubmitted: () => void;
}

export default function InterviewChat({ sessionId, onSubmitted }: Props) {
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
