/**
 * Phase 206: Reusable skeleton loader components.
 */

export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <SkeletonCircle size={32} className="mb-4" />
      <SkeletonLine width="60%" height={18} className="mb-3" />
      <SkeletonLine width="90%" className="mb-2" />
      <SkeletonLine width="75%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} width={`${100 / cols}%`} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}
