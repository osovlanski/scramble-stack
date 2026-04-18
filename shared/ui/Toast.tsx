import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from './cn';

type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  ttlMs: number;
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone, ttlMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  info: 'border-info/40 bg-info/10 text-fg-primary',
  success: 'border-success/40 bg-success/10 text-fg-primary',
  warning: 'border-warning/40 bg-warning/10 text-fg-primary',
  danger: 'border-danger/40 bg-danger/10 text-fg-primary',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = 'info', ttlMs = 4000) => {
    const id = ++nextIdRef.current;
    setToasts(prev => [...prev, { id, message, tone, ttlMs }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(toast =>
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.ttlMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'rounded-md border px-4 py-2 shadow-md text-sm backdrop-blur-sm',
              'animate-in fade-in slide-in-from-bottom-2',
              toneClasses[toast.tone],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
