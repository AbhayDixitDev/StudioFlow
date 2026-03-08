import { forwardRef } from 'react';
import { cn } from '../lib/cn';

export const Input = forwardRef(
  ({ label, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm bg-[var(--glass-bg)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent',
              error ? 'border-[var(--accent-error)]' : 'border-[var(--glass-border)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[var(--accent-error)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
