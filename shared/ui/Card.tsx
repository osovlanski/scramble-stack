import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface border border-border-subtle rounded-lg p-4 shadow-sm',
        interactive &&
          'cursor-pointer transition-colors duration-fast ease-standard hover:border-border-strong hover:bg-surface-raised',
        className,
      )}
      {...rest}
    />
  ),
);

Card.displayName = 'Card';
