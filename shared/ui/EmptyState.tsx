import type { ReactNode } from 'react';
import { cn } from './cn';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center gap-3 py-12 px-6',
        'rounded-lg border border-dashed border-border-subtle bg-surface/50',
        className,
      )}
    >
      {icon && <div className="text-fg-muted text-3xl">{icon}</div>}
      <h3 className="text-base font-semibold text-fg-primary">{title}</h3>
      {description && <p className="text-sm text-fg-secondary max-w-md">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
