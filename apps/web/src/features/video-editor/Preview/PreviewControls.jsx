import useVideoEditorStore from '../../../stores/videoEditorStore.js';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${m}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

export default function PreviewControls() {
  const playing = useVideoEditorStore((s) => s.playing);
  const currentTime = useVideoEditorStore((s) => s.currentTime);
  const duration = useVideoEditorStore((s) => s.duration);
  const speed = useVideoEditorStore((s) => s.speed);
  const canUndo = useVideoEditorStore((s) => s.canUndo);
  const canRedo = useVideoEditorStore((s) => s.canRedo);

  const togglePlayPause = useVideoEditorStore((s) => s.togglePlayPause);
  const skipToStart = useVideoEditorStore((s) => s.skipToStart);
  const skipToEnd = useVideoEditorStore((s) => s.skipToEnd);
  const stepFrame = useVideoEditorStore((s) => s.stepFrame);
  const setSpeed = useVideoEditorStore((s) => s.setSpeed);
  const undo = useVideoEditorStore((s) => s.undo);
  const redo = useVideoEditorStore((s) => s.redo);
  const seek = useVideoEditorStore((s) => s.seek);

  const btnClass =
    'flex items-center justify-center h-8 w-8 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors';
  const disabledBtn =
    'flex items-center justify-center h-8 w-8 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed';

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={canUndo ? btnClass : disabledBtn}
        title="Undo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={canRedo ? btnClass : disabledBtn}
        title="Redo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Transport controls */}
      <button onClick={skipToStart} className={btnClass} title="Skip to start">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
        </svg>
      </button>
      <button onClick={() => stepFrame(-1)} className={btnClass} title="Previous frame">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={togglePlayPause}
        className="flex items-center justify-center h-9 w-9 rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      <button onClick={() => stepFrame(1)} className={btnClass} title="Next frame">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 6h2v12h-2zm-6 6l8.5-6v12z" transform="scale(-1,1) translate(-24,0)" />
        </svg>
      </button>
      <button onClick={skipToEnd} className={btnClass} title="Skip to end">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 6h2v12h-2zm-6 6l-8.5 6V6l8.5 6z" transform="scale(-1,1) translate(-24,0)" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Time display */}
      <div className="flex items-center gap-1 min-w-[140px]">
        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-gray-400">/</span>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex-1" />

      {/* Save indicator */}
      <SaveIndicator />

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Speed selector */}
      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>
    </div>
  );
}

function SaveIndicator() {
  const saveStatus = useVideoEditorStore((s) => s.saveStatus);
  const projectId = useVideoEditorStore((s) => s.projectId);

  if (!projectId) return null;

  const labels = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
  };
  const colors = {
    idle: 'text-gray-400',
    saving: 'text-amber-500',
    saved: 'text-green-500',
    error: 'text-red-500',
  };

  if (saveStatus === 'idle') return null;

  return (
    <span className={`text-[9px] font-medium ${colors[saveStatus] || 'text-gray-400'}`}>
      {labels[saveStatus]}
    </span>
  );
}
