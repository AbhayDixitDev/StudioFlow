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
      <header className="shrink-0 px-6 py-5 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{description}</p>
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
