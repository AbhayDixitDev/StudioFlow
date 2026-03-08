import { useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@audio-sep/ui';
import { AppShell } from '@audio-sep/ui';
import { useThemeStore } from './stores/themeStore.js';
import { useAuthStore } from './stores/authStore.js';
import AppRouter from './router.jsx';
import {
  Scissors,
  FileVideo,
  ScissorsLineDashed,
  RefreshCw,
  Film,
  Home,
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Audio Separator', path: '/separator', icon: Scissors },
  { label: 'Video to Audio', path: '/video-to-audio', icon: FileVideo },
  { label: 'Audio Cutter', path: '/cutter', icon: ScissorsLineDashed },
  { label: 'Format Changer', path: '/converter', icon: RefreshCw },
  { label: 'Video Editor', path: '/editor', icon: Film },
];

export default function App() {
  const { theme, toggleTheme } = useThemeStore();
  const { token, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) fetchUser();
  }, []);

  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(location.pathname);

  // Auth pages — show without shell, redirect to home if already logged in
  if (isAuthPage) {
    if (token) {
      const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
      return <Navigate to={redirectTo} replace />;
    }
    return (
      <ThemeProvider initialTheme={theme}>
        <AppRouter />
      </ThemeProvider>
    );
  }

  // Not logged in — redirect to login, preserving intended destination
  if (!token) {
    const redirectParam = location.pathname !== '/' ? `?redirect=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectParam}`} replace />;
  }

  return (
    <ThemeProvider initialTheme={theme}>
      <AppShell
        navItems={navItems.map((item) => ({
          ...item,
          icon: <item.icon size={20} />,
          active: location.pathname === item.path,
          onClick: () => navigate(item.path),
        }))}
        onThemeToggle={toggleTheme}
        theme={theme}
      >
        <AppRouter />
      </AppShell>
    </ThemeProvider>
  );
}
