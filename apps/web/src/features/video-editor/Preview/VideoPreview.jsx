import { useRef, useEffect, useCallback } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import effectRegistry from '../engine/effects/EffectRegistry.js';
import { interpolateKeyframes } from '../engine/effects/interpolate.js';
import { getTextAnimationState } from '../engine/textAnimations.js';
import { getTransition } from '../engine/transitions.js';

// ─── Persistent caches ───
const imageCache = new Map();
const videoCache = new Map();
const activeVideos = new Set(); // currently-playing video source URLs

function getOrCreateImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

// Module-level callback for video ready events to trigger re-render
let _onVideoReady = null;

function getOrCreateVideo(src) {
  if (videoCache.has(src)) return videoCache.get(src);
  const video = document.createElement('video');
  video.src = src;
  video.preload = 'auto';
  video.playsInline = true;

  // Re-render preview when video data loads or seek completes (for paused state)
  const notify = () => {
    if (_onVideoReady) _onVideoReady();
  };
  video.addEventListener('loadeddata', notify);
  video.addEventListener('seeked', notify);

  video.load();
  videoCache.set(src, video);
  return video;
}

// Draw source onto canvas maintaining aspect ratio (contain/letterbox)
// bgFill: 'black' (default), 'blur', 'color', 'stretch'
function drawContain(ctx, source, sx, sy, sw, sh, canvasW, canvasH, bgFill, bgColor) {
  if (bgFill === 'stretch') {
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
    return;
  }

  const srcAspect = sw / sh;
  const dstAspect = canvasW / canvasH;
  let dw, dh, dx, dy;
  if (srcAspect > dstAspect) {
    dw = canvasW;
    dh = canvasW / srcAspect;
    dx = 0;
    dy = (canvasH - dh) / 2;
  } else {
    dh = canvasH;
    dw = canvasH * srcAspect;
    dx = (canvasW - dw) / 2;
    dy = 0;
  }

  // Background fill for letterbox/pillarbox areas
  if (bgFill === 'blur' && (dx > 0 || dy > 0)) {
    ctx.save();
    ctx.filter = 'blur(20px) brightness(0.5)';
    ctx.drawImage(source, sx, sy, sw, sh, -20, -20, canvasW + 40, canvasH + 40);
    ctx.filter = 'none';
    ctx.restore();
  } else if (bgFill === 'color' && bgColor && (dx > 0 || dy > 0)) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Pause all active videos
function pauseAllVideos() {
  for (const src of activeVideos) {
    const video = videoCache.get(src);
    if (video && !video.paused) video.pause();
  }
  activeVideos.clear();
}

// ─── Component ───

export default function VideoPreview() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const currentTime = useVideoEditorStore((s) => s.currentTime);
  const projectSettings = useVideoEditorStore((s) => s.projectSettings);
  const tracks = useVideoEditorStore((s) => s.tracks);
  const playing = useVideoEditorStore((s) => s.playing);

  // Core render function - reads state directly from store for freshness
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const settings = useVideoEditorStore.getState().projectSettings;
    const { width, height } = settings;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const time = useVideoEditorStore.getState().currentTime;
    const isPlaying = useVideoEditorStore.getState().playing;
    const allTracks = useVideoEditorStore.getState().tracks;
    const getClips = useVideoEditorStore.getState().getVisibleClipsAtTime;
    const clips = getClips(time);

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Track which video sources are visible this frame
    const visibleSrcs = new Set();

    // Render each clip layer (bottom to top = track order)
    for (const clip of clips) {
      // Skip audio-only clips
      if (clip.trackType === 'audio') continue;

      ctx.save();

      // Blend mode
      if (clip.blendMode && clip.blendMode !== 'source-over') {
        ctx.globalCompositeOperation = clip.blendMode;
      }

      // Transform
      const tx = clip.transform?.x || 0;
      const ty = clip.transform?.y || 0;
      const scale = clip.transform?.scale || 1;
      const rotation = clip.transform?.rotation || 0;
      const flipH = clip.transform?.flipH ? -1 : 1;
      const flipV = clip.transform?.flipV ? -1 : 1;
      ctx.globalAlpha = clip.opacity != null ? clip.opacity : 1;

      // Effects (CSS-filter based)
      const pixelEffects = [];
      if (clip.effects && clip.effects.length > 0) {
        const clipLocalTime = time - clip.startTime;
        for (const fx of clip.effects) {
          if (!fx.enabled) continue;
          const def = effectRegistry.get(fx.id);
          if (!def) continue;
          let values = fx.values;
          if (fx.keyframes && fx.keyframes.length > 0) {
            const norm = clip.duration > 0 ? Math.min(clipLocalTime / clip.duration, 1) : 0;
            values = interpolateKeyframes(fx.keyframes, norm, def.getDefaults());
          }
          if (def.usesPixelManipulation) {
            pixelEffects.push({ def, values });
          } else {
            def.applyToCanvas(ctx, values, { x: 0, y: 0, width, height });
          }
        }
      }

      ctx.translate(width / 2 + tx, height / 2 + ty);
      if (rotation) ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * flipH, scale * flipV);
      ctx.translate(-width / 2, -height / 2);

      // Render by type
      if (clip.trackType === 'text' && clip.text) {
        renderTextClip(ctx, clip, time, width, height);
      } else if (clip.trackType === 'video' && clip.sourcePath) {
        visibleSrcs.add(clip.sourcePath);
        renderVideoFrame(ctx, clip, time, isPlaying, width, height);
      } else if (clip.trackType === 'image' && (clip.imageSrc || clip.sourcePath)) {
        renderImageClip(ctx, clip, time, width, height);
      } else if (clip.trackType === 'video' || clip.trackType === 'image') {
        renderPlaceholder(ctx, clip, width, height);
      }

      // Pixel-manipulation effects
      for (const { def, values } of pixelEffects) {
        def.applyToCanvas(ctx, values, { x: 0, y: 0, width, height });
      }

      ctx.restore();
    }

    // Pause videos that are no longer visible
    for (const src of activeVideos) {
      if (!visibleSrcs.has(src)) {
        const video = videoCache.get(src);
        if (video && !video.paused) video.pause();
        activeVideos.delete(src);
      }
    }

    // Transitions
    renderTransitions(ctx, allTracks, time, width, height);

    // Empty state
    if (clips.length === 0) {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#555';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No content at current time', width / 2, height / 2);
    }
  }, []);

  // Register re-render callback for video load/seek events
  useEffect(() => {
    _onVideoReady = () => {
      if (!useVideoEditorStore.getState().playing) renderFrame();
    };
    return () => { _onVideoReady = null; };
  }, [renderFrame]);

  // rAF render loop during playback
  useEffect(() => {
    if (playing) {
      const loop = () => {
        renderFrame();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pauseAllVideos();
      };
    } else {
      // Paused: render once and pause all videos
      pauseAllVideos();
      renderFrame();
    }
  }, [playing, renderFrame]);

  // Re-render on scrub / track changes when paused
  useEffect(() => {
    if (!playing) renderFrame();
  }, [currentTime, tracks, projectSettings, playing, renderFrame]);

  const aspect = projectSettings.width / projectSettings.height;

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}

