import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api.js';

const STEM_COLORS = {
  vocals: '#a855f7',
  drums: '#f97316',
  bass: '#3b82f6',
  guitar: '#22c55e',
  piano: '#ec4899',
  other: '#6b7280',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StemPlayer({ stems = [], baseUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1);
  const [stemStates, setStemStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState({});

  const audioRefs = useRef({});
  const blobUrls = useRef({});
  const animFrameRef = useRef(null);
  const loadedKey = useRef(''); // track what stems are currently loaded

  // Stable stem key to avoid re-fetching when same stems arrive with new array reference
  const stemKey = useMemo(
    () => stems.map((s) => s.name).sort().join(','),
    [stems]
  );

  // Initialize stem states ONLY when stem names actually change
  useEffect(() => {
    if (!stemKey) return;
    setStemStates((prev) => {
      const names = stemKey.split(',');
      // If all names already exist in prev, keep existing settings
      const allExist = names.every((n) => n in prev);
      if (allExist) return prev;
      // New stems: initialize fresh
      const initial = {};
      names.forEach((name) => {
        initial[name] = prev[name] || { volume: 1, muted: false, solo: false };
      });
      return initial;
    });
  }, [stemKey]);

  // Fetch stems as blobs in parallel
  useEffect(() => {
    // Skip if already loaded these exact stems
    if (loadedKey.current === `${stemKey}|${baseUrl}`) {
      setLoading(false);
      return;
    }
    if (!stemKey || !baseUrl) return;

    let cancelled = false;
    setLoading(true);
    setLoadErrors({});

    async function fetchAllStems() {
      const results = await Promise.allSettled(
        stems.map(async (stem) => {
          const response = await api.get(`${baseUrl}/${stem.name}`, {
            responseType: 'blob',
          });
          return { name: stem.name, blob: response.data };
        })
      );

      if (cancelled) return;

      // Revoke old blob URLs
      Object.values(blobUrls.current).forEach((url) => URL.revokeObjectURL(url));
      blobUrls.current = {};

      // Stop and remove old audio elements
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};

      const errors = {};

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { name, blob } = result.value;
          const blobUrl = URL.createObjectURL(blob);
          blobUrls.current[name] = blobUrl;
          const audio = new Audio(blobUrl);
          audio.preload = 'auto';
          audioRefs.current[name] = audio;
        } else {
          // Find the stem name from the error
          const stemIndex = results.indexOf(result);
          const stemName = stems[stemIndex]?.name || 'unknown';
          errors[stemName] = true;
          console.error(`Failed to load stem ${stemName}:`, result.reason);
        }
      }

      if (cancelled) return;

      setLoadErrors(errors);
      loadedKey.current = `${stemKey}|${baseUrl}`;

      // Get duration from first successfully loaded stem
      const firstAudio = Object.values(audioRefs.current)[0];
      if (firstAudio) {
        const setDur = () => {
          if (!cancelled && firstAudio.duration && isFinite(firstAudio.duration)) {
            setDuration(firstAudio.duration);
          }
        };
        firstAudio.addEventListener('loadedmetadata', setDur);
        if (firstAudio.duration && isFinite(firstAudio.duration)) {
          setDuration(firstAudio.duration);
        }
      }
      setLoading(false);
    }

    fetchAllStems();

    return () => {
      cancelled = true;
    };
  }, [stemKey, baseUrl, stems]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      Object.values(blobUrls.current).forEach((url) => URL.revokeObjectURL(url));
      blobUrls.current = {};
      loadedKey.current = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update volumes when stem states or master volume change
  useEffect(() => {
    const hasSolo = Object.values(stemStates).some((s) => s.solo);

    Object.entries(stemStates).forEach(([name, state]) => {
      const audio = audioRefs.current[name];
      if (!audio) return;

      if (hasSolo) {
        audio.volume = state.solo ? state.volume * masterVolume : 0;
      } else {
        audio.volume = state.muted ? 0 : state.volume * masterVolume;
      }
    });
  }, [stemStates, masterVolume]);

  // Animation frame for time tracking
  const updateTime = useCallback(() => {
    const firstAudio = Object.values(audioRefs.current)[0];
    if (firstAudio) {
      setCurrentTime(firstAudio.currentTime);
      if (firstAudio.ended) {
        setIsPlaying(false);
        return;
      }
    }
    animFrameRef.current = requestAnimationFrame(updateTime);
  }, []);

  function playAll() {
    const audios = Object.values(audioRefs.current);
    if (audios.length === 0) return;

    const time = audios[0].currentTime;
    audios.forEach((a) => {
      a.currentTime = time;
      a.play().catch(() => {});
    });

    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(updateTime);
  }

  function pauseAll() {
    Object.values(audioRefs.current).forEach((a) => a.pause());
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }

  function togglePlayPause() {
    if (isPlaying) pauseAll();
    else playAll();
  }

  function seekTo(time) {
    Object.values(audioRefs.current).forEach((a) => {
      a.currentTime = time;
    });
    setCurrentTime(time);
  }

  function toggleMute(name) {
    setStemStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], muted: !prev[name].muted, solo: false },
    }));
  }

  function toggleSolo(name) {
    setStemStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], solo: !prev[name].solo, muted: false },
    }));
  }

  function setStemVolume(name, vol) {
    setStemStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], volume: vol },
    }));
  }

  if (stems.length === 0) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading stems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Master controls */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={togglePlayPause}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Seek bar */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Time display */}
        <span className="min-w-[80px] text-center text-xs text-gray-500 dark:text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Master volume */}
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-20 accent-violet-500"
          />
        </div>
      </div>

      {/* Individual stem tracks */}
      <div className="space-y-2">
        {stems.map((stem) => {
          const state = stemStates[stem.name] || { volume: 1, muted: false, solo: false };
          const color = STEM_COLORS[stem.name] || STEM_COLORS.other;
          const hasSolo = Object.values(stemStates).some((s) => s.solo);
          const isActive = hasSolo ? state.solo : !state.muted;
          const hasError = loadErrors[stem.name];

          return (
            <div
              key={stem.name}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-40'
              } bg-gray-50 dark:bg-gray-700/50`}
            >
              <div
                className="h-8 w-1 rounded-full"
                style={{ backgroundColor: hasError ? '#ef4444' : color }}
              />

              <span className="w-16 text-sm font-medium capitalize text-gray-900 dark:text-white">
                {stem.name}
              </span>

              {hasError ? (
                <span className="flex-1 text-xs text-red-500">Failed to load</span>
              ) : (
                <>
                  <button
                    onClick={() => toggleSolo(stem.name)}
                    className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition-colors ${
                      state.solo
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    S
                  </button>

                  <button
                    onClick={() => toggleMute(stem.name)}
                    className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition-colors ${
                      state.muted
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    M
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={state.volume}
                    onChange={(e) => setStemVolume(stem.name, Number(e.target.value))}
                    className="flex-1 accent-current"
                    style={{ color }}
                  />
                </>
              )}

              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {stem.fileSize ? `${(stem.fileSize / 1024 / 1024).toFixed(1)}MB` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
