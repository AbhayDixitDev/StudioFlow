import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export const Select = forwardRef(
  ({ label, options, placeholder, error, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full rounded-lg px-3 py-2 pr-10 text-sm appearance-none bg-[var(--glass-bg)] border text-[var(--text-primary)] transition-colors duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent',
              error ? 'border-[var(--accent-error)]' : 'border-[var(--glass-border)]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-[var(--accent-error)]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
