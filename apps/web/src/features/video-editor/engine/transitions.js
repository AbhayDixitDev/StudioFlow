/**
 * Transition definitions and rendering.
 * Each transition composites two frames (outgoing + incoming) based on progress (0-1).
 */

const transitions = {
  crossfade: {
    id: 'crossfade',
    name: 'Crossfade',
    category: 'fade',
    ffmpeg: (duration, offset) => `xfade=transition=fade:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      ctx.globalAlpha = 1 - progress;
      ctx.drawImage(outCanvas, 0, 0, width, height);
      ctx.globalAlpha = progress;
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.globalAlpha = 1;
    },
  },

  slideLeft: {
    id: 'slideLeft',
    name: 'Slide Left',
    category: 'slide',
    ffmpeg: (duration, offset) => `xfade=transition=slideleft:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const offset = progress * width;
      ctx.drawImage(outCanvas, -offset, 0, width, height);
      ctx.drawImage(inCanvas, width - offset, 0, width, height);
    },
  },

  slideRight: {
    id: 'slideRight',
    name: 'Slide Right',
    category: 'slide',
    ffmpeg: (duration, offset) => `xfade=transition=slideright:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const offset = progress * width;
      ctx.drawImage(outCanvas, offset, 0, width, height);
      ctx.drawImage(inCanvas, -width + offset, 0, width, height);
    },
  },

  slideUp: {
    id: 'slideUp',
    name: 'Slide Up',
    category: 'slide',
    ffmpeg: (duration, offset) => `xfade=transition=slideup:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const offset = progress * height;
      ctx.drawImage(outCanvas, 0, -offset, width, height);
      ctx.drawImage(inCanvas, 0, height - offset, width, height);
    },
  },

  slideDown: {
    id: 'slideDown',
    name: 'Slide Down',
    category: 'slide',
    ffmpeg: (duration, offset) => `xfade=transition=slidedown:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const offset = progress * height;
      ctx.drawImage(outCanvas, 0, offset, width, height);
      ctx.drawImage(inCanvas, 0, -height + offset, width, height);
    },
  },

  wipeHorizontal: {
    id: 'wipeHorizontal',
    name: 'Wipe Horizontal',
    category: 'wipe',
    ffmpeg: (duration, offset) => `xfade=transition=wipeleft:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const wipeX = progress * width;
      // Draw outgoing full
      ctx.drawImage(outCanvas, 0, 0, width, height);
      // Clip incoming to revealed region
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, wipeX, height);
      ctx.clip();
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.restore();
    },
  },

  wipeVertical: {
    id: 'wipeVertical',
    name: 'Wipe Vertical',
    category: 'wipe',
    ffmpeg: (duration, offset) => `xfade=transition=wipeup:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      const wipeY = progress * height;
      ctx.drawImage(outCanvas, 0, 0, width, height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, wipeY);
      ctx.clip();
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.restore();
    },
  },

  wipeDiagonal: {
    id: 'wipeDiagonal',
    name: 'Wipe Diagonal',
    category: 'wipe',
    ffmpeg: (duration, offset) => `xfade=transition=wipeleft:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      ctx.drawImage(outCanvas, 0, 0, width, height);
      ctx.save();
      ctx.beginPath();
      // Diagonal line from top-left to bottom-right, swept by progress
      const diag = (width + height) * progress;
      ctx.moveTo(0, 0);
      ctx.lineTo(diag, 0);
      ctx.lineTo(0, diag);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.restore();
    },
  },

  zoomIn: {
    id: 'zoomIn',
    name: 'Zoom In',
    category: 'zoom',
    ffmpeg: (duration, offset) => `xfade=transition=zoomin:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      // Outgoing zooms in and fades
      const outScale = 1 + progress * 0.5;
      const outAlpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = outAlpha;
      ctx.translate(width / 2, height / 2);
      ctx.scale(outScale, outScale);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(outCanvas, 0, 0, width, height);
      ctx.restore();

      // Incoming fades in
      ctx.globalAlpha = progress;
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.globalAlpha = 1;
    },
  },

  zoomOut: {
    id: 'zoomOut',
    name: 'Zoom Out',
    category: 'zoom',
    ffmpeg: (duration, offset) => `xfade=transition=zoomin:duration=${duration}:offset=${offset}`,
    render(ctx, outCanvas, inCanvas, progress, width, height) {
      // Outgoing shrinks
      const outScale = 1 - progress * 0.5;
      const outAlpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = outAlpha;
      ctx.translate(width / 2, height / 2);
      ctx.scale(outScale, outScale);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(outCanvas, 0, 0, width, height);
      ctx.restore();

      // Incoming zooms in from larger
      const inScale = 1.5 - progress * 0.5;
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.translate(width / 2, height / 2);
      ctx.scale(inScale, inScale);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(inCanvas, 0, 0, width, height);
      ctx.restore();
      ctx.globalAlpha = 1;
    },
  },
};

export function getTransition(id) {
  return transitions[id] || null;
}

export function getAllTransitions() {
  return Object.values(transitions);
}

export function getTransitionsByCategory(category) {
  return Object.values(transitions).filter((t) => t.category === category);
}

export function getTransitionCategories() {
  const cats = new Set();
  for (const t of Object.values(transitions)) cats.add(t.category);
  return Array.from(cats);
}

export default transitions;
