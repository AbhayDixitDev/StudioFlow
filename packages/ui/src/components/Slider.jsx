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
          {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-[var(--text-primary)]">
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
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--glass-border)] accent-[var(--accent-primary)]"
        style={{
          background: `linear-gradient(to right, var(--accent-primary) ${percentage}%, var(--glass-border) ${percentage}%)`,
        }}
      />
    </div>
  );
}
