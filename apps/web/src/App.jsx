import { useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@studioflow/ui';
import { AppShell } from '@studioflow/ui';
import { useThemeStore } from './stores/themeStore.js';
import { useAuthStore } from './stores/authStore.js';
import AppRouter from './router.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ToastContainer from './components/Toast.jsx';
import OnboardingBanner from './components/OnboardingBanner.jsx';
import {
  Scissors,
  FileVideo,
  ScissorsLineDashed,
  RefreshCw,
  Film,
  Home,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Audio Separator', path: '/separator', icon: Scissors },
  { label: 'Video to Audio', path: '/video-to-audio', icon: FileVideo },
  { label: 'Audio Cutter', path: '/cutter', icon: ScissorsLineDashed },
  { label: 'Format Changer', path: '/converter', icon: RefreshCw },
  { label: 'Video Editor', path: '/editor', icon: Film },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function App() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
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
      <ThemeProvider mode={theme} onModeChange={setTheme}>
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
    <ThemeProvider mode={theme} onModeChange={setTheme}>
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
        <OnboardingBanner />
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
        <ToastContainer />
      </AppShell>
    </ThemeProvider>
  );
}
