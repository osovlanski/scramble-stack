import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...rest }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full h-10 px-3 rounded-md',
        'bg-surface-raised text-fg-primary placeholder:text-fg-muted',
        'border border-border-subtle',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500',
        'transition-colors duration-fast ease-standard',
        invalid && 'border-danger focus:ring-danger/50 focus:border-danger',
        className,
      )}
      {...rest}
    />
  ),
);

Input.displayName = 'Input';
