import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'studioflow_theme';

const darkColors = {
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceElevated: '#252540',
  text: '#f0f0f0',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',
  border: '#2a2a40',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
};

const lightColors = {
  primary: '#7c3aed',
  primaryLight: '#8b5cf6',
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceElevated: '#f0f0f5',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0891b2',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const value = useMemo(() => ({
    isDark,
    toggleTheme,
    colors: isDark ? darkColors : lightColors,
  }), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
