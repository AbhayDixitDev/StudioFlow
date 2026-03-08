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
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {logo ?? <Music className="h-6 w-6 text-[var(--accent-primary)] shrink-0" />}
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
              Audio Separator
            </span>
          </div>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--text-secondary)] hidden md:flex"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--text-secondary)] md:hidden"
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
              activeNavId === item.id
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)]'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {onThemeToggle && (
        <div className="p-2 border-t border-[var(--glass-border)]">
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)] transition-colors duration-200"
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
    <div className={cn('flex h-screen bg-[var(--bg-primary)]', className)}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[var(--glass-border)] bg-[var(--bg-sidebar)] transition-all duration-300',
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
              className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-[var(--glass-border)] bg-[var(--bg-sidebar)] md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex items-center gap-3 p-3 border-b border-[var(--glass-border)] md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--glass-hover-bg)] text-[var(--text-secondary)]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Audio Separator</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
