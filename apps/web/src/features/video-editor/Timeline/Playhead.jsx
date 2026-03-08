import { useCallback, useRef } from 'react';

export default function Playhead({ currentTime, pixelsPerSecond, height, onSeek }) {
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const left = currentTime * pixelsPerSecond;

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;

    const onMouseMove = (ev) => {
      if (!dragging.current) return;
      const container = containerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left + container.scrollLeft;
      const time = Math.max(0, x / pixelsPerSecond);
      onSeek?.(time);
    };

    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [pixelsPerSecond, onSeek]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 z-30 pointer-events-none"
      style={{ left, height: '100%' }}
    >
      {/* Triangle handle */}
      <div
        className="pointer-events-auto cursor-col-resize"
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          left: -5,
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '8px solid #06b6d4',
        }}
      />
      {/* Vertical line */}
      <div
        className="w-px bg-cyan-500"
        style={{ height: height || '100%' }}
      />
    </div>
  );
}
