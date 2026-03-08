import { createContext, useContext, useEffect, useMemo } from 'react';
import { darkTheme } from './dark';
import { lightTheme } from './light';

const ThemeContext = createContext(null);

function applyDarkClass(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function ThemeProvider({ children, mode, onModeChange }) {
  const isDark = mode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  // Apply dark class synchronously on every render to prevent flash
  applyDarkClass(isDark);

  useEffect(() => {
    applyDarkClass(isDark);
  }, [isDark]);

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
