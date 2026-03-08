import { useRef, useEffect, useCallback } from 'react';
import { cn } from '../lib/cn';

export function WaveformDisplay({
  peaks,
  duration,
  currentTime = 0,
  height = 80,
  color = 'var(--text-muted)',
  progressColor = 'var(--accent-primary)',
  onSeek,
  className,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || peaks.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const barWidth = Math.max(1, width / peaks.length);
    const halfHeight = height / 2;
    const progressX = duration > 0 ? (currentTime / duration) * width : 0;

    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const amplitude = Math.abs(peaks[i] ?? 0);
      const barHeight = amplitude * halfHeight * 0.9;

      ctx.fillStyle = x < progressX ? progressColor : color;
      ctx.fillRect(x, halfHeight - barHeight, Math.max(1, barWidth - 0.5), barHeight * 2);
    }
  }, [peaks, duration, currentTime, height, color, progressColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const handleClick = (e) => {
    if (!onSeek || !containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full', onSeek && 'cursor-pointer', className)}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}
