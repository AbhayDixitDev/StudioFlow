import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Music,
  Scissors,
  ArrowRightLeft,
  Video,
  Film,
  Sun,
  Moon,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../lib/cn';

const defaultNavItems = [
  { id: 'separator', label: 'Audio Separator', icon: <Music className="h-5 w-5" /> },
  { id: 'video-to-audio', label: 'Video to Audio', icon: <Film className="h-5 w-5" /> },
  { id: 'cutter', label: 'Audio Cutter', icon: <Scissors className="h-5 w-5" /> },
  { id: 'converter', label: 'Format Changer', icon: <ArrowRightLeft className="h-5 w-5" /> },
  { id: 'editor', label: 'Video Editor', icon: <Video className="h-5 w-5" /> },
];

export function AppShell({
  children,
  navItems = defaultNavItems,
  activeNavId,
  onNavSelect,
  theme = 'dark',
  onThemeToggle,
  logo,
  className,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {logo ?? <Music className="h-6 w-6 text-cyan-500 shrink-0" />}
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              StudioFlow
            </span>
          </div>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hidden md:flex"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id || item.path || item.label}
            onClick={() => {
              onNavSelect?.(item.id);
              item.onClick?.();
              setMobileOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
              (activeNavId === item.id || item.active)
                ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {onThemeToggle && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && (
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={cn('flex h-screen bg-gray-50 dark:bg-gray-950', className)}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">StudioFlow</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
