import { useState, useCallback } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import TimelineClip from './TimelineClip.jsx';

const TRACK_BG = {
  video: 'bg-blue-950/20 dark:bg-blue-950/30',
  audio: 'bg-green-950/20 dark:bg-green-950/30',
  text: 'bg-purple-950/20 dark:bg-purple-950/30',
  image: 'bg-orange-950/20 dark:bg-orange-950/30',
};

export default function TimelineTrack({ track, height, pixelsPerSecond, totalWidth }) {
  const addClip = useVideoEditorStore((s) => s.addClip);
  const clearSelection = useVideoEditorStore((s) => s.clearSelection);
  const [dragOver, setDragOver] = useState(false);

  const bg = TRACK_BG[track.type] || TRACK_BG.video;

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (track.locked) return;

      const raw = e.dataTransfer.getData('application/x-media-item');
      if (!raw) return;

      try {
        const item = JSON.parse(raw);
        // Calculate drop time from x position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const startTime = Math.max(0, x / pixelsPerSecond);

        addClip(track.id, {
          type: item.type,
          name: item.name,
          startTime,
          duration: item.duration || 5,
          sourceDuration: item.duration || 5,
          sourcePath: item.url,
        });
      } catch {
        // ignore invalid data
      }
    },
    [track.id, track.locked, pixelsPerSecond, addClip]
  );

  const handleDragOver = useCallback(
    (e) => {
      if (track.locked) return;
      const raw = e.dataTransfer.types.includes('application/x-media-item');
      if (raw) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }
    },
    [track.locked]
  );

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) clearSelection();
    },
    [clearSelection]
  );

  return (
    <div
      className={`relative border-b border-gray-200 dark:border-gray-700 ${bg} ${
        track.locked ? 'opacity-50' : ''
      } ${track.muted ? 'opacity-40' : ''
      } ${dragOver ? 'ring-2 ring-inset ring-violet-400' : ''}`}
      style={{ height, width: totalWidth }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      {track.clips.map((clip) => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          trackId={track.id}
          pixelsPerSecond={pixelsPerSecond}
          trackHeight={height}
        />
      ))}
    </div>
  );
}
