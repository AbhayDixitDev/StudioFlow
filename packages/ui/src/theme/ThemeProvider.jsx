import { createContext, useContext, useEffect, useMemo } from 'react';
import { darkTheme } from './dark';
import { lightTheme } from './light';

const ThemeContext = createContext(null);

function applyThemeVars(theme) {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', theme.bg.primary);
  root.style.setProperty('--bg-secondary', theme.bg.secondary);
  root.style.setProperty('--bg-tertiary', theme.bg.tertiary);
  root.style.setProperty('--bg-sidebar', theme.bg.sidebar);
  root.style.setProperty('--bg-overlay', theme.bg.overlay);
  root.style.setProperty('--glass-bg', theme.glass.bg);
  root.style.setProperty('--glass-border', theme.glass.border);
  root.style.setProperty('--glass-blur', theme.glass.blur);
  root.style.setProperty('--glass-hover-bg', theme.glass.hoverBg);
  root.style.setProperty('--text-primary', theme.text.primary);
  root.style.setProperty('--text-secondary', theme.text.secondary);
  root.style.setProperty('--text-muted', theme.text.muted);
  root.style.setProperty('--accent-primary', theme.accent.primary);
  root.style.setProperty('--accent-secondary', theme.accent.secondary);
  root.style.setProperty('--accent-success', theme.accent.success);
  root.style.setProperty('--accent-warning', theme.accent.warning);
  root.style.setProperty('--accent-error', theme.accent.error);
  root.style.setProperty('--border-default', theme.border.default);
  root.style.setProperty('--border-hover', theme.border.hover);
  root.style.setProperty('--border-focus', theme.border.focus);
  root.style.setProperty('--shadow-sm', theme.shadow.sm);
  root.style.setProperty('--shadow-md', theme.shadow.md);
  root.style.setProperty('--shadow-lg', theme.shadow.lg);
  root.style.setProperty('--shadow-glow', theme.shadow.glow);

  root.setAttribute('data-theme', theme.name);
  root.classList.toggle('dark', theme.name === 'dark');
}

export function ThemeProvider({ children, mode, onModeChange }) {
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      toggleTheme: () => onModeChange(mode === 'dark' ? 'light' : 'dark'),
      setMode: onModeChange,
    }),
    [theme, mode, onModeChange]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
