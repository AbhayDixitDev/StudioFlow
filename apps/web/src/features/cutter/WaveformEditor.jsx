import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';

export default function WaveformEditor({
  audioUrl,
  onRegionChange,
  onReady,
  onTimeUpdate,
}) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const regions = RegionsPlugin.create();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(139, 92, 246, 0.4)',
      progressColor: 'rgba(139, 92, 246, 0.8)',
      cursorColor: '#8b5cf6',
      cursorWidth: 2,
      height: 128,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      plugins: [regions],
    });

    ws.load(audioUrl);

    ws.on('ready', () => {
      const dur = ws.getDuration();
      setDuration(dur);
      setIsReady(true);

      // Create default region (full track)
      const region = regions.addRegion({
        start: 0,
        end: dur,
        color: 'rgba(139, 92, 246, 0.15)',
        drag: true,
        resize: true,
      });
      regionRef.current = region;

      region.on('update-end', () => {
        onRegionChange?.({
          start: region.start,
          end: region.end,
        });
      });

      onReady?.({ duration: dur });
    });

    ws.on('audioprocess', () => {
      onTimeUpdate?.(ws.getCurrentTime());
    });

    ws.on('seeking', () => {
      onTimeUpdate?.(ws.getCurrentTime());
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      regionRef.current = null;
    };
  }, [audioUrl]);

  const play = useCallback(() => wavesurferRef.current?.play(), []);
  const pause = useCallback(() => wavesurferRef.current?.pause(), []);
  const playPause = useCallback(() => wavesurferRef.current?.playPause(), []);

  const playRegion = useCallback(() => {
    if (regionRef.current) {
      regionRef.current.play();
    }
  }, []);

  const setRegion = useCallback((start, end) => {
    if (regionRef.current) {
      regionRef.current.setOptions({ start, end });
      onRegionChange?.({ start, end });
    }
  }, [onRegionChange]);

  const handleZoom = useCallback((value) => {
    setZoom(value);
    wavesurferRef.current?.zoom(value * 50);
  }, []);

  return (
    <div className="space-y-3">
      {/* Waveform */}
      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden bg-white/5 border border-white/10"
      />

      {/* Zoom control */}
      {isReady && (
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-50">Zoom</span>
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={zoom}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-violet-500"
          />
        </div>
      )}

      {/* Expose methods via ref-like pattern */}
      <WaveformControls
        play={play}
        pause={pause}
        playPause={playPause}
        playRegion={playRegion}
        setRegion={setRegion}
        ref={wavesurferRef}
      />
    </div>
  );
}

// Hidden component to expose controls
function WaveformControls() {
  return null;
}

// Export a hook-style API
export function useWaveformEditor() {
  const controlsRef = useRef({
    play: () => {},
    pause: () => {},
    playPause: () => {},
    playRegion: () => {},
    setRegion: () => {},
  });

  return controlsRef;
}
