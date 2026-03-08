import VideoEffect from './VideoEffect.js';

export default class TemperatureEffect extends VideoEffect {
  constructor() {
    super('temperature', 'Temperature', { usesPixelManipulation: true });
    this.params = [{ key: 'value', label: 'Temp', min: -100, max: 100, step: 1, default: 0 }];
  }

  getDefaults() { return { value: 0 }; }

  applyToCanvas(ctx, values, rect) {
    const v = values.value || 0;
    if (v === 0) return;

    const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
    const d = imageData.data;
    const shift = v * 0.6; // map -100..100 to pixel shift

    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, d[i] + shift));       // R: warm = +R
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] - shift)); // B: warm = -B
    }

    ctx.putImageData(imageData, rect.x, rect.y);
  }

  toFFmpegFilter(values) {
    const v = values.value || 0;
    if (v === 0) return '';
    const r = 1 + v / 100;
    const b = 1 - v / 100;
    return `colorbalance=rs=${((r - 1) * 0.3).toFixed(2)}:bs=${((b - 1) * 0.3).toFixed(2)}`;
  }
}
