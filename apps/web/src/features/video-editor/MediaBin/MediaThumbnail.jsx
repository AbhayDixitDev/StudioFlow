import { useEffect, useRef, useState } from 'react';

const TYPE_ICONS = {
  video: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  ),
  audio: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
    </svg>
  ),
  image: (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
    </svg>
  ),
};

const TYPE_COLORS = {
  video: 'bg-blue-500',
  audio: 'bg-green-500',
  image: 'bg-orange-500',
};

function formatDuration(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MediaThumbnail({ item, onRemove }) {
  const [duration, setDuration] = useState(item.duration || 0);
  const [thumbUrl, setThumbUrl] = useState(null);
  const canvasRef = useRef(null);

  // Extract thumbnail / duration on mount
  useEffect(() => {
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = item.url;

      video.onloadedmetadata = () => {
        setDuration(video.duration);
        // Seek to 1s for thumbnail
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 160, 90);
        setThumbUrl(canvas.toDataURL());
        video.src = ''; // release
      };
    } else if (item.type === 'audio') {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.src = item.url;
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
    } else if (item.type === 'image') {
      setThumbUrl(item.url);
    }
  }, [item.url, item.type]);

  function handleDragStart(e) {
    e.dataTransfer.setData('application/x-media-item', JSON.stringify({
      id: item.id,
      name: item.name,
      type: item.type,
      url: item.url,
      duration: duration || 5,
      persistKey: item.persistKey || null,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative rounded overflow-hidden border border-gray-200 dark:border-gray-700 cursor-grab hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
      title={item.name}
    >
      {/* Thumbnail area */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        {thumbUrl ? (
          <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 dark:text-gray-600">
            {TYPE_ICONS[item.type]}
          </span>
        )}
      </div>

      {/* Type badge */}
      <div className={`absolute top-1 left-1 ${TYPE_COLORS[item.type]} text-white rounded px-1 py-0.5`}>
        {TYPE_ICONS[item.type]}
      </div>

      {/* Duration badge */}
      {duration > 0 && (
        <div className="absolute bottom-6 right-1 bg-black/70 text-white text-[8px] font-mono rounded px-1 py-0.5">
          {formatDuration(duration)}
        </div>
      )}

      {/* Name */}
      <div className="px-1.5 py-1 bg-white dark:bg-gray-800">
        <span className="text-[9px] text-gray-700 dark:text-gray-300 truncate block">
          {item.name}
        </span>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[8px] hover:bg-red-600"
        title="Remove from project"
      >
        X
      </button>
    </div>
  );
}
