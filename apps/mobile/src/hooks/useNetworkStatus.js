import { useState, useEffect } from 'react';
import { getBaseURLSync } from '../services/api';

export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const url = getBaseURLSync().replace(/\/api$/, '') + '/api/health';
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
  }, []);

  return { isOnline, isServerReachable };
}