// ─── Video clip rendering (manages <video> element playback + audio) ───

function renderVideoFrame(ctx, clip, currentTime, isPlaying, width, height) {
  const video = getOrCreateVideo(clip.sourcePath);

  // Calculate target video time
  const clipLocalTime = currentTime - clip.startTime;
  const speed = clip.speed || 1;
  const reversed = clip.reverse || false;

  let targetTime = clipLocalTime * speed + (clip.sourceStart || 0);
  if (reversed && video.duration) {
    targetTime = video.duration - targetTime;
  }
  targetTime = Math.max(0, Math.min(targetTime, video.duration || 999));

  if (isPlaying) {
    // Set playback rate and volume
    if (video.playbackRate !== speed) video.playbackRate = speed;

    // Audio: unmute unless track is muted
    const vol = clip.trackMuted ? 0 : Math.min(1, Math.max(0, clip.volume != null ? clip.volume : 1));
    video.muted = vol === 0;
    video.volume = vol;

    // Start playing if paused
    if (video.paused && video.readyState >= 2) {
      video.currentTime = targetTime;
      video.play().catch(() => {});
      activeVideos.add(clip.sourcePath);
    } else if (video.readyState >= 1) {
      // Re-sync if drifted too far (> 300ms)
      if (Math.abs(video.currentTime - targetTime) > 0.3) {
        video.currentTime = targetTime;
      }
    }
  } else {
    // Paused: pause video and seek to exact frame
    if (!video.paused) video.pause();
    if (video.readyState >= 1 && Math.abs(video.currentTime - targetTime) > 0.04) {
      video.currentTime = targetTime;
    }
  }

  // Draw current frame to canvas
  if (video.readyState >= 2 && video.videoWidth > 0) {
    const cropL = (clip.crop?.left || 0) / 100;
    const cropT = (clip.crop?.top || 0) / 100;
    const cropR = (clip.crop?.right || 0) / 100;
    const cropB = (clip.crop?.bottom || 0) / 100;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const sx = vw * cropL;
    const sy = vh * cropT;
    const sw = vw * (1 - cropL - cropR) || 1;
    const sh = vh * (1 - cropT - cropB) || 1;

    drawContain(ctx, video, sx, sy, sw, sh, width, height, clip.bgFill, clip.bgColor);
  } else {
    // Not ready yet - show placeholder, will re-render when loadeddata/seeked fires
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Loading: ${clip.name || 'video'}...`, width / 2, height / 2);
  }
}

// ─── Image clip rendering ───

function renderImageClip(ctx, clip, currentTime, width, height) {
  const src = clip.imageSrc || clip.sourcePath;
  if (!src) {
    renderPlaceholder(ctx, clip, width, height);
    return;
  }

  const img = getOrCreateImage(src);

  if (img.complete && img.naturalWidth > 0) {
    ctx.save();

    const cropL = (clip.crop?.left || 0) / 100;
    const cropT = (clip.crop?.top || 0) / 100;
    const cropR = (clip.crop?.right || 0) / 100;
    const cropB = (clip.crop?.bottom || 0) / 100;
    const sx = img.naturalWidth * cropL;
    const sy = img.naturalHeight * cropT;
    const sw = img.naturalWidth * (1 - cropL - cropR);
    const sh = img.naturalHeight * (1 - cropT - cropB);

    // Ken Burns
    if (clip.kenBurns?.enabled) {
      const clipLocalTime = currentTime - clip.startTime;
      const progress = clip.duration > 0 ? Math.min(clipLocalTime / clip.duration, 1) : 0;
      const kbScale = (clip.kenBurns.startScale || 1) + ((clip.kenBurns.endScale || 1.2) - (clip.kenBurns.startScale || 1)) * progress;
      const kbX = (clip.kenBurns.startX || 0) + ((clip.kenBurns.endX || 0) - (clip.kenBurns.startX || 0)) * progress;
      const kbY = (clip.kenBurns.startY || 0) + ((clip.kenBurns.endY || 0) - (clip.kenBurns.startY || 0)) * progress;
      ctx.translate(width / 2 + kbX, height / 2 + kbY);
      ctx.scale(kbScale, kbScale);
      ctx.translate(-width / 2, -height / 2);
    }

    drawContain(ctx, img, sx, sy, sw || 1, sh || 1, width, height, clip.bgFill, clip.bgColor);
    ctx.restore();
  } else {
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading image...', width / 2, height / 2);

    // Re-render when loaded
    if (!img._loadCb) {
      img._loadCb = true;
      img.addEventListener('load', () => useVideoEditorStore.setState({}), { once: true });
    }
  }
}

// ─── Text clip rendering ───

function renderTextClip(ctx, clip, currentTime, width, height) {
  const tc = clip.text;
  const localTime = currentTime - clip.startTime;
  const anim = getTextAnimationState(tc, localTime, clip.duration);

  ctx.globalAlpha *= anim.opacity;
  if (anim.blur > 0) {
    ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}blur(${anim.blur}px)`;
  }
  if (anim.scale !== 1 || anim.rotation) {
    ctx.translate(width / 2, height / 2);
    if (anim.rotation) ctx.rotate((anim.rotation * Math.PI) / 180);
    if (anim.scale !== 1) ctx.scale(anim.scale, anim.scale);
    ctx.translate(-width / 2, -height / 2);
  }

  const fontSize = tc.fontSize || 48;
  const lineH = (tc.lineHeight || 1.4) * fontSize;
  ctx.font = `${tc.fontWeight || 'bold'} ${fontSize}px ${tc.fontFamily || 'Arial'}`;
  ctx.textAlign = tc.align || 'center';
  ctx.textBaseline = 'middle';

  let content = tc.content || '';
  if (anim.visibleChars != null) content = content.slice(0, anim.visibleChars);

  const lines = content.split('\n');
  const totalTextH = lines.length * lineH;
  const baseX = width / 2 + (anim.offsetX || 0);
  const baseY = height / 2 - totalTextH / 2 + lineH / 2;

  if (tc.shadow) {
    ctx.shadowColor = tc.shadowColor || '#000';
    ctx.shadowBlur = tc.shadowBlur || 4;
    ctx.shadowOffsetX = tc.shadowOffsetX || 2;
    ctx.shadowOffsetY = tc.shadowOffsetY || 2;
  }

  for (let i = 0; i < lines.length; i++) {
    const ly = baseY + i * lineH;

    if (tc.hasBg) {
      const metrics = ctx.measureText(lines[i]);
      const tw = metrics.width + 16;
      const th = lineH + 4;
      let bx = baseX - tw / 2;
      if (tc.align === 'left') bx = baseX - 8;
      else if (tc.align === 'right') bx = baseX - tw + 8;

      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = tc.bgOpacity != null ? tc.bgOpacity : 0.7;
      ctx.fillStyle = tc.bgColor || '#000';
      ctx.fillRect(bx, ly - th / 2, tw, th);
      ctx.restore();

      if (tc.shadow) {
        ctx.shadowColor = tc.shadowColor || '#000';
        ctx.shadowBlur = tc.shadowBlur || 4;
      }
    }

    if (tc.stroke) {
      ctx.strokeStyle = tc.strokeColor || '#000';
      ctx.lineWidth = tc.strokeWidth || 2;
      ctx.strokeText(lines[i], baseX, ly);
    }

    ctx.fillStyle = tc.color || '#fff';
    ctx.fillText(lines[i], baseX, ly);
  }

  ctx.shadowColor = 'transparent';
}

