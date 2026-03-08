/**
 * Phase 203: Offline detection hook.
 * Uses NetInfo to track connectivity and shows an offline banner when disconnected.
 */
import { useState, useEffect } from 'react';

// Lightweight polling fallback (no native module required)
export default function useNetworkStatus(serverUrl) {
  const [isOnline, setIsOnline] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        // Simple health check against server
        const url = serverUrl
          ? serverUrl.replace(/\/api$/, '') + '/api/health'
          : 'http://10.0.2.2:5000/api/health';
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled) {
          setIsOnline(true);
          setIsServerReachable(res.ok);
        }
      } catch {
        if (!cancelled) {
          setIsOnline(false);
          setIsServerReachable(false);
        }
      }
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serverUrl]);

  return { isOnline, isServerReachable };
}
