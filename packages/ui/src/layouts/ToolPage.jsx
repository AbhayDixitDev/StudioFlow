import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export function ToolPage({
  title,
  description,
  icon,
  actions,
  children,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col h-full', className)}
    >
      <header className="shrink-0 px-6 py-5 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-[var(--text-muted)] truncate">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">{children}</div>
    </motion.div>
  );
}