// ─── Placeholder ───

function renderPlaceholder(ctx, clip, width, height) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  if (clip.crop && (clip.crop.left || clip.crop.top || clip.crop.right || clip.crop.bottom)) {
    const cL = (clip.crop.left || 0) / 100 * width;
    const cT = (clip.crop.top || 0) / 100 * height;
    const cR = (clip.crop.right || 0) / 100 * width;
    const cB = (clip.crop.bottom || 0) / 100 * height;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cL, height);
    ctx.fillRect(width - cR, 0, cR, height);
    ctx.fillRect(cL, 0, width - cL - cR, cT);
    ctx.fillRect(cL, height - cB, width - cL - cR, cB);
  }

  ctx.fillStyle = '#555';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.name || 'Video', width / 2, height / 2);
}

// ─── Transitions ───

function renderTransitions(ctx, tracks, currentTime, width, height) {
  for (const track of tracks) {
    if (track.type !== 'video' && track.type !== 'image') continue;
    const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const tr = curr.transition;
      if (!tr) continue;

      const transitionDef = getTransition(tr.type);
      if (!transitionDef) continue;

      const dur = tr.duration || 1;
      const tStart = curr.startTime;
      const tEnd = tStart + dur;

      if (currentTime >= tStart && currentTime < tEnd) {
        const progress = (currentTime - tStart) / dur;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const outCtx = outCanvas.getContext('2d');
        renderClipToOffscreen(outCtx, prev, track.type, currentTime, width, height);

        const inCanvas = document.createElement('canvas');
        inCanvas.width = width;
        inCanvas.height = height;
        const inCtx = inCanvas.getContext('2d');
        renderClipToOffscreen(inCtx, curr, track.type, currentTime, width, height);

        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        transitionDef.render(ctx, outCanvas, inCanvas, progress, width, height);
        ctx.restore();
      }
    }
  }
}

function renderClipToOffscreen(ctx, clip, trackType, currentTime, width, height) {
  if (trackType === 'video' && clip.sourcePath) {
    const video = getOrCreateVideo(clip.sourcePath);
    if (video.readyState >= 2 && video.videoWidth > 0) {
      drawContain(ctx, video, 0, 0, video.videoWidth, video.videoHeight, width, height);
      return;
    }
  }
  // Fallback placeholder
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#555';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.name || 'Video', width / 2, height / 2);
}
