import { useRef, useCallback } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import TimeRuler from './TimeRuler.jsx';
import Playhead from './Playhead.jsx';
import TimelineTrack from './TimelineTrack.jsx';

const TRACK_HEIGHT = 60;
const HEADER_WIDTH = 140;

export default function Timeline() {
  const tracks = useVideoEditorStore((s) => s.tracks);
  const currentTime = useVideoEditorStore((s) => s.currentTime);
  const duration = useVideoEditorStore((s) => s.duration);
  const pixelsPerSecond = useVideoEditorStore((s) => s.pixelsPerSecond);
  const seek = useVideoEditorStore((s) => s.seek);
  const addTrack = useVideoEditorStore((s) => s.addTrack);
  const zoomIn = useVideoEditorStore((s) => s.zoomIn);
  const zoomOut = useVideoEditorStore((s) => s.zoomOut);
  const lockTrack = useVideoEditorStore((s) => s.lockTrack);
  const muteTrack = useVideoEditorStore((s) => s.muteTrack);
  const soloTrack = useVideoEditorStore((s) => s.soloTrack);
  const removeTrack = useVideoEditorStore((s) => s.removeTrack);
  const addBackgroundMusic = useVideoEditorStore((s) => s.addBackgroundMusic);

  const scrollRef = useRef(null);
  const bgMusicRef = useRef(null);

  const handleBgMusic = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const url = URL.createObjectURL(file);
    addBackgroundMusic({ name: file.name, url, file });
  }, [addBackgroundMusic]);
  const totalWidth = Math.max((duration + 10) * pixelsPerSecond, 800);
  const totalHeight = tracks.length * TRACK_HEIGHT + 40;

  return (
    <div className="flex flex-col border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => addTrack('video')}
          className="rounded px-2 py-1 text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
        >
          + Video
        </button>
        <button
          onClick={() => addTrack('audio')}
          className="rounded px-2 py-1 text-[10px] font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
        >
          + Audio
        </button>
        <button
          onClick={() => addTrack('text')}
          className="rounded px-2 py-1 text-[10px] font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
        >
          + Text
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => bgMusicRef.current?.click()}
          className="rounded px-2 py-1 text-[10px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
        >
          + BG Music
        </button>
        <input
          ref={bgMusicRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleBgMusic}
        />

        <div className="flex-1" />

        <button onClick={zoomOut} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          -
        </button>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
          {Math.round(pixelsPerSecond)}px/s
        </span>
        <button onClick={zoomIn} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
          +
        </button>
      </div>

      {/* Timeline body */}
      <div className="flex" style={{ height: Math.max(totalHeight, 120) }}>
        {/* Track headers */}
        <div className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700" style={{ width: HEADER_WIDTH }}>
          {/* Ruler spacer */}
          <div className="h-6 border-b border-gray-200 dark:border-gray-700" />

          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-1 px-2 border-b border-gray-200 dark:border-gray-700"
              style={{ height: TRACK_HEIGHT }}
            >
              <span className="flex-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">
                {track.name}
              </span>
              <button
                onClick={() => lockTrack(track.id, !track.locked)}
                className={`text-[9px] px-1 rounded ${track.locked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={track.locked ? 'Unlock' : 'Lock'}
              >
                {track.locked ? 'L' : 'U'}
              </button>
              <button
                onClick={() => muteTrack(track.id, !track.muted)}
                className={`text-[9px] px-1 rounded font-bold ${track.muted ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                M
              </button>
              <button
                onClick={() => soloTrack(track.id, !track.solo)}
                className={`text-[9px] px-1 rounded font-bold ${track.solo ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                title={track.solo ? 'Unsolo' : 'Solo'}
              >
                S
              </button>
              <button
                onClick={() => removeTrack(track.id)}
                className="text-[9px] px-1 rounded text-gray-400 hover:text-red-500"
                title="Delete track"
              >
                X
              </button>
            </div>
          ))}
        </div>

        {/* Scrollable timeline area */}
        <div ref={scrollRef} className="flex-1 overflow-auto relative">
          <div style={{ width: totalWidth, position: 'relative' }}>
            {/* Ruler */}
            <TimeRuler
              duration={duration}
              pixelsPerSecond={pixelsPerSecond}
              onSeek={seek}
            />

            {/* Tracks */}
            <div className="relative">
              {tracks.map((track) => (
                <TimelineTrack
                  key={track.id}
                  track={track}
                  height={TRACK_HEIGHT}
                  pixelsPerSecond={pixelsPerSecond}
                  totalWidth={totalWidth}
                />
              ))}

              {/* Playhead */}
              <Playhead
                currentTime={currentTime}
                pixelsPerSecond={pixelsPerSecond}
                height={tracks.length * TRACK_HEIGHT}
                onSeek={seek}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
