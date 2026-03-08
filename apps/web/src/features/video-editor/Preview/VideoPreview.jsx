import { useRef, useEffect } from 'react';
import useVideoEditorStore from '../../../stores/videoEditorStore.js';
import effectRegistry from '../engine/effects/EffectRegistry.js';
import { interpolateKeyframes } from '../engine/effects/interpolate.js';
import { getTextAnimationState } from '../engine/textAnimations.js';
import { getTransition } from '../engine/transitions.js';

export default function VideoPreview() {
  const canvasRef = useRef(null);
  const currentTime = useVideoEditorStore((s) => s.currentTime);
  const projectSettings = useVideoEditorStore((s) => s.projectSettings);
  const getVisibleClipsAtTime = useVideoEditorStore((s) => s.getVisibleClipsAtTime);
  const tracks = useVideoEditorStore((s) => s.tracks);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = projectSettings;

    canvas.width = width;
    canvas.height = height;

    // Clear with black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Get visible clips at current time
    const clips = getVisibleClipsAtTime(currentTime);

    // Render each clip layer (bottom to top)
    for (const clip of clips) {
      ctx.save();

      // Apply transform
      const tx = clip.transform?.x || 0;
      const ty = clip.transform?.y || 0;
      const scale = clip.transform?.scale || 1;
      const rotation = clip.transform?.rotation || 0;

      ctx.globalAlpha = clip.opacity != null ? clip.opacity : 1;

      // Build CSS filter string from non-pixel-manipulation effects
      const filterParts = [];
      const pixelEffects = [];

      if (clip.effects && clip.effects.length > 0) {
        const clipLocalTime = currentTime - clip.startTime;

        for (const fx of clip.effects) {
          if (!fx.enabled) continue;
          const def = effectRegistry.get(fx.id);
          if (!def) continue;

          // Get interpolated values (handles keyframes)
          let values = fx.values;
          if (fx.keyframes && fx.keyframes.length > 0) {
            // Normalize time: 0 = clip start, 1 = clip end
            const normalizedTime = clip.duration > 0 ? clipLocalTime / clip.duration : 0;
            values = interpolateKeyframes(fx.keyframes, normalizedTime, def.getDefaults());
          }

          if (def.usesPixelManipulation) {
            pixelEffects.push({ def, values });
          } else {
            // Collect filter string parts
            def.applyToCanvas(ctx, values, { x: 0, y: 0, width, height });
          }
        }
      }

      ctx.translate(width / 2 + tx, height / 2 + ty);
      if (rotation) ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      if (clip.trackType === 'text' && clip.text) {
        const tc = clip.text;
        const localTime = currentTime - clip.startTime;
        const anim = getTextAnimationState(tc, localTime, clip.duration);

        // Apply animation transforms
        ctx.globalAlpha *= anim.opacity;
        if (anim.scale !== 1) {
          ctx.translate(width / 2, height / 2);
          ctx.scale(anim.scale, anim.scale);
          ctx.translate(-width / 2, -height / 2);
        }

        const fontSize = tc.fontSize || 48;
        const lineH = (tc.lineHeight || 1.4) * fontSize;
        ctx.font = `${tc.fontWeight || 'bold'} ${fontSize}px ${tc.fontFamily || 'Arial'}`;
        ctx.textAlign = tc.align || 'center';
        ctx.textBaseline = 'middle';

        // Get content (may be truncated for typewriter)
        let content = tc.content || '';
        if (anim.visibleChars != null) {
          content = content.slice(0, anim.visibleChars);
        }

        const lines = content.split('\n');
        const totalTextH = lines.length * lineH;
        const baseX = width / 2 + (anim.offsetX || 0);
        const baseY = height / 2 - totalTextH / 2 + lineH / 2;

        // Letter spacing
        if (tc.letterSpacing) ctx.letterSpacing = `${tc.letterSpacing}px`;

        // Shadow
        if (tc.shadow) {
          ctx.shadowColor = tc.shadowColor || '#000';
          ctx.shadowBlur = tc.shadowBlur || 4;
          ctx.shadowOffsetX = tc.shadowOffsetX || 2;
          ctx.shadowOffsetY = tc.shadowOffsetY || 2;
        }

        for (let i = 0; i < lines.length; i++) {
          const ly = baseY + i * lineH;

          // Background behind text
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
            // Re-apply shadow for text
            if (tc.shadow) {
              ctx.shadowColor = tc.shadowColor || '#000';
              ctx.shadowBlur = tc.shadowBlur || 4;
            }
          }

          // Stroke
          if (tc.stroke) {
            ctx.strokeStyle = tc.strokeColor || '#000';
            ctx.lineWidth = tc.strokeWidth || 2;
            ctx.strokeText(lines[i], baseX, ly);
          }

          // Fill
          ctx.fillStyle = tc.color || '#fff';
          ctx.fillText(lines[i], baseX, ly);
        }

        // Reset letter spacing
        ctx.letterSpacing = '0px';
        ctx.shadowColor = 'transparent';
      } else if (clip.trackType === 'video' || clip.trackType === 'image') {
        // Placeholder: colored rectangle with clip name
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#555';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(clip.name || 'Video', width / 2, height / 2);
      }

      // Apply pixel-manipulation effects after drawing
      for (const { def, values } of pixelEffects) {
        def.applyToCanvas(ctx, values, { x: 0, y: 0, width, height });
      }

      ctx.restore();
    }

    // Check for transitions between adjacent clips on the same track
    for (const track of tracks) {
      if (track.type !== 'video' && track.type !== 'image') continue;
      const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);

      for (let i = 1; i < sortedClips.length; i++) {
        const prevClip = sortedClips[i - 1];
        const currClip = sortedClips[i];
        const tr = currClip.transition;
        if (!tr) continue;

        const transitionDef = getTransition(tr.type);
        if (!transitionDef) continue;

        const trDuration = tr.duration || 1;
        const trStart = currClip.startTime;
        const trEnd = trStart + trDuration;

        if (currentTime >= trStart && currentTime < trEnd) {
          const progress = (currentTime - trStart) / trDuration;

          // Create offscreen canvases for both clips
          const outCanvas = document.createElement('canvas');
          outCanvas.width = width;
          outCanvas.height = height;
          const outCtx = outCanvas.getContext('2d');
          outCtx.fillStyle = '#1a1a2e';
          outCtx.fillRect(0, 0, width, height);
          outCtx.fillStyle = '#555';
          outCtx.font = 'bold 24px Arial';
          outCtx.textAlign = 'center';
          outCtx.textBaseline = 'middle';
          outCtx.fillText(prevClip.name || 'Video', width / 2, height / 2);

          const inCanvas = document.createElement('canvas');
          inCanvas.width = width;
          inCanvas.height = height;
          const inCtx = inCanvas.getContext('2d');
          inCtx.fillStyle = '#1a1a2e';
          inCtx.fillRect(0, 0, width, height);
          inCtx.fillStyle = '#555';
          inCtx.font = 'bold 24px Arial';
          inCtx.textAlign = 'center';
          inCtx.textBaseline = 'middle';
          inCtx.fillText(currClip.name || 'Video', width / 2, height / 2);

          // Clear the transition area and render the composite
          ctx.save();
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          transitionDef.render(ctx, outCanvas, inCanvas, progress, width, height);
          ctx.restore();
        }
      }
    }

    // If no clips, show placeholder
    if (clips.length === 0) {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#555';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No content at current time', width / 2, height / 2);
    }
  }, [currentTime, projectSettings, getVisibleClipsAtTime, tracks]);

  // Calculate display size maintaining aspect ratio
  const aspect = projectSettings.width / projectSettings.height;

  return (
    <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ aspectRatio: aspect }}
      />
    </div>
  );
}
