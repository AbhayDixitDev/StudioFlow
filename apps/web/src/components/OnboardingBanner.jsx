/**
 * Phase 210: First-time user onboarding banner.
 */
import { useState, useEffect } from 'react';

const SEEN_KEY = 'studioflow_onboarding_seen';

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(SEEN_KEY, 'true');
  }

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-6 py-4 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-sm">Welcome to StudioFlow!</h3>
        <p className="text-xs opacity-90 mt-1">
          Separate audio stems, convert formats, cut tracks, extract audio from videos, and edit videos - all in one place.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="ml-4 rounded px-3 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
      >
        Got it
      </button>
    </div>
  );
}
