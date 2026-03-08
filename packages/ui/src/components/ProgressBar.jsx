import { cn } from '../lib/cn';

const variantColors = {
  default: 'bg-cyan-500',
  accent: 'bg-gradient-to-r from-cyan-500 to-violet-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
};

export function ProgressBar({
  value,
  variant = 'default',
  size = 'md',
  showLabel = false,
  className,
}) {
  const isIndeterminate = value === undefined;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && !isIndeterminate && (
        <div className="flex justify-end mb-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{Math.round(value)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700',
          size === 'sm' ? 'h-1' : 'h-2'
        )}
      >
        {isIndeterminate ? (
          <div
            className={cn('h-full w-1/3 rounded-full animate-indeterminate', variantColors[variant])}
          />
        ) : (
          <div
            className={cn('h-full rounded-full transition-all duration-300 ease-out', variantColors[variant])}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        )}
      </div>
    </div>
  );
}
