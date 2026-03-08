/**
 * Phase 218: User settings/preferences page.
 */
import { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore.js';

export default function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [defaultFormat, setDefaultFormat] = useState(
    () => localStorage.getItem('studioflow_default_format') || 'mp3'
  );
  const [defaultModel, setDefaultModel] = useState(
    () => localStorage.getItem('studioflow_default_model') || 'htdemucs'
  );

  useEffect(() => {
    localStorage.setItem('studioflow_default_format', defaultFormat);
  }, [defaultFormat]);

  useEffect(() => {
    localStorage.setItem('studioflow_default_model', defaultModel);
  }, [defaultModel]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100">Settings</h1>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Choose dark or light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </Section>

      {/* Defaults */}
      <Section title="Defaults">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Audio Format
            </label>
            <select
              value={defaultFormat}
              onChange={(e) => setDefaultFormat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
            >
              {['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Separation Model
            </label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
            >
              <option value="htdemucs">4-Stem (htdemucs)</option>
              <option value="htdemucs_6s">6-Stem (htdemucs_6s)</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Storage */}
      <Section title="Storage">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Clear Local Cache</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Remove cached waveforms and temporary data from browser
            </p>
          </div>
          <button
            onClick={() => {
              caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
              localStorage.removeItem('studioflow_onboarding_seen');
              alert('Cache cleared');
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>StudioFlow</strong> v0.1.0</p>
          <p>Audio & video tools, all in one place.</p>
          <p>
            <a
              href="https://github.com/AbhayDixitDev/StudioFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-500 hover:text-violet-400"
            >
              GitHub Repository
            </a>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            MIT License - Copyright (c) 2026 Abhay Dixit
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        {title}
      </h2>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        {children}
      </div>
    </div>
  );
}
