import VideoEffect from './VideoEffect.js';

export default class VignetteEffect extends VideoEffect {
  constructor() {
    super({
      id: 'vignette',
      name: 'Vignette',
      category: 'stylize',
      params: [
        { name: 'intensity', label: 'Intensity', type: 'number', default: 0, min: 0, max: 100, step: 1 },
        { name: 'size', label: 'Size', type: 'number', default: 50, min: 10, max: 100, step: 1 },
      ],
    });
  }

  get usesPixelManipulation() {
    return true;
  }

  applyToCanvas(ctx, values, rect) {
    const { intensity, size } = values;
    if (intensity <= 0) return;

    const { x, y, width, height } = rect;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const innerR = maxR * (size / 100);

    const gradient = ctx.createRadialGradient(cx, cy, innerR * 0.5, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, `rgba(0,0,0,${(intensity / 100) * 0.3})`);
    gradient.addColorStop(1, `rgba(0,0,0,${(intensity / 100) * 0.85})`);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  toFFmpegFilter(values) {
    if (values.intensity <= 0) return '';
    const angle = Math.PI / 2 * (values.size / 100);
    return `vignette=angle=${angle.toFixed(2)}`;
  }
}
