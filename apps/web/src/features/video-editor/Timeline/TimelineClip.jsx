import { useCallback, useEffect, useRef, useState } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import { getOrGeneratePeaks } from '../engine/AudioEngine.js';

const TYPE_COLORS = {
  video: 'bg-blue-500/80 border-blue-400',
  audio: 'bg-green-500/80 border-green-400',
  text: 'bg-purple-500/80 border-purple-400',
  image: 'bg-orange-500/80 border-orange-400',
};

export default function TimelineClip({ clip, trackId, pixelsPerSecond, trackHeight }) {
  const selectClip = useVideoEditorStore((s) => s.selectClip);
  const moveClip = useVideoEditorStore((s) => s.moveClip);
  const trimClip = useVideoEditorStore((s) => s.trimClip);
  const isSelected = useVideoEditorStore((s) => s.selectedClipIds.includes(clip.id));

  const dragRef = useRef(null);

  const left = clip.startTime * pixelsPerSecond;
  const width = clip.duration * pixelsPerSecond;
  const colors = TYPE_COLORS[clip.type] || TYPE_COLORS.video;

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      selectClip(clip.id, e.shiftKey);
    },
    [clip.id, selectClip]
  );

  // Drag to move
  const handleDragStart = useCallback(
    (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startTime = clip.startTime;

      const onMouseMove = (ev) => {
        const deltaX = ev.clientX - startX;
        const deltaTime = deltaX / pixelsPerSecond;
        const newStart = Math.max(0, startTime + deltaTime);
        moveClip(clip.id, trackId, newStart);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [clip.id, clip.startTime, trackId, pixelsPerSecond, moveClip]
  );

  // Trim handle
  const handleTrim = useCallback(
    (side, e) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;

      const onMouseMove = (ev) => {
        const deltaX = ev.clientX - startX;
        const deltaTime = deltaX / pixelsPerSecond;

        if (side === 'start') {
          trimClip(clip.id, 'start', clip.startTime + deltaTime);
        } else {
          trimClip(clip.id, 'end', clip.startTime + clip.duration + deltaTime);
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [clip.id, clip.startTime, clip.duration, pixelsPerSecond, trimClip]
  );

  return (
    <div
      ref={dragRef}
      className={`absolute top-1 rounded cursor-grab select-none border ${colors} ${
        isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-900' : ''
      }`}
      style={{
        left,
        width: Math.max(width, 4),
        height: trackHeight - 8,
      }}
      onClick={handleClick}
      onMouseDown={handleDragStart}
    >
      {/* Transition indicator */}
      {clip.transition && (
        <div
          className="absolute top-0 left-0 bottom-0 bg-amber-400/30 border-r border-amber-400/60 flex items-center justify-center"
          style={{ width: Math.max(clip.transition.duration * pixelsPerSecond, 8) }}
          title={`Transition: ${clip.transition.type} (${clip.transition.duration}s)`}
        >
          <span className="text-[7px] text-amber-200 font-bold rotate-90 whitespace-nowrap">FX</span>
        </div>
      )}

      {/* Left trim handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-l"
        onMouseDown={(e) => handleTrim('start', e)}
      />

      {/* Audio waveform */}
      {(clip.type === 'audio' || clip.type === 'video') && clip.sourcePath && (
        <WaveformCanvas
          sourcePath={clip.sourcePath}
          width={Math.max(width, 4)}
          height={trackHeight - 8}
          color={clip.type === 'audio' ? '#86efac' : '#93c5fd'}
        />
      )}

      {/* Clip content */}
      <div className="flex items-center h-full px-2 overflow-hidden relative z-10">
        {clip.type === 'text' && clip.text ? (
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] font-medium text-white truncate drop-shadow-sm">
              {clip.text.content || 'Text'}
            </span>
            <span className="text-[7px] text-white/50 truncate">
              {clip.text.fontFamily || 'Arial'} {clip.text.fontSize || 48}px
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-medium text-white truncate drop-shadow-sm">
            {clip.name}
          </span>
        )}
      </div>

      {/* Right trim handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/30 rounded-r"
        onMouseDown={(e) => handleTrim('end', e)}
      />
    </div>
  );
}

function WaveformCanvas({ sourcePath, width, height, color }) {
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const numPeaks = Math.max(Math.floor(width / 2), 20);
    getOrGeneratePeaks(sourcePath, numPeaks)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sourcePath, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / peaks.length;
    const mid = height / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;

    for (let i = 0; i < peaks.length; i++) {
      const barH = peaks[i] * mid * 0.9;
      const x = i * barWidth;
      ctx.fillRect(x, mid - barH, Math.max(barWidth - 0.5, 0.5), barH * 2);
    }
  }, [peaks, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  );
}
