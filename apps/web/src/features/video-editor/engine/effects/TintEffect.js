import VideoEffect from './VideoEffect.js';

export default class TintEffect extends VideoEffect {
  constructor() {
    super('tint', 'Tint', { usesPixelManipulation: true });
    this.params = [{ key: 'value', label: 'Tint', min: -100, max: 100, step: 1, default: 0 }];
  }

  getDefaults() { return { value: 0 }; }

  applyToCanvas(ctx, values, rect) {
    const v = values.value || 0;
    if (v === 0) return;

    const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    const d = imageData.data;
    const shift = v * 0.5;

    for (let i = 0; i < d.length; i += 4) {
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + shift)); // G: tint shifts green
    }

    ctx.putImageData(imageData, rect.x, rect.y);
  }

  toFFmpegFilter(values) {
    const v = values.value || 0;
    if (v === 0) return '';
    return `colorbalance=gs=${(v / 300).toFixed(2)}`;
  }
}
