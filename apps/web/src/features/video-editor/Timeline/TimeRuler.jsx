import { useCallback } from 'react';

function formatRulerTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimeRuler({ duration, pixelsPerSecond, onSeek }) {
  // Determine interval based on zoom level
  let majorInterval = 1;
  if (pixelsPerSecond < 20) majorInterval = 10;
  else if (pixelsPerSecond < 40) majorInterval = 5;
  else if (pixelsPerSecond < 80) majorInterval = 2;

  const totalWidth = Math.max((duration + 5) * pixelsPerSecond, 800);
  const markers = [];
  const minorCount = 4;

  for (let t = 0; t <= duration + 5; t += majorInterval) {
    markers.push({ time: t, major: true });
    for (let m = 1; m < minorCount; m++) {
      const minorTime = t + (majorInterval / minorCount) * m;
      if (minorTime <= duration + 5) {
        markers.push({ time: minorTime, major: false });
      }
    }
  }

  const handleClick = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onSeek?.(Math.max(0, time));
    },
    [pixelsPerSecond, onSeek]
  );

  return (
    <div
      className="relative h-6 cursor-pointer select-none border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
      style={{ width: totalWidth }}
      onClick={handleClick}
    >
      {markers.map((marker, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{ left: marker.time * pixelsPerSecond }}
        >
          <div
            className={`${
              marker.major
                ? 'h-4 w-px bg-gray-400 dark:bg-gray-500'
                : 'h-2 w-px bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ marginTop: marker.major ? 0 : 16 }}
          />
          {marker.major && (
            <span className="absolute top-0.5 left-1 text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatRulerTime(marker.time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
