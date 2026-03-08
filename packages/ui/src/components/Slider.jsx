import { cn } from '../lib/cn';

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = false,
  formatValue,
  onChange,
  className,
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatValue ? formatValue(value) : value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-cyan-500"
      />
    </div>
  );
}
